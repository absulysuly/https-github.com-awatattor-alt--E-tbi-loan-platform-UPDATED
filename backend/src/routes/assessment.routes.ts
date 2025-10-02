import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { RiskEngineService } from '../services/riskEngine.service';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/assessments/generate
 * @desc    Generate risk assessment for a loan application
 * @access  Private (LOAN_OFFICER, UNDERWRITER, SENIOR_UNDERWRITER, RISK_ANALYST, ADMIN)
 */
router.post(
  '/generate',
  authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'SENIOR_UNDERWRITER', 'RISK_ANALYST'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { applicationId, configVersion } = req.body;

      if (!applicationId) {
        throw new AppError('applicationId is required', 400);
      }

      // Verify application exists
      const application = await prisma.loanApplication.findUnique({
        where: { id: applicationId },
        include: { applicant: true },
      });

      if (!application) {
        throw new AppError('Application not found', 404);
      }

      // Check access rights
      if (
        req.user.role !== 'ADMIN' &&
        req.user.role !== 'SENIOR_UNDERWRITER' &&
        req.user.role !== 'RISK_ANALYST' &&
        application.assignedToId !== req.user.id
      ) {
        throw new AppError('Not authorized to assess this application', 403);
      }

      // Generate risk assessment using Risk Engine
      const assessmentResult = await RiskEngineService.assessLoanApplication(
        applicationId,
        configVersion
      );

      // Get config version
      const config = configVersion
        ? await prisma.riskConfiguration.findUnique({
            where: { version: configVersion },
          })
        : await prisma.riskConfiguration.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          });

      if (!config) {
        throw new AppError('Risk configuration not found', 500);
      }

      // Extract key risk indicators
      const keyRiskIndicators = assessmentResult.keyRiskIndicators;

      // Create assessment record
      const assessment = await prisma.riskAssessment.create({
        data: {
          applicationId,
          officerId: req.user.id,
          riskScore: assessmentResult.riskScore,
          riskCategory: assessmentResult.riskCategory,
          recommendation: assessmentResult.recommendation,
          confidence: assessmentResult.confidence,
          factorScores: assessmentResult.factorScores as any,
          keyRiskIndicators,
          mitigationSuggestions: assessmentResult.mitigationSuggestions,
          summaryEn: `Risk assessment for ${application.applicant.firstName} ${application.applicant.lastName}: ${assessmentResult.riskCategory} risk with ${assessmentResult.riskScore.toFixed(1)} score. Recommendation: ${assessmentResult.recommendation}`,
          explainabilityData: assessmentResult.explainability,
          modelVersion: '1.0.0',
          configVersion: config.version,
          humanReviewRequired: 
            assessmentResult.recommendation === 'REVIEW' ||
            assessmentResult.confidence < 70 ||
            keyRiskIndicators.length > 0,
        },
        include: {
          officer: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          application: {
            select: {
              id: true,
              applicationNumber: true,
              loanAmount: true,
              loanPurpose: true,
            },
          },
        },
      });

      // Update application with latest risk score and level
      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          currentRiskScore: assessmentResult.riskScore,
          currentRiskLevel: assessmentResult.riskCategory,
          status: assessmentResult.recommendation === 'REJECT' ? 'REJECTED' :
                  assessmentResult.recommendation === 'APPROVE' ? 'RISK_ASSESSMENT' :
                  'MANUAL_REVIEW',
        },
      });

      // Log assessment generation
      await AuditLogService.logFromRequest(
        req,
        'CREATE',
        'RiskAssessment',
        assessment.id,
        {
          riskScore: assessmentResult.riskScore,
          riskCategory: assessmentResult.riskCategory,
          recommendation: assessmentResult.recommendation,
        },
        undefined,
        {
          applicationId,
          riskLevel: assessmentResult.riskCategory === 'CRITICAL' || assessmentResult.riskCategory === 'HIGH' 
            ? 'HIGH' 
            : 'MEDIUM',
        }
      );

      res.status(201).json({
        success: true,
        message: 'Risk assessment generated successfully',
        data: {
          assessment,
          details: assessmentResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/assessments/:id
 * @desc    Get a specific risk assessment
 * @access  Private
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const assessment = await prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        application: {
          include: {
            applicant: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                creditScore: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // Check access rights
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SENIOR_UNDERWRITER' &&
      req.user.role !== 'RISK_ANALYST' &&
      req.user.role !== 'COMPLIANCE_OFFICER' &&
      assessment.application.assignedToId !== req.user.id
    ) {
      throw new AppError('Access denied to this assessment', 403);
    }

    // Log read access
    await AuditLogService.logFromRequest(
      req,
      'READ',
      'RiskAssessment',
      id,
      undefined,
      undefined,
      { applicationId: assessment.applicationId }
    );

    res.json({
      success: true,
      data: { assessment },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/assessments/application/:applicationId
 * @desc    Get all assessments for a specific application
 * @access  Private
 */
router.get('/application/:applicationId', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { applicationId } = req.params;

    // Verify application exists and user has access
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Check access rights
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SENIOR_UNDERWRITER' &&
      req.user.role !== 'RISK_ANALYST' &&
      req.user.role !== 'COMPLIANCE_OFFICER' &&
      application.assignedToId !== req.user.id
    ) {
      throw new AppError('Access denied to this application', 403);
    }

    const assessments = await prisma.riskAssessment.findMany({
      where: { applicationId },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      data: { assessments },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/assessments/:id/explainability
 * @desc    Get detailed explainability data for an assessment
 * @access  Private
 */
router.get('/:id/explainability', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const assessment = await prisma.riskAssessment.findUnique({
      where: { id },
      select: {
        id: true,
        explainabilityData: true,
        factorScores: true,
        keyRiskIndicators: true,
        mitigationSuggestions: true,
        riskScore: true,
        riskCategory: true,
        recommendation: true,
        confidence: true,
        application: {
          select: {
            id: true,
            assignedToId: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // Check access rights
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SENIOR_UNDERWRITER' &&
      req.user.role !== 'RISK_ANALYST' &&
      req.user.role !== 'COMPLIANCE_OFFICER' &&
      assessment.application.assignedToId !== req.user.id
    ) {
      throw new AppError('Access denied to this assessment', 403);
    }

    res.json({
      success: true,
      data: {
        explainability: assessment.explainabilityData,
        factorScores: assessment.factorScores,
        keyRiskIndicators: assessment.keyRiskIndicators,
        mitigationSuggestions: assessment.mitigationSuggestions,
        summary: {
          riskScore: assessment.riskScore,
          riskCategory: assessment.riskCategory,
          recommendation: assessment.recommendation,
          confidence: assessment.confidence,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/assessments/:id/review
 * @desc    Add human review to an assessment
 * @access  Private (SENIOR_UNDERWRITER, RISK_ANALYST, ADMIN)
 */
router.patch(
  '/:id/review',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'RISK_ANALYST'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { reviewComments, finalDecision } = req.body;

      if (!reviewComments) {
        throw new AppError('Review comments are required', 400);
      }

      const assessment = await prisma.riskAssessment.findUnique({
        where: { id },
        include: { application: true },
      });

      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      // Update assessment with review
      const updatedAssessment = await prisma.riskAssessment.update({
        where: { id },
        data: {
          reviewComments,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
        include: {
          officer: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // If final decision provided, update application status
      if (finalDecision) {
        await prisma.loanApplication.update({
          where: { id: assessment.applicationId },
          data: {
            status: finalDecision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            reviewedAt: new Date(),
          },
        });
      }

      // Log review
      await AuditLogService.logFromRequest(
        req,
        'UPDATE',
        'RiskAssessment',
        id,
        { reviewComments, finalDecision },
        { reviewComments: assessment.reviewComments },
        {
          applicationId: assessment.applicationId,
          riskLevel: finalDecision === 'REJECT' ? 'HIGH' : 'MEDIUM',
        }
      );

      res.json({
        success: true,
        message: 'Assessment review added successfully',
        data: { assessment: updatedAssessment },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/assessments/:id/override
 * @desc    Override automated assessment recommendation
 * @access  Private (SENIOR_UNDERWRITER, ADMIN only)
 */
router.post(
  '/:id/override',
  authorize('ADMIN', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { newRecommendation, reason } = req.body;

      if (!newRecommendation || !reason) {
        throw new AppError('New recommendation and reason are required', 400);
      }

      const assessment = await prisma.riskAssessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      // Update assessment with override
      const updatedAssessment = await prisma.riskAssessment.update({
        where: { id },
        data: {
          recommendation: newRecommendation,
          reviewComments: `OVERRIDE: ${reason}`,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });

      // Update application status
      await prisma.loanApplication.update({
        where: { id: assessment.applicationId },
        data: {
          status: newRecommendation === 'APPROVE' ? 'APPROVED' : 
                  newRecommendation === 'REJECT' ? 'REJECTED' : 
                  'MANUAL_REVIEW',
          reviewedAt: new Date(),
        },
      });

      // Log override with HIGH risk level
      await AuditLogService.logFromRequest(
        req,
        'OVERRIDE',
        'RiskAssessment',
        id,
        {
          oldRecommendation: assessment.recommendation,
          newRecommendation,
          reason,
        },
        { recommendation: assessment.recommendation },
        {
          applicationId: assessment.applicationId,
          riskLevel: 'HIGH',
          complianceFlags: ['MANUAL_OVERRIDE'],
        }
      );

      res.json({
        success: true,
        message: 'Assessment recommendation overridden successfully',
        data: { assessment: updatedAssessment },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/assessments/stats/summary
 * @desc    Get assessment statistics
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST)
 */
router.get(
  '/stats/summary',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'RISK_ANALYST', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const [
        totalAssessments,
        byRiskCategory,
        byRecommendation,
        averageRiskScore,
        averageConfidence,
      ] = await Promise.all([
        prisma.riskAssessment.count(),
        prisma.riskAssessment.groupBy({
          by: ['riskCategory'],
          _count: true,
        }),
        prisma.riskAssessment.groupBy({
          by: ['recommendation'],
          _count: true,
        }),
        prisma.riskAssessment.aggregate({
          _avg: {
            riskScore: true,
          },
        }),
        prisma.riskAssessment.aggregate({
          _avg: {
            confidence: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalAssessments,
          byRiskCategory,
          byRecommendation,
          averageRiskScore: averageRiskScore._avg.riskScore,
          averageConfidence: averageConfidence._avg.confidence,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

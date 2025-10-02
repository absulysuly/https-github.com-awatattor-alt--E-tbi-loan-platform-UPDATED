import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/applications
 * @desc    List loan applications with filters and pagination
 * @access  Private (All authenticated users)
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const {
      status,
      assignedToId,
      riskLevel,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (riskLevel) where.currentRiskLevel = riskLevel;

    // Role-based filtering: regular users only see assigned applications
    if (req.user.role === 'LOAN_OFFICER' || req.user.role === 'UNDERWRITER') {
      where.assignedToId = req.user.id;
    }

    // Fetch applications
    const [applications, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
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
              email: true,
              role: true,
            },
          },
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.loanApplication.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/applications
 * @desc    Create a new loan application
 * @access  Private (LOAN_OFFICER, ADMIN)
 */
router.post(
  '/',
  authorize('ADMIN', 'LOAN_OFFICER', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { applicant, loanDetails } = req.body;

      // Validate required fields
      if (!applicant || !loanDetails) {
        throw new AppError('Applicant and loan details are required', 400);
      }

      // Get active risk configuration
      const activeConfig = await prisma.riskConfiguration.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeConfig) {
        throw new AppError('No active risk configuration found', 500);
      }

      // Create applicant and application in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create applicant
        const newApplicant = await tx.applicant.create({
          data: {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            middleName: applicant.middleName,
            dateOfBirth: new Date(applicant.dateOfBirth),
            nationalId: applicant.nationalId,
            nationality: applicant.nationality,
            maritalStatus: applicant.maritalStatus,
            dependents: applicant.dependents || 0,
            primaryPhone: applicant.primaryPhone,
            secondaryPhone: applicant.secondaryPhone,
            email: applicant.email,
            street: applicant.street,
            city: applicant.city,
            state: applicant.state,
            postalCode: applicant.postalCode,
            country: applicant.country || 'Iraq',
            residencyType: applicant.residencyType,
            yearsAtAddress: applicant.yearsAtAddress,
            annualIncome: applicant.annualIncome,
            monthlyIncome: applicant.monthlyIncome,
            otherIncome: applicant.otherIncome,
            monthlyExpenses: applicant.monthlyExpenses,
            debtToIncomeRatio: applicant.debtToIncomeRatio,
            netWorth: applicant.netWorth,
            employmentType: applicant.employmentType,
            employerName: applicant.employerName,
            jobTitle: applicant.jobTitle,
            yearsEmployed: applicant.yearsEmployed,
            yearsInIndustry: applicant.yearsInIndustry,
            employerAddress: applicant.employerAddress,
            creditScore: applicant.creditScore,
            creditScoreDate: new Date(applicant.creditScoreDate),
            creditBureau: applicant.creditBureau,
            previousDefaults: applicant.previousDefaults || 0,
          },
        });

        // Generate application number
        const appCount = await tx.loanApplication.count();
        const applicationNumber = `LA-${new Date().getFullYear()}-${String(
          appCount + 1
        ).padStart(6, '0')}`;

        // Create loan application
        const application = await tx.loanApplication.create({
          data: {
            applicationNumber,
            applicantId: newApplicant.id,
            loanAmount: loanDetails.loanAmount,
            loanPurpose: loanDetails.loanPurpose,
            requestedTerm: loanDetails.requestedTerm,
            interestRate: loanDetails.interestRate,
            collateralValue: loanDetails.collateralValue,
            collateralType: loanDetails.collateralType,
            collateralDescription: loanDetails.collateralDescription,
            configVersion: activeConfig.version,
            status: 'DRAFT',
          },
          include: {
            applicant: true,
          },
        });

        return { application, applicant: newApplicant };
      });

      // Log creation
      await AuditLogService.logFromRequest(
        req,
        'CREATE',
        'LoanApplication',
        result.application.id,
        result.application,
        undefined,
        { applicationId: result.application.id }
      );

      res.status(201).json({
        success: true,
        message: 'Loan application created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/applications/:id
 * @desc    Get a specific loan application
 * @access  Private
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        applicant: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assessments: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: {
            officer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            documentType: true,
            uploadedAt: true,
            ocrProcessed: true,
          },
        },
      },
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

    // Log read access
    await AuditLogService.logFromRequest(
      req,
      'READ',
      'LoanApplication',
      id,
      undefined,
      undefined,
      { applicationId: id }
    );

    res.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/applications/:id
 * @desc    Update a loan application
 * @access  Private (Assigned officer or Admin)
 */
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const updates = req.body;

    // Get current application
    const currentApp = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!currentApp) {
      throw new AppError('Application not found', 404);
    }

    // Check permissions
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SENIOR_UNDERWRITER' &&
      currentApp.assignedToId !== req.user.id
    ) {
      throw new AppError('Not authorized to update this application', 403);
    }

    // Don't allow status updates through this endpoint
    delete updates.status;
    delete updates.assignedToId;

    // Update application
    const updatedApp = await prisma.loanApplication.update({
      where: { id },
      data: updates,
      include: {
        applicant: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log update
    await AuditLogService.logFromRequest(
      req,
      'UPDATE',
      'LoanApplication',
      id,
      updates,
      currentApp,
      { applicationId: id }
    );

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updatedApp },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/applications/:id/assign
 * @desc    Assign application to a loan officer
 * @access  Private (ADMIN, SENIOR_UNDERWRITER)
 */
router.patch(
  '/:id/assign',
  authorize('ADMIN', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { assignedToId } = req.body;

      if (!assignedToId) {
        throw new AppError('assignedToId is required', 400);
      }

      // Verify assignee exists and has appropriate role
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignee) {
        throw new AppError('Assignee user not found', 404);
      }

      if (
        assignee.role !== 'LOAN_OFFICER' &&
        assignee.role !== 'UNDERWRITER' &&
        assignee.role !== 'SENIOR_UNDERWRITER'
      ) {
        throw new AppError('User cannot be assigned loan applications', 400);
      }

      // Update assignment
      const updatedApp = await prisma.loanApplication.update({
        where: { id },
        data: { assignedToId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Log assignment
      await AuditLogService.logFromRequest(
        req,
        'UPDATE',
        'LoanApplication',
        id,
        { assignedToId },
        { assignedToId: updatedApp.assignedToId },
        { applicationId: id }
      );

      res.json({
        success: true,
        message: 'Application assigned successfully',
        data: { application: updatedApp },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/v1/applications/:id/status
 * @desc    Update application status
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, assigned officer)
 */
router.patch('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    // Get current application
    const currentApp = await prisma.loanApplication.findUnique({
      where: { id },
    });

    if (!currentApp) {
      throw new AppError('Application not found', 404);
    }

    // Check permissions
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SENIOR_UNDERWRITER' &&
      currentApp.assignedToId !== req.user.id
    ) {
      throw new AppError('Not authorized to update this application status', 403);
    }

    // Update status
    const updatedApp = await prisma.loanApplication.update({
      where: { id },
      data: {
        status,
        ...(status === 'SUBMITTED' && { submittedAt: new Date() }),
        ...((['APPROVED', 'REJECTED'].includes(status)) && { reviewedAt: new Date() }),
      },
    });

    // Log status change
    await AuditLogService.logFromRequest(
      req,
      'UPDATE',
      'LoanApplication',
      id,
      { status, comment },
      { status: currentApp.status },
      {
        applicationId: id,
        riskLevel: status === 'REJECTED' ? 'MEDIUM' : 'LOW',
      }
    );

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: updatedApp },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/applications/:id
 * @desc    Delete a loan application (soft delete)
 * @access  Private (ADMIN only)
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      // Check if application exists
      const application = await prisma.loanApplication.findUnique({
        where: { id },
      });

      if (!application) {
        throw new AppError('Application not found', 404);
      }

      // In production, implement soft delete
      // For now, we'll actually delete
      await prisma.loanApplication.delete({
        where: { id },
      });

      // Log deletion
      await AuditLogService.logFromRequest(
        req,
        'DELETE',
        'LoanApplication',
        id,
        undefined,
        application,
        {
          applicationId: id,
          riskLevel: 'HIGH',
          complianceFlags: ['DATA_DELETION'],
        }
      );

      res.json({
        success: true,
        message: 'Application deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/applications/stats/summary
 * @desc    Get application statistics
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST)
 */
router.get(
  '/stats/summary',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'RISK_ANALYST', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const [
        totalApplications,
        byStatus,
        byRiskLevel,
        averageLoanAmount,
      ] = await Promise.all([
        prisma.loanApplication.count(),
        prisma.loanApplication.groupBy({
          by: ['status'],
          _count: true,
        }),
        prisma.loanApplication.groupBy({
          by: ['currentRiskLevel'],
          _count: true,
        }),
        prisma.loanApplication.aggregate({
          _avg: {
            loanAmount: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalApplications,
          byStatus,
          byRiskLevel,
          averageLoanAmount: averageLoanAmount._avg.loanAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/config/risk
 * @desc    Get active risk configuration
 * @access  Private (All authenticated users)
 */
router.get('/risk', async (req: AuthRequest, res, next) => {
  try {
    const config = await prisma.riskConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!config) {
      throw new AppError('No active risk configuration found', 404);
    }

    res.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/config/risk/history
 * @desc    Get all risk configuration versions
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST)
 */
router.get(
  '/risk/history',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'RISK_ANALYST', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const configs = await prisma.riskConfiguration.findMany({
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: { configs },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/config/risk/:version
 * @desc    Get specific risk configuration version
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST)
 */
router.get(
  '/risk/:version',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'RISK_ANALYST'),
  async (req: AuthRequest, res, next) => {
    try {
      const { version } = req.params;

      const config = await prisma.riskConfiguration.findUnique({
        where: { version },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!config) {
        throw new AppError('Configuration version not found', 404);
      }

      res.json({
        success: true,
        data: { config },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/config/risk
 * @desc    Create new risk configuration
 * @access  Private (ADMIN, SENIOR_UNDERWRITER)
 */
router.post(
  '/risk',
  authorize('ADMIN', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const {
        name,
        description,
        weightCreditHistory,
        weightIncomeStability,
        weightEmployment,
        weightCollateral,
        weightMarketConditions,
        weightDebtToIncomeRatio,
        thresholdLowRisk,
        thresholdMediumRisk,
        thresholdHighRisk,
        autoApproveThreshold,
        autoRejectThreshold,
        businessRules,
        requireHumanReview,
        auditAllDecisions,
        explainabilityRequired,
      } = req.body;

      // Validate required fields
      if (!name || !description) {
        throw new AppError('Name and description are required', 400);
      }

      // Validate weights sum to 100
      const totalWeight =
        weightCreditHistory +
        weightIncomeStability +
        weightEmployment +
        weightCollateral +
        weightMarketConditions +
        weightDebtToIncomeRatio;

      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new AppError(`Weights must sum to 100 (current: ${totalWeight})`, 400);
      }

      // Generate version number
      const configCount = await prisma.riskConfiguration.count();
      const version = `v${configCount + 1}.0`;

      // Create configuration
      const config = await prisma.riskConfiguration.create({
        data: {
          version,
          name,
          description,
          isActive: false, // New configs start inactive
          weightCreditHistory,
          weightIncomeStability,
          weightEmployment,
          weightCollateral,
          weightMarketConditions,
          weightDebtToIncomeRatio,
          thresholdLowRisk,
          thresholdMediumRisk,
          thresholdHighRisk,
          autoApproveThreshold,
          autoRejectThreshold,
          businessRules: businessRules || [],
          requireHumanReview: requireHumanReview ?? true,
          auditAllDecisions: auditAllDecisions ?? true,
          explainabilityRequired: explainabilityRequired ?? true,
          createdBy: req.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log creation
      await AuditLogService.logFromRequest(
        req,
        'CREATE',
        'RiskConfiguration',
        config.id,
        config,
        undefined,
        {
          riskLevel: 'MEDIUM',
          complianceFlags: ['CONFIG_CHANGE'],
        }
      );

      res.status(201).json({
        success: true,
        message: 'Risk configuration created successfully',
        data: { config },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/v1/config/risk/:version/activate
 * @desc    Activate a specific risk configuration version
 * @access  Private (ADMIN only)
 */
router.patch(
  '/risk/:version/activate',
  authorize('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { version } = req.params;

      // Check if config exists
      const config = await prisma.riskConfiguration.findUnique({
        where: { version },
      });

      if (!config) {
        throw new AppError('Configuration version not found', 404);
      }

      if (config.isActive) {
        throw new AppError('Configuration is already active', 400);
      }

      // Deactivate all other configs and activate this one
      await prisma.$transaction([
        prisma.riskConfiguration.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        }),
        prisma.riskConfiguration.update({
          where: { version },
          data: { isActive: true },
        }),
      ]);

      // Log activation
      await AuditLogService.logFromRequest(
        req,
        'CONFIG_CHANGE',
        'RiskConfiguration',
        config.id,
        { action: 'ACTIVATE', version },
        undefined,
        {
          riskLevel: 'HIGH',
          complianceFlags: ['CONFIG_ACTIVATION'],
        }
      );

      res.json({
        success: true,
        message: 'Configuration activated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/v1/config/risk/:version
 * @desc    Update risk configuration (only inactive configs can be updated)
 * @access  Private (ADMIN, SENIOR_UNDERWRITER)
 */
router.patch(
  '/risk/:version',
  authorize('ADMIN', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { version } = req.params;
      const updates = req.body;

      const config = await prisma.riskConfiguration.findUnique({
        where: { version },
      });

      if (!config) {
        throw new AppError('Configuration version not found', 404);
      }

      if (config.isActive) {
        throw new AppError('Cannot update active configuration. Create a new version instead.', 400);
      }

      // Don't allow version or isActive changes
      delete updates.version;
      delete updates.isActive;
      delete updates.createdBy;
      delete updates.createdAt;

      // If weights are updated, validate they sum to 100
      if (
        updates.weightCreditHistory !== undefined ||
        updates.weightIncomeStability !== undefined ||
        updates.weightEmployment !== undefined ||
        updates.weightCollateral !== undefined ||
        updates.weightMarketConditions !== undefined ||
        updates.weightDebtToIncomeRatio !== undefined
      ) {
        const totalWeight =
          (updates.weightCreditHistory ?? config.weightCreditHistory) +
          (updates.weightIncomeStability ?? config.weightIncomeStability) +
          (updates.weightEmployment ?? config.weightEmployment) +
          (updates.weightCollateral ?? config.weightCollateral) +
          (updates.weightMarketConditions ?? config.weightMarketConditions) +
          (updates.weightDebtToIncomeRatio ?? config.weightDebtToIncomeRatio);

        if (Math.abs(totalWeight - 100) > 0.01) {
          throw new AppError(`Weights must sum to 100 (current: ${totalWeight})`, 400);
        }
      }

      const updatedConfig = await prisma.riskConfiguration.update({
        where: { version },
        data: updates,
        include: {
          creator: {
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
        'RiskConfiguration',
        config.id,
        updates,
        config,
        {
          riskLevel: 'MEDIUM',
          complianceFlags: ['CONFIG_CHANGE'],
        }
      );

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: { config: updatedConfig },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/v1/config/risk/:version
 * @desc    Delete risk configuration (only inactive configs can be deleted)
 * @access  Private (ADMIN only)
 */
router.delete(
  '/risk/:version',
  authorize('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { version } = req.params;

      const config = await prisma.riskConfiguration.findUnique({
        where: { version },
      });

      if (!config) {
        throw new AppError('Configuration version not found', 404);
      }

      if (config.isActive) {
        throw new AppError('Cannot delete active configuration', 400);
      }

      await prisma.riskConfiguration.delete({
        where: { version },
      });

      // Log deletion
      await AuditLogService.logFromRequest(
        req,
        'DELETE',
        'RiskConfiguration',
        config.id,
        undefined,
        config,
        {
          riskLevel: 'HIGH',
          complianceFlags: ['CONFIG_DELETION'],
        }
      );

      res.json({
        success: true,
        message: 'Configuration deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

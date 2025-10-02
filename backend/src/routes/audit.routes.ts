import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication and specific roles
router.use(authenticate);

/**
 * @route   GET /api/v1/audit/logs
 * @desc    Query audit logs with filters
 * @access  Private (ADMIN, COMPLIANCE_OFFICER)
 */
router.get(
  '/logs',
  authorize('ADMIN', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const {
        userId,
        action,
        entityType,
        entityId,
        applicationId,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      const filters: any = {};

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action;
      if (entityType) filters.entityType = entityType as string;
      if (entityId) filters.entityId = entityId as string;
      if (applicationId) filters.applicationId = applicationId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      filters.limit = parseInt(limit as string);
      filters.offset = (parseInt(page as string) - 1) * filters.limit;

      const { logs, total } = await AuditLogService.queryLogs(filters);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page: parseInt(page as string),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/audit/entity/:type/:id
 * @desc    Get audit trail for a specific entity
 * @access  Private (ADMIN, COMPLIANCE_OFFICER, SENIOR_UNDERWRITER)
 */
router.get(
  '/entity/:type/:id',
  authorize('ADMIN', 'COMPLIANCE_OFFICER', 'SENIOR_UNDERWRITER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { type, id } = req.params;

      const auditTrail = await AuditLogService.getEntityAuditTrail(type, id);

      res.json({
        success: true,
        data: {
          entityType: type,
          entityId: id,
          auditTrail,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/audit/user/:userId
 * @desc    Get user activity audit logs
 * @access  Private (ADMIN, COMPLIANCE_OFFICER, or own activity)
 */
router.get('/user/:userId', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { userId } = req.params;

    // Users can view their own logs, admins and compliance can view any
    if (
      req.user.id !== userId &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'COMPLIANCE_OFFICER'
    ) {
      throw new AppError('Access denied', 403);
    }

    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/audit/export
 * @desc    Export audit logs (CSV format)
 * @access  Private (ADMIN, COMPLIANCE_OFFICER)
 */
router.get(
  '/export',
  authorize('ADMIN', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { startDate, endDate, format = 'json' } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      filters.limit = 10000; // Export limit

      const { logs } = await AuditLogService.queryLogs(filters);

      if (format === 'csv') {
        // Convert to CSV
        const csvHeaders = [
          'timestamp',
          'userId',
          'userEmail',
          'action',
          'entityType',
          'entityId',
          'ipAddress',
          'riskLevel',
        ].join(',');

        const csvRows = logs.map((log) =>
          [
            log.timestamp.toISOString(),
            log.userId,
            log.userEmail,
            log.action,
            log.entityType,
            log.entityId,
            log.ipAddress,
            log.riskLevel,
          ].join(',')
        );

        const csv = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        res.send(csv);
      } else {
        // JSON export
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=audit_logs.json'
        );
        res.json({
          exportedAt: new Date().toISOString(),
          recordCount: logs.length,
          logs,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/audit/stats/summary
 * @desc    Get audit log statistics
 * @access  Private (ADMIN, COMPLIANCE_OFFICER)
 */
router.get(
  '/stats/summary',
  authorize('ADMIN', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { days = '30' } = req.query;
      const daysNum = parseInt(days as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const [
        totalLogs,
        byAction,
        byRiskLevel,
        recentHighRiskActions,
        complianceIssues,
      ] = await Promise.all([
        prisma.auditLog.count({
          where: {
            timestamp: {
              gte: startDate,
            },
          },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where: {
            timestamp: {
              gte: startDate,
            },
          },
          _count: true,
        }),
        prisma.auditLog.groupBy({
          by: ['riskLevel'],
          where: {
            timestamp: {
              gte: startDate,
            },
          },
          _count: true,
        }),
        prisma.auditLog.findMany({
          where: {
            riskLevel: 'HIGH',
            timestamp: {
              gte: startDate,
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.count({
          where: {
            complianceFlags: {
              isEmpty: false,
            },
            timestamp: {
              gte: startDate,
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          period: `Last ${daysNum} days`,
          totalLogs,
          byAction,
          byRiskLevel,
          recentHighRiskActions,
          complianceIssues,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/audit/compliance/report
 * @desc    Generate compliance report
 * @access  Private (ADMIN, COMPLIANCE_OFFICER)
 */
router.get(
  '/compliance/report',
  authorize('ADMIN', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new AppError('startDate and endDate are required', 400);
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const [
        totalActions,
        failedLogins,
        dataModifications,
        configChanges,
        overrides,
        deletions,
        complianceFlaggedActions,
      ] = await Promise.all([
        prisma.auditLog.count({
          where: {
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: 'FAILED_LOGIN',
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: 'CONFIG_CHANGE',
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: 'OVERRIDE',
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.count({
          where: {
            action: 'DELETE',
            timestamp: { gte: start, lte: end },
          },
        }),
        prisma.auditLog.findMany({
          where: {
            complianceFlags: { isEmpty: false },
            timestamp: { gte: start, lte: end },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          reportPeriod: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          summary: {
            totalActions,
            failedLogins,
            dataModifications,
            configChanges,
            overrides,
            deletions,
            complianceFlaggedActionsCount: complianceFlaggedActions.length,
          },
          complianceFlaggedActions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import { prisma } from '../server';
import { AuditAction, RiskLogLevel } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

export interface AuditLogData {
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: any;
  previousValues?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  riskLevel?: RiskLogLevel;
  complianceFlags?: string[];
  applicationId?: string;
}

export class AuditLogService {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes || null,
          previousValues: data.previousValues || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          riskLevel: data.riskLevel || 'LOW',
          complianceFlags: data.complianceFlags || [],
          applicationId: data.applicationId || null,
        },
      });
    } catch (error) {
      // Log error but don't fail the original request
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log from Express request
   */
  static async logFromRequest(
    req: AuthRequest,
    action: AuditAction,
    entityType: string,
    entityId: string,
    changes?: any,
    previousValues?: any,
    options?: {
      riskLevel?: RiskLogLevel;
      complianceFlags?: string[];
      applicationId?: string;
    }
  ): Promise<void> {
    if (!req.user) {
      console.warn('Audit log attempted without authenticated user');
      return;
    }

    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const sessionId = req.get('x-session-id') || 'unknown';

    await this.log({
      userId: req.user.id,
      userEmail: req.user.email,
      action,
      entityType,
      entityId,
      changes,
      previousValues,
      ipAddress,
      userAgent,
      sessionId,
      riskLevel: options?.riskLevel,
      complianceFlags: options?.complianceFlags,
      applicationId: options?.applicationId,
    });
  }

  /**
   * Query audit logs
   */
  static async queryLogs(filters: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    applicationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.applicationId) where.applicationId = filters.applicationId;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit trail for a specific entity
   */
  static async getEntityAuditTrail(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
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
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        action: true,
        entityType: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Aggregate by action type
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: logs.length,
      actionCounts,
      recentActivity: logs.slice(0, 10),
    };
  }
}

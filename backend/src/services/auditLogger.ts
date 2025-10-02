/**
 * TBi Bank CSDR Audit Logging Service
 * 
 * Provides immutable audit trail for all critical operations:
 * - User authentication events
 * - Application CRUD operations
 * - Risk assessment generation
 * - Manual overrides
 * - Configuration changes
 * - Document uploads
 */

import { PrismaClient, AuditAction, RiskLogLevel } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  riskLevel?: RiskLogLevel;
  complianceFlags?: string[];
  applicationId?: string;
}

export class AuditLogger {
  /**
   * Log an audit event
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
          changes: data.changes || {},
          previousValues: data.previousValues || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          riskLevel: data.riskLevel || 'LOW',
          complianceFlags: data.complianceFlags || [],
          applicationId: data.applicationId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the application
      // But log to monitoring service in production
    }
  }

  /**
   * Log login event
   */
  static async logLogin(userId: string, userEmail: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'LOGIN',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
      sessionId: 'pending',
      riskLevel: 'LOW'
    });
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLogin(email: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.log({
      userId: 'unknown',
      userEmail: email,
      action: 'FAILED_LOGIN',
      entityType: 'User',
      entityId: 'unknown',
      ipAddress,
      userAgent,
      sessionId: 'n/a',
      riskLevel: 'MEDIUM'
    });
  }

  /**
   * Log application creation
   */
  static async logApplicationCreate(
    userId: string,
    userEmail: string,
    applicationId: string,
    applicationData: any,
    ipAddress: string,
    userAgent: string,
    sessionId: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'CREATE',
      entityType: 'LoanApplication',
      entityId: applicationId,
      changes: applicationData,
      ipAddress,
      userAgent,
      sessionId,
      riskLevel: 'LOW',
      applicationId
    });
  }

  /**
   * Log application update
   */
  static async logApplicationUpdate(
    userId: string,
    userEmail: string,
    applicationId: string,
    changes: any,
    previousValues: any,
    ipAddress: string,
    userAgent: string,
    sessionId: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'UPDATE',
      entityType: 'LoanApplication',
      entityId: applicationId,
      changes,
      previousValues,
      ipAddress,
      userAgent,
      sessionId,
      riskLevel: 'LOW',
      applicationId
    });
  }

  /**
   * Log manual override
   */
  static async logOverride(
    userId: string,
    userEmail: string,
    applicationId: string,
    overrideData: any,
    reason: string,
    ipAddress: string,
    userAgent: string,
    sessionId: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'OVERRIDE',
      entityType: 'LoanApplication',
      entityId: applicationId,
      changes: { ...overrideData, reason },
      ipAddress,
      userAgent,
      sessionId,
      riskLevel: 'HIGH',
      complianceFlags: ['MANUAL_OVERRIDE'],
      applicationId
    });
  }

  /**
   * Log configuration change
   */
  static async logConfigChange(
    userId: string,
    userEmail: string,
    configId: string,
    changes: any,
    previousValues: any,
    ipAddress: string,
    userAgent: string,
    sessionId: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'CONFIG_CHANGE',
      entityType: 'RiskConfiguration',
      entityId: configId,
      changes,
      previousValues,
      ipAddress,
      userAgent,
      sessionId,
      riskLevel: 'HIGH',
      complianceFlags: ['CONFIG_CHANGE']
    });
  }

  /**
   * Query audit logs with filters
   */
  static async query(filters: {
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
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }
}

export default AuditLogger;
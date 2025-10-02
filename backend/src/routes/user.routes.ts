import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    List all users
 * @access  Private (ADMIN, SENIOR_UNDERWRITER, COMPLIANCE_OFFICER)
 */
router.get(
  '/',
  authorize('ADMIN', 'SENIOR_UNDERWRITER', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const {
        role,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            mfaEnabled: true,
            accountLocked: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                assignedApplications: true,
                assessments: true,
              },
            },
          },
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          users,
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
  }
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Admin)
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    // Users can view their own profile, admins can view any
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        accountLocked: true,
        lockedUntil: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedApplications: true,
            assessments: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Own profile or Admin)
 */
router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const updates = req.body;

    // Users can update their own profile, admins can update any
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    // Regular users cannot change their role
    if (updates.role && req.user.role !== 'ADMIN') {
      throw new AppError('Only admins can change user roles', 403);
    }

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.mfaSecret;
    delete updates.accountLocked;
    delete updates.failedLoginAttempts;

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        updatedAt: true,
      },
    });

    // Log update
    await AuditLogService.logFromRequest(
      req,
      'UPDATE',
      'User',
      id,
      updates,
      currentUser
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
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

      // Can't delete yourself
      if (req.user.id === id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await prisma.user.delete({ where: { id } });

      // Log deletion
      await AuditLogService.logFromRequest(
        req,
        'DELETE',
        'User',
        id,
        undefined,
        user,
        {
          riskLevel: 'HIGH',
          complianceFlags: ['USER_DELETION'],
        }
      );

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/users/:id/activity
 * @desc    Get user activity summary
 * @access  Private (Own activity or Admin)
 */
router.get('/:id/activity', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { days = '30' } = req.query;

    // Users can view their own activity, admins can view any
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    const activity = await AuditLogService.getUserActivity(id, parseInt(days as string));

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/users/:id/unlock
 * @desc    Unlock a locked user account
 * @access  Private (ADMIN only)
 */
router.patch(
  '/:id/unlock',
  authorize('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.accountLocked) {
        throw new AppError('Account is not locked', 400);
      }

      await prisma.user.update({
        where: { id },
        data: {
          accountLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });

      // Log unlock
      await AuditLogService.logFromRequest(
        req,
        'UPDATE',
        'User',
        id,
        { action: 'UNLOCK_ACCOUNT' },
        undefined,
        { riskLevel: 'MEDIUM' }
      );

      res.json({
        success: true,
        message: 'User account unlocked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    Admin reset user password
 * @access  Private (ADMIN only)
 */
router.post(
  '/:id/reset-password',
  authorize('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      // Log password reset
      await AuditLogService.logFromRequest(
        req,
        'UPDATE',
        'User',
        id,
        { action: 'PASSWORD_RESET_BY_ADMIN' },
        undefined,
        { riskLevel: 'HIGH' }
      );

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/users/stats/summary
 * @desc    Get user statistics
 * @access  Private (ADMIN, COMPLIANCE_OFFICER)
 */
router.get(
  '/stats/summary',
  authorize('ADMIN', 'COMPLIANCE_OFFICER'),
  async (req: AuthRequest, res, next) => {
    try {
      const [totalUsers, byRole, lockedAccounts, mfaEnabled] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        prisma.user.count({ where: { accountLocked: true } }),
        prisma.user.count({ where: { mfaEnabled: true } }),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          byRole,
          lockedAccounts,
          mfaEnabled,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

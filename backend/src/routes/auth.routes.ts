import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { AuditLogService } from '../services/auditLog.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public (in production, should be Admin-only or invitation-based)
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (default role is VIEWER if not specified)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: role || 'VIEWER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.accountLocked) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AppError(
          `Account is locked until ${user.lockedUntil.toISOString()}`,
          403
        );
      } else {
        // Unlock account if lock period expired
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accountLocked: false,
            lockedUntil: null,
            failedLoginAttempts: 0,
          },
        });
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLocked: shouldLock,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
            : null,
        },
      });

      // Log failed login attempt
      await AuditLogService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'FAILED_LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        sessionId: 'none',
        riskLevel: shouldLock ? 'HIGH' : 'MEDIUM',
        complianceFlags: shouldLock ? ['ACCOUNT_LOCKED'] : [],
      });

      if (shouldLock) {
        throw new AppError(
          'Account locked due to multiple failed login attempts',
          403
        );
      }

      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log successful login
    await AuditLogService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      sessionId: token.substring(0, 10),
      riskLevel: 'LOW',
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token deletion + audit log)
 * @access  Private
 */
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Log logout
    await AuditLogService.logFromRequest(
      req,
      'LOGOUT',
      'User',
      req.user.id
    );

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
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
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Generate new token
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Log password change
    await AuditLogService.logFromRequest(
      req,
      'UPDATE',
      'User',
      user.id,
      { field: 'password' },
      undefined,
      { riskLevel: 'MEDIUM' }
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

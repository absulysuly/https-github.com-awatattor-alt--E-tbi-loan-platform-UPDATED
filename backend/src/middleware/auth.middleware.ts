import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../server';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountLocked: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if account is locked
    if (user.accountLocked) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        res.status(403).json({
          success: false,
          message: 'Account temporarily locked',
          lockedUntil: user.lockedUntil,
        });
        return;
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

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (jwtSecret) {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: UserRole;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(log, null, 2));
    }
  });

  next();
};

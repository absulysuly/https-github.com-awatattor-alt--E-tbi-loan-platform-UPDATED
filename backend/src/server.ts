import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import assessmentRoutes from './routes/assessment.routes';
import userRoutes from './routes/user.routes';
import configRoutes from './routes/config.routes';
import auditRoutes from './routes/audit.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3001;

// ======================
// Security Middleware
// ======================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ======================
// Request Processing
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// Logging
// ======================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// ======================
// Rate Limiting
// ======================
app.use(rateLimiter);

// ======================
// Health Check
// ======================
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ======================
// API Routes
// ======================
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/applications`, applicationRoutes);
app.use(`${API_VERSION}/assessments`, assessmentRoutes);
app.use(`${API_VERSION}/users`, userRoutes);
app.use(`${API_VERSION}/config`, configRoutes);
app.use(`${API_VERSION}/audit`, auditRoutes);

// ======================
// 404 Handler
// ======================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// ======================
// Error Handler
// ======================
app.use(errorHandler);

// ======================
// Graceful Shutdown
// ======================
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// ======================
// Start Server
// ======================
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   TBi Bank Risk Assessment Platform Server   ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base: http://localhost:${PORT}${API_VERSION}`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('Available endpoints:');
      console.log(`  POST   ${API_VERSION}/auth/login`);
      console.log(`  POST   ${API_VERSION}/auth/register`);
      console.log(`  GET    ${API_VERSION}/applications`);
      console.log(`  POST   ${API_VERSION}/applications`);
      console.log(`  GET    ${API_VERSION}/assessments/:id`);
      console.log(`  POST   ${API_VERSION}/assessments/generate`);
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;

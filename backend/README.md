# TBi Bank CSDR Loan Assessment Platform - Backend API

## 🚀 Overview

Production-ready backend API for the TBi Bank loan assessment platform with comprehensive risk scoring, audit logging, and role-based access control.

## ✨ Features

- **Multi-Factor Risk Assessment Engine**
  - Credit history analysis
  - Income stability evaluation
  - Employment verification
  - Collateral assessment
  - Market conditions integration
  - Debt-to-income ratio calculation

- **AI Explainability**
  - SHAP-like value contributions
  - Decision path visualization
  - Scenario analysis (what-if simulations)

- **Security & Compliance**
  - JWT authentication with MFA support
  - Role-based access control (RBAC)
  - Comprehensive audit logging
  - Rate limiting and DDoS protection
  - PII encryption support

- **Banking Roles**
  - Admin
  - Loan Officer
  - Senior Underwriter
  - Underwriter
  - Risk Analyst
  - Compliance Officer
  - Viewer

## 📋 Prerequisites

- Node.js ≥ 18.0.0
- PostgreSQL ≥ 14
- npm ≥ 9.0.0

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed database with sample data
   npm run db:seed
   ```

## 🏃 Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### Loan Applications
- `GET /api/v1/applications` - List applications
- `POST /api/v1/applications` - Create application
- `GET /api/v1/applications/:id` - Get application
- `PATCH /api/v1/applications/:id` - Update application
- `DELETE /api/v1/applications/:id` - Delete application

### Risk Assessments
- `POST /api/v1/assessments/generate` - Generate risk assessment
- `GET /api/v1/assessments/:id` - Get assessment details
- `GET /api/v1/assessments/application/:applicationId` - Get assessments for application

### Configuration
- `GET /api/v1/config/risk` - Get active risk configuration
- `POST /api/v1/config/risk` - Create risk configuration (Admin only)
- `PATCH /api/v1/config/risk/:version` - Update configuration

### Audit Logs
- `GET /api/v1/audit/logs` - Query audit logs (Admin/Compliance only)
- `GET /api/v1/audit/entity/:type/:id` - Get entity audit trail

### Users
- `GET /api/v1/users` - List users (Admin only)
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Database Management

```bash
# Open Prisma Studio (GUI)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (CAUTION: Deletes all data)
npm run db:reset

# Deploy migrations to production
npm run db:migrate:prod
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── middleware/       # Authentication, error handling, logging
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (Risk Engine, Audit, etc.)
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   └── server.ts         # Express app entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
├── tests/                # Test suites
└── dist/                 # Compiled output (production)
```

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Rotate JWT secrets regularly**
3. **Enable MFA for admin accounts**
4. **Review audit logs periodically**
5. **Keep dependencies updated**
6. **Use HTTPS in production**
7. **Implement proper CORS policies**
8. **Encrypt PII data at rest**

## 🚀 Deployment

### Using Docker:
```bash
docker build -t tbi-loan-backend .
docker run -p 3001:3001 --env-file .env tbi-loan-backend
```

### Using PM2:
```bash
npm run build
pm2 start dist/server.js --name tbi-loan-api
```

## 📊 Monitoring

- Health check: `GET /health`
- Metrics endpoint: `GET /metrics` (if configured)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting: `npm run lint`
5. Submit pull request

## 📝 License

MIT License - TBi Bank Technology Division

## 📞 Support

For issues or questions, contact the development team or create an issue in the repository.

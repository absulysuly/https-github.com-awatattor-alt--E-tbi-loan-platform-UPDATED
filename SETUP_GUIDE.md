# TBi Bank CSDR Platform - Complete Setup Guide

**Version**: 1.0.0-MVP  
**Last Updated**: October 2, 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18.x or higher | JavaScript runtime |
| **npm** | 9.x or higher | Package manager |
| **PostgreSQL** | 14.x or higher | Database |
| **Git** | Latest | Version control |

### Optional Tools

- **Docker** (for containerized deployment)
- **Prisma Studio** (included - database GUI)
- **Postman** or **Insomnia** (API testing)

---

## 💻 Local Development Setup

### Step 1: Clone the Repository

```powershell
# Navigate to your projects directory
cd E:\

# If cloning from Git
git clone <repository-url> tbi-loan-platform
cd tbi-loan-platform

# Or if already exists
cd tbi-loan-platform
```

### Step 2: Install Dependencies

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies (if applicable)
# cd frontend
# npm install
# cd ..
```

### Step 3: Verify Installation

```powershell
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check PostgreSQL
psql --version
# Should output: psql (PostgreSQL) 14.x or higher
```

---

## 🗄️ Database Setup

### Step 1: Install PostgreSQL (if not installed)

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the password you set for the `postgres` user
4. Default port: 5432

**Verify Installation:**
```powershell
psql -U postgres
# Enter your password
```

### Step 2: Create Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE tbi_loan_platform;

-- Create user (optional but recommended)
CREATE USER tbi_admin WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tbi_loan_platform TO tbi_admin;

-- Exit
\q
```

### Step 3: Configure Prisma

```powershell
# Navigate to backend
cd backend

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

**Expected Output:**
```
🌱 Starting database seed...
✅ Created users: admin@tbibank.com, officer@tbibank.com
✅ Created risk configuration: 1.0.0
✅ Application 1: TBI-2025-001 (Low-Medium Risk)
✅ Application 2: TBI-2025-002 (High Risk)
✅ Application 3: TBI-2025-003 (Low Risk - Approved)
✨ Seed complete!
```

---

## 🔐 Environment Configuration

### Step 1: Create Environment Files

```powershell
# Root directory
cp .env.example .env

# Backend directory
cd backend
cp .env.example .env
cd ..
```

### Step 2: Configure .env File

**Backend `.env` File:**

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/tbi_loan_platform"

# Authentication
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="another_secure_random_string_32_chars"

# API
PORT=3001
NODE_ENV=development

# Gemini AI (optional for MVP)
GEMINI_API_KEY="your_gemini_api_key_here"

# Security
BCRYPT_ROUNDS=10
SESSION_TIMEOUT=1800
MAX_LOGIN_ATTEMPTS=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### Step 3: Generate Secrets

```powershell
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or in PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

---

## 🚀 Running the Application

### Backend Development Server

```powershell
cd backend

# Start development server with hot reload
npm run dev

# Server will start at http://localhost:3001
```

**Expected Output:**
```
🚀 TBi Bank CSDR API Server
📡 Listening on port 3001
🗄️  Database connected
✅ Server ready!
```

### Open Prisma Studio (Database GUI)

```powershell
cd backend
npm run db:studio

# Opens at http://localhost:5555
```

### Frontend Development (if applicable)

```powershell
cd frontend
npm run dev

# Server will start at http://localhost:3000
```

---

## 🧪 Testing

### Run All Tests

```powershell
cd backend
npm test
```

### Run Tests in Watch Mode

```powershell
npm run test:watch
```

### Run Tests with Coverage

```powershell
npm run test:coverage
```

### Test Authentication

```powershell
# Using curl (install via: winget install curl)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@tbibank.com\",\"password\":\"demo123\"}"
```

### Test Risk Engine

```powershell
curl -X POST http://localhost:3001/api/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @sample-application.json
```

---

## 🌐 Deployment

### Option 1: Docker Deployment

**Step 1: Create Dockerfile**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**Step 2: Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: tbi_loan_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/tbi_loan_platform
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Step 3: Deploy**

```powershell
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate:prod

# Seed database
docker-compose exec backend npm run db:seed
```

### Option 2: Vercel Deployment

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel

# Set environment variables in Vercel dashboard
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add all required env vars
```

### Option 3: AWS Deployment

See `docs/DEPLOYMENT.md` for detailed AWS deployment guide.

---

## 🔍 Troubleshooting

### Issue: Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Start PostgreSQL if stopped
Start-Service postgresql-x64-14

# Verify connection
psql -U postgres -c "SELECT version();"
```

### Issue: Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
# PORT=3002
```

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```powershell
cd backend
npm run db:generate
```

### Issue: Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```powershell
# Reset database (WARNING: deletes all data!)
npm run db:migrate -- reset

# Or manually fix
psql -U postgres -d tbi_loan_platform

# Drop and recreate
DROP DATABASE tbi_loan_platform;
CREATE DATABASE tbi_loan_platform;
```

### Issue: Seed Script Fails

**Error**: `Unique constraint failed`

**Solution**:
```powershell
# Clean database first
psql -U postgres -d tbi_loan_platform -c "TRUNCATE users, applicants, loan_applications, risk_configurations, audit_logs, documents CASCADE;"

# Then re-seed
npm run db:seed
```

---

## 📚 Additional Resources

### Documentation

- **API Documentation**: `docs/API.md`
- **Security Guide**: `docs/SECURITY.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Architecture Overview**: `IMPLEMENTATION_STATUS.md`

### Login Credentials (Development)

```
Admin:
  Email: admin@tbibank.com
  Password: demo123

Loan Officer:
  Email: officer@tbibank.com
  Password: demo123
```

### Useful Commands

```powershell
# View database with Prisma Studio
npm run db:studio

# Generate ERD diagram
npx prisma-erd-generator

# Format Prisma schema
npx prisma format

# Check migration status
npx prisma migrate status

# View logs
npm run logs

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 🆘 Getting Help

### Common Commands Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run dev` |
| Run tests | `cd backend && npm test` |
| View database | `cd backend && npm run db:studio` |
| Generate Prisma | `cd backend && npm run db:generate` |
| Run migrations | `cd backend && npm run db:migrate` |
| Seed database | `cd backend && npm run db:seed` |
| Check logs | `docker-compose logs -f` (if using Docker) |

### Support Channels

- **Technical Issues**: Create an issue in the repository
- **Security Concerns**: Email security@tbibank.com
- **General Questions**: Check documentation first

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] PostgreSQL is running
- [ ] Database `tbi_loan_platform` exists
- [ ] Migrations completed successfully
- [ ] Seed data loaded (3 applications, 2 users)
- [ ] Backend server starts without errors
- [ ] Can access Prisma Studio at http://localhost:5555
- [ ] Can login with admin credentials
- [ ] Tests pass successfully
- [ ] Environment variables configured

---

**Setup Complete!** 🎉

Your TBi Bank CSDR Loan Assessment Platform is now ready for development.

Next steps:
1. Review the architecture in `IMPLEMENTATION_STATUS.md`
2. Explore the API in `docs/API.md`
3. Check security guidelines in `docs/SECURITY.md`
4. Start building frontend components!

---

*For questions or issues, refer to the troubleshooting section or contact the development team.*
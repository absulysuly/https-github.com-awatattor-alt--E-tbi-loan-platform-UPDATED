# Deployment Guide - TBi Bank Loan Assessment Platform

## 🚀 Quick Start with Docker

### Prerequisites
- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- 4GB RAM minimum
- 10GB disk space

### One-Command Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd risk-assessment-tbi

# Create environment file
cp .env.example .env

# Edit environment variables (IMPORTANT!)
# Set strong passwords for JWT_SECRET and DB_PASSWORD

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with sample data
docker-compose exec backend npx prisma db seed

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3001
# Database: localhost:5432
```

---

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
NODE_ENV=production
```

### Backend (`backend/.env`)
```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@database:5432/tbi_loan_db?schema=public"

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate strong secrets:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## 📦 Manual Deployment

### Backend

```bash
cd backend

# Install dependencies
npm ci --only=production

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Build TypeScript
npm run build

# Start server
npm start
```

### Frontend

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Serve with any static server
npx serve -s dist -l 3000
```

---

## ☁️ Cloud Deployment Options

### 1. **AWS (Recommended)**

#### Using AWS ECS + RDS

```bash
# Build and push images
docker build -t your-registry/tbi-backend:latest ./backend
docker build -t your-registry/tbi-frontend:latest .

docker push your-registry/tbi-backend:latest
docker push your-registry/tbi-frontend:latest

# Deploy using AWS ECS
aws ecs create-service \
  --cluster tbi-cluster \
  --service-name tbi-backend \
  --task-definition tbi-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Configure RDS PostgreSQL
- Instance: db.t3.medium (minimum)
- Storage: 100GB SSD
- Multi-AZ: Enabled for production
- Automated backups: 7 days retention

### 2. **Heroku**

#### Backend
```bash
cd backend
heroku create tbi-backend
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
git push heroku main
heroku run npx prisma migrate deploy
heroku run npx prisma db seed
```

#### Frontend
```bash
# Build locally
npm run build

# Deploy to Netlify, Vercel, or AWS S3
netlify deploy --prod --dir=dist
```

### 3. **DigitalOcean App Platform**

```yaml
# app.yaml
name: tbi-loan-platform

databases:
  - name: tbi-db
    engine: PG
    version: "15"
    size: basic-s
    num_nodes: 1

services:
  - name: backend
    github:
      repo: your-username/tbi-loan-platform
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npx prisma migrate deploy && npm start
    envs:
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET
        value: ${JWT_SECRET}
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${tbi-db.DATABASE_URL}
    http_port: 3001

  - name: frontend
    github:
      repo: your-username/tbi-loan-platform
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: dist
    envs:
      - key: VITE_API_BASE_URL
        value: ${backend.PUBLIC_URL}
```

### 4. **Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link database
railway add --database postgresql

# Set environment variables
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
railway up
```

### 5. **Azure**

```bash
# Create resource group
az group create --name tbi-rg --location eastus

# Create PostgreSQL
az postgres server create \
  --name tbi-postgres \
  --resource-group tbi-rg \
  --sku-name B_Gen5_1 \
  --storage-size 51200

# Create App Service
az appservice plan create --name tbi-plan --resource-group tbi-rg
az webapp create --name tbi-backend --plan tbi-plan --resource-group tbi-rg

# Deploy with Docker
az webapp config container set \
  --name tbi-backend \
  --resource-group tbi-rg \
  --docker-custom-image-name your-registry/tbi-backend:latest
```

---

## 🔒 Security Checklist

### Before Production:

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable database encryption at rest
- [ ] Configure automated backups
- [ ] Set up monitoring and alerts
- [ ] Enable rate limiting
- [ ] Review and restrict API access
- [ ] Set up DDoS protection
- [ ] Configure CSP headers
- [ ] Enable database connection pooling
- [ ] Set up log aggregation
- [ ] Configure error tracking (Sentry)

### Environment-Specific:

```bash
# Production
NODE_ENV=production
JWT_EXPIRES_IN=1h  # Shorter for better security

# Development
NODE_ENV=development
JWT_EXPIRES_IN=7d
```

---

## 📊 Monitoring & Logging

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database health
docker-compose exec database pg_isready -U postgres

# Frontend health
curl http://localhost/health
```

### Logs

```bash
# View all logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Database logs
docker-compose logs -f database

# Tail last 100 lines
docker-compose logs --tail=100 backend
```

### Recommended Monitoring Tools

- **Application Performance**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Log Aggregation**: ELK Stack, Splunk, Loggly
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Infrastructure**: Prometheus + Grafana

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# Manual backup
docker-compose exec database pg_dump -U postgres tbi_loan_db > backup.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U postgres tbi_loan_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Restore Database

```bash
# From backup file
cat backup.sql | docker-compose exec -T database psql -U postgres tbi_loan_db

# From compressed backup
gunzip -c backup_20240102_120000.sql.gz | docker-compose exec -T database psql -U postgres tbi_loan_db
```

---

## 🚦 CI/CD with GitHub Actions

The included `.github/workflows/ci-cd.yml` provides:

- ✅ Automated testing on push/PR
- ✅ Docker image building
- ✅ Security scanning
- ✅ Automated deployment

### Setup Secrets:

In GitHub repo settings → Secrets:

```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-token
JWT_SECRET=your-production-jwt-secret
DB_PASSWORD=your-database-password
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
```

### Load Balancer

```nginx
# nginx-lb.conf
upstream backend {
    least_conn;
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
    }
}
```

### Database Connection Pooling

```typescript
// backend/src/lib/database.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling
  pool: {
    timeout: 10,
    idleTimeoutMillis: 30000,
    max: 20,
  },
});
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Check database connection
docker-compose exec backend npx prisma db pull

# Rebuild
docker-compose up --build backend
```

### Database connection failed

```bash
# Check database status
docker-compose ps database

# Check connection string
docker-compose exec backend env | grep DATABASE_URL

# Restart database
docker-compose restart database
```

### Frontend can't reach backend

```bash
# Check CORS settings in backend/.env
FRONTEND_URL=http://your-frontend-url

# Check network connectivity
docker-compose exec frontend wget -O- http://backend:3001/health
```

---

## 📝 Post-Deployment

1. **Create first admin user** (via seed script)
2. **Test all critical flows**:
   - User login
   - Create application
   - Risk assessment
   - Approve/reject workflow
3. **Set up monitoring alerts**
4. **Configure automated backups**
5. **Document custom configurations**
6. **Train support team**

---

## 📞 Support

- GitHub Issues: [your-repo-url]/issues
- Documentation: See README.md
- Email: support@tbibank.com

---

**🎉 Your TBi Bank Loan Assessment Platform is now deployed!**

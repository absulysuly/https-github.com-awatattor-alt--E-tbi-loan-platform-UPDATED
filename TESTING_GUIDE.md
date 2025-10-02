# Testing Guide - TBi Bank Risk Assessment Platform

## 🚀 Quick Setup & Testing

### Prerequisites

1. **PostgreSQL installed and running**
   - Download from: https://www.postgresql.org/download/windows/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

2. **Node.js 18+ installed**
   - Check: `node --version`

3. **Git Bash or PowerShell**

---

## Step 1: Set Up PostgreSQL

### Option A: Using existing PostgreSQL

1. Open pgAdmin or psql
2. Create database:
   ```sql
   CREATE DATABASE tbi_loan_db;
   ```

3. Verify `.env` file in `backend` folder:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tbi_loan_db?schema=public"
   ```
   
   Update username/password if needed.

### Option B: Using Docker

```bash
docker run --name tbi-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tbi_loan_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## Step 2: Install Dependencies & Set Up Database

```bash
cd E:\risk-assessment-tbi\backend

# Install dependencies (if not done)
npm install

# Generate Prisma Client
npm run db:generate

# Run database migrations (creates tables)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

**Expected Output:**
```
🌱 Starting database seed...
🧹 Cleaning existing data...
✅ Existing data cleaned

👥 Creating users...
✅ Created 8 users

⚙️  Creating risk configuration...
✅ Created risk configuration: v1.0

📝 Creating loan applications...
✅ Created 5 loan applications with applicants

📊 Seed Summary:
═══════════════════════════════════════════════════════
👥 Users: 8
   - Admin: admin@tbibank.com
   - Senior Underwriter: senior.underwriter@tbibank.com
   ... etc
   🔑 Password for all users: Password123!
```

---

## Step 3: Start the Backend Server

```bash
# From backend directory
npm run dev
```

**Expected Output:**
```
✅ Database connected successfully

╔══════════════════════════════════════════════╗
║   TBi Bank Risk Assessment Platform Server   ║
╚══════════════════════════════════════════════╝

🚀 Server running on: http://localhost:3001
📊 Environment: development
🔗 API Base: http://localhost:3001/api/v1
❤️  Health Check: http://localhost:3001/health
```

**Keep this terminal open!**

---

## Step 4: Run Automated Tests

Open a **NEW terminal** and run:

```bash
cd E:\risk-assessment-tbi\backend
node test-api.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════
   TBi Bank Risk Assessment API - Test Suite
═══════════════════════════════════════════════════════

🏥 Testing Health Check...
✅ Status: 200

🔐 Testing Login...
✅ Login successful!

📝 Testing Get Applications...
✅ Applications retrieved!
Total applications: 5

⚙️  Testing Get Active Risk Configuration...
✅ Configuration retrieved!

🎯 Testing Generate Risk Assessment...
✅ Assessment generated!

═══════════════════════════════════════════════════════
                    Test Results
═══════════════════════════════════════════════════════
Health Check:          ✅ PASS
Login:                 ✅ PASS
Get Applications:      ✅ PASS
Get Configuration:     ✅ PASS
Generate Assessment:   ✅ PASS
═══════════════════════════════════════════════════════

✨ Tests Passed: 5/5

🎉 All tests passed! Your API is working correctly!
```

---

## Step 5: Manual Testing with Postman/Insomnia

### Import Environment

Create environment variables:
- `baseUrl`: `http://localhost:3001/api/v1`
- `token`: (will be set after login)

### Test Sequence

#### 1. Health Check
```http
GET http://localhost:3001/health
```

#### 2. Login
```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@tbibank.com",
  "password": "Password123!"
}
```

**Save the `token` from the response!**

#### 3. Get Applications
```http
GET http://localhost:3001/api/v1/applications
Authorization: Bearer {your-token-here}
```

#### 4. Generate Risk Assessment
```http
POST http://localhost:3001/api/v1/assessments/generate
Authorization: Bearer {your-token-here}
Content-Type: application/json

{
  "applicationId": "{application-id-from-step-3}"
}
```

#### 5. Get Assessment with Explainability
```http
GET http://localhost:3001/api/v1/assessments/{assessment-id}/explainability
Authorization: Bearer {your-token-here}
```

---

## Step 6: View Database with Prisma Studio

```bash
cd E:\risk-assessment-tbi\backend
npm run db:studio
```

Opens in browser at: `http://localhost:5555`

You can browse and edit all database records!

---

##  Test Users

All users have password: **Password123!**

| Email | Role | Access Level |
|-------|------|--------------|
| `admin@tbibank.com` | ADMIN | Full access |
| `senior.underwriter@tbibank.com` | SENIOR_UNDERWRITER | Assign, override, review |
| `loan.officer1@tbibank.com` | LOAN_OFFICER | Create applications |
| `loan.officer2@tbibank.com` | LOAN_OFFICER | Create applications |
| `underwriter@tbibank.com` | UNDERWRITER | Assess assigned apps |
| `risk.analyst@tbibank.com` | RISK_ANALYST | View all, analyze |
| `compliance@tbibank.com` | COMPLIANCE_OFFICER | View audit logs |
| `viewer@tbibank.com` | VIEWER | Read-only |

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Loan Application Flow

1. **Login as Loan Officer**
   ```json
   POST /api/v1/auth/login
   { "email": "loan.officer1@tbibank.com", "password": "Password123!" }
   ```

2. **View Applications**
   ```http
   GET /api/v1/applications
   ```

3. **Generate Risk Assessment**
   ```json
   POST /api/v1/assessments/generate
   { "applicationId": "LA-2025-000001-id" }
   ```

4. **View Assessment Details**
   ```http
   GET /api/v1/assessments/{assessment-id}
   ```

5. **Update Application Status**
   ```json
   PATCH /api/v1/applications/{app-id}/status
   { "status": "APPROVED", "comment": "Strong applicant profile" }
   ```

### Scenario 2: Override Assessment (Admin)

1. **Login as Admin**
2. **Generate Assessment** (gets REJECT recommendation)
3. **Override Decision**
   ```json
   POST /api/v1/assessments/{assessment-id}/override
   {
     "newRecommendation": "APPROVE",
     "reason": "Additional guarantor provided"
   }
   ```

4. **Check Audit Logs**
   ```http
   GET /api/v1/audit/logs?action=OVERRIDE
   ```

### Scenario 3: View Compliance Reports

1. **Login as Compliance Officer**
2. **Get Audit Summary**
   ```http
   GET /api/v1/audit/stats/summary?days=30
   ```

3. **Export Audit Logs**
   ```http
   GET /api/v1/audit/export?startDate=2025-09-01&endDate=2025-10-02&format=csv
   ```

4. **Generate Compliance Report**
   ```http
   GET /api/v1/audit/compliance/report?startDate=2025-09-01&endDate=2025-10-02
   ```

---

## 🔍 Key Features to Test

### ✅ Authentication
- [x] Login with different user roles
- [x] Failed login attempts (should lock after 5 attempts)
- [x] Token expiration
- [x] Password change

### ✅ Role-Based Access Control
- [x] Viewer cannot create applications
- [x] Loan Officer cannot access audit logs
- [x] Only Admin can delete users
- [x] Only Senior Underwriter can override assessments

### ✅ Risk Assessment Engine
- [x] Generate assessment for each application
- [x] Check risk scores match expected ranges
- [x] Verify SHAP values in explainability data
- [x] Test scenario simulations

### ✅ Audit Logging
- [x] All actions are logged
- [x] High-risk actions flagged (overrides, deletions)
- [x] Compliance reports generated
- [x] Entity audit trails complete

### ✅ Data Validation
- [x] Cannot create risk config with weights != 100
- [x] Cannot activate already active config
- [x] Cannot update active config
- [x] Email validation on registration

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `P1000: Authentication failed`

**Solution:**
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Try: `psql -U postgres -d tbi_loan_db`

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
```

### Prisma Client Not Found

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm run db:generate
```

### Migration Failed

**Error:** `Migration failed to apply`

**Solution:**
```bash
npm run db:reset  # ⚠️ Deletes all data!
npm run db:seed
```

---

## 📊 Expected Test Results

### Sample Risk Assessment Output

```json
{
  "success": true,
  "data": {
    "assessment": {
      "riskScore": 68.5,
      "riskCategory": "MEDIUM",
      "recommendation": "REVIEW",
      "confidence": 85,
      "factorScores": {
        "creditHistory": {
          "score": 75,
          "weight": 30,
          "weightedScore": 22.5
        },
        "incomeStability": { /* ... */ },
        "employment": { /* ... */ }
      },
      "keyRiskIndicators": [
        "creditHistory: Below average credit score",
        "employment: Self-employed - requires additional scrutiny"
      ],
      "mitigationSuggestions": [
        "Require co-signer with better credit history",
        "Request additional collateral or down payment"
      ]
    },
    "details": {
      "explainability": {
        "shapValues": {
          "creditHistory": 22.5,
          "incomeStability": 18.75,
          /* ... */
        },
        "decisionPath": [
          "Application received",
          "Data validation completed",
          /* ... */
        ],
        "scenarios": [
          {
            "name": "With 10% higher income",
            "change": "+10% monthly income",
            "newScore": 70.5,
            "impact": 2.0
          }
        ]
      }
    }
  }
}
```

---

## 🎯 Next Steps

After successful testing:

1. ✅ Test all 45+ API endpoints
2. ✅ Verify RBAC for each role
3. ✅ Test risk engine with different profiles
4. ✅ Generate compliance reports
5. → **Build frontend React components**
6. → **Create CI/CD pipelines**
7. → **Deploy to staging environment**

---

## 📞 Support

If you encounter issues:

1. Check server logs in terminal
2. View database: `npm run db:studio`
3. Check API_TESTING_GUIDE.md for detailed endpoint docs
4. Review IMPLEMENTATION_STATUS.md for progress

**Server Health:** http://localhost:3001/health  
**API Base:** http://localhost:3001/api/v1  
**Database Studio:** http://localhost:5555 (when running `npm run db:studio`)

---

## ✨ Success Criteria

✅ Server starts without errors  
✅ Health check returns 200  
✅ Login returns JWT token  
✅ Can list applications  
✅ Can generate risk assessments  
✅ Risk engine produces explainability data  
✅ Audit logs capture all actions  
✅ RBAC blocks unauthorized access  

**You're ready for production testing!** 🚀

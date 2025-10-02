# 🚀 Quick Start - Testing Your Backend API

## What We've Built

You now have a **production-ready REST API** with:
- ✅ **45+ endpoints** across 6 domains
- ✅ **Multi-factor risk assessment engine** with AI explainability
- ✅ **Role-based access control** (7 roles)
- ✅ **Comprehensive audit logging** for compliance
- ✅ **Security features** (JWT auth, rate limiting, account lockout)
- ✅ **Database schema** with Prisma ORM
- ✅ **Seed data** with 8 users and 5 sample loan applications

---

## 📝 Prerequisites Checklist

Before testing, make sure you have:

- [ ] **PostgreSQL** installed and running
  - Download: https://www.postgresql.org/download/windows/
  - Or Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`
  
- [ ] **Node.js 18+** installed
  - Check: `node --version`

- [ ] **Database created**: `tbi_loan_db`
  ```sql
  CREATE DATABASE tbi_loan_db;
  ```

---

## ⚡ 5-Minute Quick Test

### 1. Setup Database (One-time)

```powershell
cd E:\risk-assessment-tbi\backend

# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:migrate

# Load sample data
npm run db:seed
```

**You'll see:**
```
✨ Database seeded successfully!
👥 Users: 8
📝 Loan Applications: 5
🔑 Password for all users: Password123!
```

### 2. Start Server

```powershell
# Keep this terminal open
npm run dev
```

**Server starts at:** `http://localhost:3001`

### 3. Run Tests (New Terminal)

```powershell
cd E:\risk-assessment-tbi\backend
node test-api.js
```

**Expected:** `✨ Tests Passed: 5/5`

---

## 🎯 What Can You Test?

### Test Users (Password: `Password123!`)

| Email | Role |
|-------|------|
| `admin@tbibank.com` | Full system access |
| `loan.officer1@tbibank.com` | Create & manage applications |
| `senior.underwriter@tbibank.com` | Override decisions |
| `compliance@tbibank.com` | View audit logs |

### Key Endpoints to Try

#### 1. Login
```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@tbibank.com",
  "password": "Password123!"
}
```
→ Save the `token` from response

#### 2. Get Applications
```http
GET http://localhost:3001/api/v1/applications
Authorization: Bearer {your-token}
```

#### 3. Generate Risk Assessment
```http
POST http://localhost:3001/api/v1/assessments/generate
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "applicationId": "{get-from-step-2}"
}
```

#### 4. View Explainability Data
```http
GET http://localhost:3001/api/v1/assessments/{assessment-id}/explainability
Authorization: Bearer {your-token}
```

---

## 🔍 What to Look For

### ✅ Risk Assessment Response

You should see:
- **Risk Score**: 0-100 calculated from 6 factors
- **Risk Category**: LOW, MEDIUM, HIGH, or CRITICAL
- **Recommendation**: APPROVE, REVIEW, or REJECT
- **Confidence**: How confident the model is (0-100)
- **Factor Scores**: Breakdown of each risk factor
- **SHAP Values**: Explainability data showing factor contributions
- **Scenarios**: "What-if" simulations

### ✅ Security Features Working

- Account locks after 5 failed login attempts
- Only admins can delete users
- Only assigned officers can view their applications
- All actions logged to audit trail

### ✅ Audit Logging

Every action creates audit log entries:
```http
GET http://localhost:3001/api/v1/audit/logs
Authorization: Bearer {admin-or-compliance-token}
```

---

## 📊 View Database

```powershell
npm run db:studio
```
Opens browser at: `http://localhost:5555`

Browse and edit all database records in a GUI!

---

## 🐛 Common Issues

### "Database connection failed"
**Fix:** Make sure PostgreSQL is running
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*
```

### "Port 3001 already in use"
**Fix:** Kill the process using the port
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
```

### "Cannot find module '@prisma/client'"
**Fix:** Generate Prisma client
```powershell
npm run db:generate
```

---

## 📚 Full Documentation

- **`TESTING_GUIDE.md`** - Complete testing instructions
- **`API_TESTING_GUIDE.md`** - All 45+ endpoints documented
- **`backend/README.md`** - Backend setup guide
- **`IMPLEMENTATION_STATUS.md`** - Project progress & roadmap

---

## 🎉 Success Checklist

After running tests, you should have:

- [ ] Server running on port 3001
- [ ] Health check returns 200
- [ ] Can login and get JWT token
- [ ] Can list loan applications
- [ ] Can generate risk assessments
- [ ] Risk assessments include explainability data
- [ ] Audit logs capture all actions
- [ ] RBAC prevents unauthorized access

**If all checks pass, your API is production-ready!** ✅

---

## 🚀 Next Steps

1. ✅ **Test with Postman/Insomnia** - Import endpoints from API_TESTING_GUIDE.md
2. ✅ **Test all user roles** - Verify RBAC works correctly
3. ✅ **Test risk engine** - Generate assessments for all 5 applications
4. ✅ **Export audit logs** - Test compliance reports
5. → **Build frontend React components**
6. → **Deploy to staging environment**

---

## 💡 Pro Tips

### Generate More Test Data

Edit `prisma/seed.ts` and add more users/applications, then:
```powershell
npm run db:seed
```

### Reset Database

```powershell
npm run db:reset  # ⚠️ Deletes all data!
npm run db:seed
```

### Watch Server Logs

The development server shows:
- All HTTP requests
- Database queries (in dev mode)
- Audit log entries
- Errors with stack traces

---

## 📞 Quick Links

- **Health Check**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api/v1
- **Database Studio**: http://localhost:5555 (when running)
- **Postman Collection**: See API_TESTING_GUIDE.md

---

## ✨ You're All Set!

Your backend API is ready to test. Follow the steps above, and let me know if you encounter any issues!

**Happy Testing! 🚀**

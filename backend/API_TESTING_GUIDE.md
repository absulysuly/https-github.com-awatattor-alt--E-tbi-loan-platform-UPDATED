# TBi Bank Risk Assessment Platform - API Testing Guide

## 🚀 Quick Start

Base URL: `http://localhost:3001/api/v1`

## 📋 Prerequisites

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

3. **Create a `.env` file** in the backend directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tbi_loan_assessment"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

---

## 🔐 Authentication Routes

### 1. Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@tbibank.com",
  "password": "SecurePass123!",
  "name": "Admin User",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cuid123...",
      "email": "admin@tbibank.com",
      "name": "Admin User",
      "role": "ADMIN",
      "createdAt": "2025-10-02T10:00:00Z"
    }
  }
}
```

### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@tbibank.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid123...",
      "email": "admin@tbibank.com",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

**💡 Save the token for subsequent requests!**

### 3. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

### 4. Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

### 5. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

---

## 📝 Loan Application Routes

### 1. Create Application
```http
POST /api/v1/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "applicant": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-05-15",
    "nationalId": "1234567890",
    "nationality": "Iraqi",
    "maritalStatus": "MARRIED",
    "dependents": 2,
    "primaryPhone": "+964-770-123-4567",
    "email": "john.doe@email.com",
    "street": "123 Main Street",
    "city": "Baghdad",
    "state": "Baghdad",
    "postalCode": "10001",
    "residencyType": "OWN",
    "yearsAtAddress": 5,
    "annualIncome": 60000,
    "monthlyIncome": 5000,
    "otherIncome": 500,
    "monthlyExpenses": 2000,
    "debtToIncomeRatio": 0.35,
    "netWorth": 100000,
    "employmentType": "FULL_TIME",
    "employerName": "Tech Corp",
    "jobTitle": "Software Engineer",
    "yearsEmployed": 5,
    "yearsInIndustry": 8,
    "creditScore": 720,
    "creditScoreDate": "2025-09-01",
    "creditBureau": "EXPERIAN",
    "previousDefaults": 0
  },
  "loanDetails": {
    "loanAmount": 50000,
    "loanPurpose": "HOME_PURCHASE",
    "requestedTerm": 240,
    "interestRate": 5.5,
    "collateralValue": 75000,
    "collateralType": "REAL_ESTATE",
    "collateralDescription": "Residential property in Baghdad"
  }
}
```

### 2. List Applications
```http
GET /api/v1/applications?page=1&limit=20&status=SUBMITTED
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (DRAFT, SUBMITTED, UNDER_REVIEW, etc.)
- `assignedToId`: Filter by assigned officer ID
- `riskLevel`: Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

### 3. Get Application by ID
```http
GET /api/v1/applications/{applicationId}
Authorization: Bearer {token}
```

### 4. Update Application
```http
PATCH /api/v1/applications/{applicationId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "loanAmount": 55000,
  "requestedTerm": 300
}
```

### 5. Assign Application
```http
PATCH /api/v1/applications/{applicationId}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignedToId": "user-cuid-here"
}
```

**Required Role:** ADMIN or SENIOR_UNDERWRITER

### 6. Update Application Status
```http
PATCH /api/v1/applications/{applicationId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "UNDER_REVIEW",
  "comment": "Starting initial review"
}
```

### 7. Get Application Statistics
```http
GET /api/v1/applications/stats/summary
Authorization: Bearer {token}
```

**Required Role:** ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST, or COMPLIANCE_OFFICER

---

## 🎯 Risk Assessment Routes

### 1. Generate Risk Assessment
```http
POST /api/v1/assessments/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "applicationId": "application-cuid-here",
  "configVersion": "v1.0"
}
```

**Response includes:**
- Risk score (0-100)
- Risk category (LOW, MEDIUM, HIGH, CRITICAL)
- Recommendation (APPROVE, REVIEW, REJECT)
- Confidence level
- Factor scores breakdown
- Key risk indicators
- Mitigation suggestions
- SHAP-like explainability data

### 2. Get Assessment by ID
```http
GET /api/v1/assessments/{assessmentId}
Authorization: Bearer {token}
```

### 3. Get All Assessments for Application
```http
GET /api/v1/assessments/application/{applicationId}
Authorization: Bearer {token}
```

### 4. Get Explainability Data
```http
GET /api/v1/assessments/{assessmentId}/explainability
Authorization: Bearer {token}
```

**Returns:**
- SHAP values for each factor
- Decision path timeline
- "What-if" scenario simulations

### 5. Add Human Review
```http
PATCH /api/v1/assessments/{assessmentId}/review
Authorization: Bearer {token}
Content-Type: application/json

{
  "reviewComments": "Application requires additional income verification",
  "finalDecision": "REVIEW"
}
```

**Required Role:** ADMIN, SENIOR_UNDERWRITER, or RISK_ANALYST

### 6. Override Assessment
```http
POST /api/v1/assessments/{assessmentId}/override
Authorization: Bearer {token}
Content-Type: application/json

{
  "newRecommendation": "APPROVE",
  "reason": "Applicant provided additional collateral and guarantor"
}
```

**Required Role:** ADMIN or SENIOR_UNDERWRITER  
**⚠️ Logged as HIGH risk audit event**

### 7. Get Assessment Statistics
```http
GET /api/v1/assessments/stats/summary
Authorization: Bearer {token}
```

---

## 👥 User Management Routes

### 1. List Users
```http
GET /api/v1/users?page=1&limit=20&role=LOAN_OFFICER
Authorization: Bearer {token}
```

**Required Role:** ADMIN, SENIOR_UNDERWRITER, or COMPLIANCE_OFFICER

### 2. Get User by ID
```http
GET /api/v1/users/{userId}
Authorization: Bearer {token}
```

**Access:** Own profile or ADMIN

### 3. Update User
```http
PATCH /api/v1/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "SENIOR_UNDERWRITER"
}
```

**Note:** Only ADMIN can change roles

### 4. Delete User
```http
DELETE /api/v1/users/{userId}
Authorization: Bearer {token}
```

**Required Role:** ADMIN only

### 5. Unlock User Account
```http
PATCH /api/v1/users/{userId}/unlock
Authorization: Bearer {token}
```

**Required Role:** ADMIN

### 6. Admin Reset Password
```http
POST /api/v1/users/{userId}/reset-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPassword": "NewTempPass123!"
}
```

**Required Role:** ADMIN

### 7. Get User Activity
```http
GET /api/v1/users/{userId}/activity?days=30
Authorization: Bearer {token}
```

### 8. Get User Statistics
```http
GET /api/v1/users/stats/summary
Authorization: Bearer {token}
```

---

## ⚙️ Risk Configuration Routes

### 1. Get Active Configuration
```http
GET /api/v1/config/risk
Authorization: Bearer {token}
```

### 2. Get Configuration History
```http
GET /api/v1/config/risk/history
Authorization: Bearer {token}
```

**Required Role:** ADMIN, SENIOR_UNDERWRITER, RISK_ANALYST, or COMPLIANCE_OFFICER

### 3. Create New Configuration
```http
POST /api/v1/config/risk
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Standard Risk Model v2",
  "description": "Updated model with revised collateral weights",
  "weightCreditHistory": 30,
  "weightIncomeStability": 25,
  "weightEmployment": 15,
  "weightCollateral": 15,
  "weightMarketConditions": 5,
  "weightDebtToIncomeRatio": 10,
  "thresholdLowRisk": 30,
  "thresholdMediumRisk": 50,
  "thresholdHighRisk": 70,
  "autoApproveThreshold": 75,
  "autoRejectThreshold": 30,
  "businessRules": [],
  "requireHumanReview": true,
  "auditAllDecisions": true,
  "explainabilityRequired": true
}
```

**⚠️ Weights MUST sum to 100**  
**Required Role:** ADMIN or SENIOR_UNDERWRITER

### 4. Activate Configuration
```http
PATCH /api/v1/config/risk/{version}/activate
Authorization: Bearer {token}
```

**Required Role:** ADMIN only  
**⚠️ Deactivates all other configurations**

### 5. Update Configuration
```http
PATCH /api/v1/config/risk/{version}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "weightCreditHistory": 32,
  "weightIncomeStability": 23
}
```

**Note:** Can only update inactive configurations

### 6. Delete Configuration
```http
DELETE /api/v1/config/risk/{version}
Authorization: Bearer {token}
```

**Required Role:** ADMIN  
**Note:** Cannot delete active configuration

---

## 📊 Audit Log Routes

### 1. Query Audit Logs
```http
GET /api/v1/audit/logs?page=1&limit=50&action=LOGIN&startDate=2025-10-01&endDate=2025-10-02
Authorization: Bearer {token}
```

**Query Parameters:**
- `userId`: Filter by user ID
- `action`: Filter by action type
- `entityType`: Filter by entity type
- `entityId`: Filter by entity ID
- `applicationId`: Filter by application ID
- `startDate`: ISO date string
- `endDate`: ISO date string
- `page`: Page number
- `limit`: Items per page

**Required Role:** ADMIN or COMPLIANCE_OFFICER

### 2. Get Entity Audit Trail
```http
GET /api/v1/audit/entity/LoanApplication/{applicationId}
Authorization: Bearer {token}
```

**Required Role:** ADMIN, COMPLIANCE_OFFICER, or SENIOR_UNDERWRITER

### 3. Get User Activity Logs
```http
GET /api/v1/audit/user/{userId}
Authorization: Bearer {token}
```

**Access:** Own logs, or ADMIN/COMPLIANCE_OFFICER

### 4. Export Audit Logs
```http
GET /api/v1/audit/export?startDate=2025-09-01&endDate=2025-10-02&format=csv
Authorization: Bearer {token}
```

**Format:** `json` or `csv`  
**Required Role:** ADMIN or COMPLIANCE_OFFICER

### 5. Get Audit Statistics
```http
GET /api/v1/audit/stats/summary?days=30
Authorization: Bearer {token}
```

### 6. Generate Compliance Report
```http
GET /api/v1/audit/compliance/report?startDate=2025-09-01&endDate=2025-10-02
Authorization: Bearer {token}
```

**Required Role:** ADMIN or COMPLIANCE_OFFICER

---

## 🔑 Role-Based Access Control (RBAC)

### Roles and Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **ADMIN** | Full system access | All operations |
| **SENIOR_UNDERWRITER** | Senior decision maker | View all, assign, override, manage configs |
| **UNDERWRITER** | Mid-level assessor | Assess assigned applications |
| **LOAN_OFFICER** | Application manager | Create/update applications, generate assessments |
| **RISK_ANALYST** | Risk specialist | View all, analyze patterns, generate reports |
| **COMPLIANCE_OFFICER** | Audit oversight | View all audit logs, export data |
| **VIEWER** | Read-only access | View assigned applications only |

---

## 🧪 Testing Workflow

### Complete Application Flow

1. **Register/Login as Admin**
2. **Create Risk Configuration**
3. **Activate Configuration**
4. **Register Loan Officer**
5. **Login as Loan Officer**
6. **Create Loan Application**
7. **Generate Risk Assessment**
8. **Review Assessment Results**
9. **Update Application Status**
10. **Check Audit Logs (as Admin/Compliance)**

### Sample Test Sequence

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tbibank.com","password":"SecurePass123!"}'

# Save the token as TOKEN variable

# 2. Create Application
curl -X POST http://localhost:3001/api/v1/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @sample-application.json

# 3. Generate Assessment
curl -X POST http://localhost:3001/api/v1/assessments/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"applicationId":"app-id-here"}'
```

---

## ⚠️ Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["ADMIN", "SENIOR_UNDERWRITER"],
  "current": "LOAN_OFFICER"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Weights must sum to 100 (current: 98)"
}
```

---

## 📦 Postman Collection

Import this collection into Postman for quick testing:

1. Create new collection: "TBi Risk Assessment API"
2. Add environment variables:
   - `baseUrl`: `http://localhost:3001/api/v1`
   - `token`: (will be set after login)
3. Add pre-request script to automatically add Bearer token:
   ```javascript
   pm.request.headers.add({
     key: 'Authorization',
     value: 'Bearer ' + pm.environment.get('token')
   });
   ```

---

## 🎯 Next Steps

1. ✅ Test all authentication flows
2. ✅ Create test loan applications
3. ✅ Generate risk assessments
4. ✅ Test RBAC with different roles
5. ✅ Verify audit logging
6. ✅ Export compliance reports

---

## 📞 Support

For issues or questions:
- Check logs: `backend/logs/`
- Database GUI: `npm run db:studio`
- Health check: `GET http://localhost:3001/health`

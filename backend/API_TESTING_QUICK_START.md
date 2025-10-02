# API Testing Quick Start Guide

## Prerequisites
1. Database is set up and running (PostgreSQL or SQLite)
2. Database migrations have been run: `npm run db:migrate`
3. Database has been seeded: `npm run db:seed`
4. Backend server is running: `npm start` (port 3001)

---

## Seed Data Credentials

After running `npm run db:seed`, these users will be available:

| Email | Password | Role |
|-------|----------|------|
| admin@tbibank.com | Admin123! | ADMIN |
| manager@tbibank.com | Manager123! | MANAGER |
| underwriter@tbibank.com | Underwriter123! | UNDERWRITER |
| compliance@tbibank.com | Compliance123! | COMPLIANCE_OFFICER |
| viewer@tbibank.com | Viewer123! | VIEWER |

---

## Quick Test Flow

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-02T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

### 2. Login (Get JWT Token)
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "underwriter@tbibank.com",
    "password": "Underwriter123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "underwriter@tbibank.com",
      "name": "Jane Smith",
      "role": "UNDERWRITER"
    }
  }
}
```

**Important**: Copy the `token` value for subsequent requests.

---

### 3. Get Current User Profile
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 4. List Loan Applications
```bash
curl http://localhost:3001/api/v1/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 5. Get Active Risk Configuration
```bash
curl http://localhost:3001/api/v1/config/active \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 6. Calculate Risk Score
```bash
curl -X POST http://localhost:3001/api/v1/assessments/calculate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantData": {
      "monthlyIncome": 5000,
      "employmentYears": 3,
      "creditScore": 720,
      "existingDebts": 800,
      "requestedAmount": 20000,
      "collateralValue": 25000
    }
  }'
```

Expected response includes:
- Risk score (0-100)
- Risk category (LOW/MEDIUM/HIGH/CRITICAL)
- Factor contributions (explainability)
- Recommendation

---

### 7. Create a New Loan Application
```bash
curl -X POST http://localhost:3001/api/v1/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-15",
      "ssn": "123-45-6789",
      "employmentStatus": "FULL_TIME",
      "employer": "Tech Corp",
      "monthlyIncome": 6000,
      "creditScore": 750
    },
    "loanDetails": {
      "amount": 30000,
      "purpose": "Home Improvement",
      "termMonths": 60
    }
  }'
```

---

### 8. Submit Application for Review
```bash
curl -X POST http://localhost:3001/api/v1/applications/APPLICATION_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "All documents verified and uploaded"
  }'
```

---

### 9. Create Risk Assessment (for an application)
```bash
curl -X POST http://localhost:3001/api/v1/assessments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "APPLICATION_ID_HERE",
    "applicantData": {
      "monthlyIncome": 6000,
      "employmentYears": 5,
      "creditScore": 750,
      "existingDebts": 1000,
      "requestedAmount": 30000,
      "collateralValue": 40000
    },
    "notes": "Initial risk assessment"
  }'
```

---

### 10. Get Explainability for Assessment
```bash
curl http://localhost:3001/api/v1/assessments/ASSESSMENT_ID/explainability \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

This returns SHAP-like explanations showing:
- Which factors contributed most to the risk score
- Positive and negative influences
- Factor scores and weights

---

### 11. Generate Alternative Scenarios
```bash
curl -X POST http://localhost:3001/api/v1/assessments/ASSESSMENT_ID/scenarios \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "modifications": {
      "creditScore": 50,
      "monthlyIncome": 500
    }
  }'
```

This shows "what-if" scenarios:
- What if credit score improves by 50 points?
- What if monthly income increases by $500?

---

### 12. Review Application (as Manager)
Login as manager and:
```bash
curl -X POST http://localhost:3001/api/v1/applications/APPLICATION_ID/review \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "comments": "Good credit history and stable income",
    "conditions": ["Provide proof of collateral value"]
  }'
```

---

### 13. Get Audit Logs
```bash
curl http://localhost:3001/api/v1/audit?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Filter by action:
```bash
curl "http://localhost:3001/api/v1/audit?action=LOGIN&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 14. Get Compliance Logs (as Compliance Officer)
```bash
curl http://localhost:3001/api/v1/audit/compliance \
  -H "Authorization: Bearer COMPLIANCE_TOKEN"
```

---

### 15. Create New User (as Admin)
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@tbibank.com",
    "password": "SecurePass123!",
    "name": "New User",
    "role": "VIEWER"
  }'
```

---

## Testing with Postman

### Import Collection
1. Create a new Postman collection
2. Add environment variables:
   - `BASE_URL`: http://localhost:3001
   - `TOKEN`: (will be set after login)

3. Create requests for each endpoint above
4. Use `{{BASE_URL}}` and `{{TOKEN}}` variables

### Sample Environment Setup
```json
{
  "BASE_URL": "http://localhost:3001",
  "TOKEN": "",
  "ADMIN_EMAIL": "admin@tbibank.com",
  "ADMIN_PASSWORD": "Admin123!",
  "UNDERWRITER_EMAIL": "underwriter@tbibank.com",
  "UNDERWRITER_PASSWORD": "Underwriter123!"
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Role-Based Access Control (RBAC)

| Endpoint | ADMIN | MANAGER | UNDERWRITER | COMPLIANCE_OFFICER | VIEWER |
|----------|-------|---------|-------------|-------------------|--------|
| Create Application | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Applications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve Application | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Assessment | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Assessments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Override Risk | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage Config | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Troubleshooting

### "Authentication failed against database"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database exists: `psql -U postgres -c "\l"`

### "JWT_SECRET not configured"
- Check .env file has JWT_SECRET
- Restart the server after changing .env

### "Rate limit exceeded"
- Wait 15 minutes or restart server
- Check RATE_LIMIT settings in .env

### "Account locked"
- Wait 30 minutes or unlock via admin:
  ```bash
  curl -X POST http://localhost:3001/api/v1/users/USER_ID/lock \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"locked": false}'
  ```

---

## Next Steps

1. **Test all endpoints** with different user roles
2. **Verify RBAC** - ensure unauthorized access is blocked
3. **Test rate limiting** - make rapid requests to trigger limits
4. **Check audit logs** - verify all actions are logged
5. **Test validation** - try invalid data to ensure proper error handling
6. **Load testing** - use tools like Apache Bench or k6
7. **Integration testing** - run full workflows (create → assess → approve)

Happy Testing! 🚀

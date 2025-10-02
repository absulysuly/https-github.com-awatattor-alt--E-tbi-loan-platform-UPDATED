# 🚀 Quick Testing Guide

## Start the System

### Terminal 1 - Backend
```powershell
cd E:\risk-assessment-tbi\backend
npm run dev
```

**Wait for this message:**
```
✅ Database connected successfully
🚀 Server running on: http://localhost:3001
```

### Terminal 2 - Frontend  
```powershell
cd E:\risk-assessment-tbi
npm run dev
```

**Wait for this message:**
```
➜  Local:   http://localhost:5173/
```

---

## Test in Browser

1. **Open:** http://localhost:5173

2. **Login with:**
   - Email: `admin@tbibank.com`
   - Password: `Password123!`

3. **You should see:** Dashboard with 5 loan applications

---

## Test Users (all use password: `Password123!`)

- `admin@tbibank.com` - Full access
- `loan.officer1@tbibank.com` - Create/manage applications
- `senior.underwriter@tbibank.com` - Approve/reject
- `risk.analyst@tbibank.com` - Generate assessments
- `compliance@tbibank.com` - View audit logs
- `viewer@tbibank.com` - Read-only

---

## Quick Tests

✅ **Login:** Use any test user above  
✅ **View Applications:** See dashboard with 5 applications  
✅ **Click Application:** View details of LA-2025-000001  
✅ **Create Application:** Click "New Application" button  
✅ **Generate Assessment:** Open app, click "Generate Risk Assessment"  
✅ **Approve/Reject:** Login as senior underwriter, approve/reject application  

---

## API Health Check

Open in browser: http://localhost:3001/health

Or run from PowerShell:
```powershell
node test-backend.mjs
```

Expected: JSON response with `"status": "healthy"`

---

## If Something Breaks

1. **Check both terminal windows** for error messages
2. **Check browser console** (Press F12)
3. **Restart both servers** (Ctrl+C then re-run npm commands)
4. **Clear browser cache** and localStorage
5. **Re-seed database:** `cd backend && npm run db:seed`

---

## Database Note

📌 Currently using **SQLite** (`backend/dev.db`) for quick testing.  
To switch to PostgreSQL later, see `README.md` deployment section.

---

**That's it! You're testing! 🎉**

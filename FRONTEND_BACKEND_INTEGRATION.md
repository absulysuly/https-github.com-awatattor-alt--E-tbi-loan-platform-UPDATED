# Frontend-Backend Integration Guide

## ✅ Completed Integration

### **1. API Client Setup**
- ✅ Axios instance with base URL configuration
- ✅ Request interceptor for JWT token injection
- ✅ Response interceptor for error handling
- ✅ Automatic 401 redirect to login
- ✅ Token management utilities
- ✅ Global error handler

### **2. TypeScript Types**
- ✅ Complete type definitions matching backend Prisma schema
- ✅ API request/response types
- ✅ Enums for User Roles, Application Status, Risk Categories
- ✅ Filter and pagination types

### **3. API Services**
Created service modules for all backend endpoints:

#### Authentication Service (`auth.service.ts`)
- `login(credentials)` - User authentication
- `logout()` - Logout and clear tokens
- `register(data)` - User registration
- `getCurrentUser()` - Get current user profile
- `refreshToken()` - Refresh JWT token
- `changePassword(data)` - Change user password

#### Applications Service (`applications.service.ts`)
- `getApplications(filters)` - List applications with pagination
- `getApplicationById(id)` - Get single application
- `createApplication(data)` - Create new application
- `updateApplication(id, data)` - Update application
- `deleteApplication(id)` - Delete application
- `submitApplication(id)` - Submit for review
- `reviewApplication(id, decision)` - Review application
- `approveApplication(id)` - Approve application
- `rejectApplication(id, reason)` - Reject application
- `getApplicationHistory(id)` - Get application history

#### Assessments Service (`assessments.service.ts`)
- `getAssessments(filters)` - List assessments
- `getAssessmentById(id)` - Get single assessment
- `createAssessment(data)` - Create risk assessment
- `calculateRisk(data)` - Calculate risk score
- `getExplainability(id)` - Get SHAP-like explanations
- `generateScenarios(id, modifications)` - What-if analysis
- `overrideRisk(id, newCategory, reason)` - Override risk
- `getAssessmentsByApplication(appId)` - Get assessments by application

### **4. Authentication Context**
- ✅ React Context for auth state management
- ✅ `useAuth()` hook for accessing auth state
- ✅ Automatic token validation on mount
- ✅ Login/logout functionality
- ✅ User refresh capability
- ✅ `withAuth` HOC for protected components

### **5. Pages & Components**

#### Login Page (`/login`)
- Email/password authentication form
- Form validation
- Error handling and display
- Loading states
- Quick login buttons (development only)
- Responsive design

#### Dashboard Page (`/dashboard`)
- Real-time data fetching from backend API
- Application listing with filters
- Status-based filtering
- Loading and error states
- Logout functionality
- User profile display

#### Protected Route Component
- Authentication check
- Auto-redirect to login if not authenticated
- Loading state during auth check

### **6. Routing**
- ✅ React Router integration
- ✅ `/login` - Public login page
- ✅ `/dashboard` - Protected dashboard
- ✅ `/` - Redirects to dashboard
- ✅ Catch-all route redirects to dashboard

---

## 🚀 Running the Application

### **Prerequisites**
1. Backend server running on `http://localhost:3001`
2. Database set up with seed data
3. Node.js and npm installed

### **Start the Frontend**

```bash
# Make sure you're in the root directory
cd E:\risk-assessment-tbi

# Install dependencies (if not done already)
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

---

## 🧪 Testing the Integration

### **1. Start Backend Server**

In a separate terminal:

```bash
cd E:\risk-assessment-tbi\backend

# Make sure database is set up
npm run db:migrate
npm run db:seed

# Start the backend
npm start
```

Backend runs on: `http://localhost:3001`

### **2. Start Frontend**

```bash
cd E:\risk-assessment-tbi

npm run dev
```

Frontend runs on: `http://localhost:3000`

### **3. Test Authentication Flow**

1. **Navigate to login page** (auto-redirects if not logged in)
2. **Quick login with seed data**:
   - Click "Underwriter" button for underwriter@tbibank.com
   - Click "Manager" button for manager@tbibank.com
   - Click "Admin" button for admin@tbibank.com
3. **Verify dashboard loads** with loan applications from backend
4. **Test logout** - should redirect to login

### **4. Test API Calls**

Open browser DevTools → Network tab to see API requests:

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/applications` - Fetch applications
- `POST /api/v1/auth/logout` - Logout

### **5. Test Error Handling**

- Try logging in with wrong credentials
- Stop backend server and see error messages
- Test rate limiting by rapid requests

---

## 📁 Project Structure

```
risk-assessment-tbi/
├── backend/                          # Backend API
│   ├── src/
│   │   ├── routes/                   # API endpoints
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Auth, logging, etc.
│   │   └── server.ts                 # Express server
│   ├── prisma/                       # Database schema
│   ├── .env                          # Backend env vars
│   └── package.json
│
├── src/                              # Frontend React app
│   ├── components/                   # React components
│   │   ├── ProtectedRoute.tsx       # Auth guard
│   │   ├── ApplicationCard.tsx      # (legacy)
│   │   └── RiskScoreDisplay.tsx     # (legacy)
│   ├── contexts/                     # React contexts
│   │   └── AuthContext.tsx          # Authentication state
│   ├── pages/                        # Page components
│   │   ├── Login.tsx                # Login page
│   │   └── Dashboard.tsx            # Main dashboard
│   ├── services/                     # API service layer
│   │   └── api/
│   │       ├── auth.service.ts      # Auth API calls
│   │       ├── applications.service.ts
│   │       ├── assessments.service.ts
│   │       └── index.ts             # Service exports
│   ├── types/                        # TypeScript types
│   │   └── api.ts                   # API types
│   ├── lib/                          # Utilities
│   │   └── api-client.ts            # Axios configuration
│   ├── App.tsx                       # Main app with routing
│   └── main.tsx                      # React entry point
│
├── .env                              # Frontend env vars
├── vite.config.ts                    # Vite configuration
└── package.json                      # Frontend dependencies
```

---

## 🔧 Environment Variables

### **Frontend (`.env`)**
```env
VITE_API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

### **Backend (`backend/.env`)**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tbi_loan_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

---

## 🎯 Key Features

### **Authentication**
- JWT-based authentication
- Token stored in localStorage
- Automatic token injection in API requests
- Auto-refresh on app load
- Secure logout with token cleanup

### **Error Handling**
- Global error handling in API client
- User-friendly error messages
- Network error detection
- Rate limit handling
- 401/403 automatic handling

### **Security**
- Protected routes
- JWT token management
- CORS configured
- Request/response interceptors
- Secure password fields

### **User Experience**
- Loading states
- Error messages
- Responsive design
- Quick login (development)
- Auto-redirect on auth changes

---

## 🐛 Troubleshooting

### **"Network Error" on Login**
- ✅ Check backend is running on port 3001
- ✅ Check `VITE_API_BASE_URL` in `.env`
- ✅ Check CORS settings in backend
- ✅ Check browser console for details

### **"401 Unauthorized"**
- ✅ Check JWT_SECRET matches in backend
- ✅ Try logging out and back in
- ✅ Check token in localStorage
- ✅ Check token expiration time

### **"Cannot GET /dashboard" on Refresh**
- ✅ This is normal for Vite dev server
- ✅ Vite handles client-side routing
- ✅ In production, configure server to serve index.html

### **Dashboard Shows No Applications**
- ✅ Check backend seed data ran successfully
- ✅ Check network tab for API response
- ✅ Check user role has permission
- ✅ Try different filters

---

## 📊 API Response Format

All API responses follow this structure:

### **Success Response**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error info"
}
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthContext
    participant API
    participant Backend

    User->>Frontend: Enter credentials
    Frontend->>API: POST /auth/login
    API->>Backend: Authenticate
    Backend-->>API: JWT Token + User
    API-->>AuthContext: Store token & user
    AuthContext-->>Frontend: Update auth state
    Frontend->>User: Redirect to dashboard
    
    Note over User,Backend: All subsequent requests
    
    Frontend->>API: GET /applications
    API->>API: Add Authorization header
    API->>Backend: Request with JWT
    Backend-->>API: Applications data
    API-->>Frontend: Display data
```

---

## 🎨 Next Steps

### **Immediate Enhancements**
1. **Create New Application Form**
   - Form to create loan applications
   - Validation and error handling
   - Integration with `applicationsService.createApplication()`

2. **Risk Assessment Panel**
   - Display risk scores with visualizations
   - Show explainability factors
   - What-if scenario generator

3. **Application Detail Page**
   - Full application details
   - Risk assessment history
   - Action buttons (approve, reject, etc.)

4. **Admin Panel**
   - User management
   - Risk configuration
   - Audit log viewer

### **Future Features**
- File upload for loan documents
- Real-time notifications
- Export to PDF/Excel
- Multi-language support (AR/EN/KU)
- Dark mode
- Advanced filtering and search
- Charts and analytics
- Batch operations

---

## 📝 Summary

The frontend is now **fully integrated** with the backend API. You have:

✅ **Complete authentication system** with JWT  
✅ **Protected routes** with auto-redirect  
✅ **API service layer** for all backend endpoints  
✅ **Type-safe** TypeScript throughout  
✅ **Error handling** and loading states  
✅ **Real data** from PostgreSQL database  
✅ **Login and dashboard** fully functional  
✅ **User management** with roles and permissions  

**You can now:**
- Login with seed user accounts
- View real loan applications from database
- Filter applications by status
- See user profiles and roles
- Logout securely

The integration is complete and ready for further development!

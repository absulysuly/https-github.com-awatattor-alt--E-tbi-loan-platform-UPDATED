// API Types matching backend Prisma schema

export type UserRole = 'ADMIN' | 'MANAGER' | 'UNDERWRITER' | 'COMPLIANCE_OFFICER' | 'VIEWER';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'CONDITIONALLY_APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EmploymentStatus = 
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'SELF_EMPLOYED'
  | 'UNEMPLOYED'
  | 'RETIRED'
  | 'STUDENT';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'APPROVE'
  | 'REJECT'
  | 'OVERRIDE'
  | 'EXPORT'
  | 'VIEW';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfaEnabled: boolean;
  accountLocked: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  token: string;
  user: User;
}

// Loan Applicant
export interface LoanApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  employmentStatus: EmploymentStatus;
  employer?: string;
  monthlyIncome: number;
  creditScore?: number;
  existingDebts?: number;
  createdAt: string;
  updatedAt: string;
}

// Loan Application
export interface LoanApplication {
  id: string;
  applicantId: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: ApplicationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
  conditions?: string[];
  createdAt: string;
  updatedAt: string;
  applicant?: LoanApplicant;
  assessments?: RiskAssessment[];
  reviewer?: User;
  approver?: User;
}

// Risk Assessment
export interface RiskAssessment {
  id: string;
  applicationId: string;
  riskScore: number;
  riskCategory: RiskCategory;
  factorScores: Record<string, any>;
  explainability: Record<string, any>;
  recommendation: string;
  alternativeScenarios?: any[];
  assessedBy: string;
  overridden: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  application?: LoanApplication;
  assessor?: User;
  overrider?: User;
}

// Risk Configuration
export interface RiskConfiguration {
  id: string;
  version: string;
  weights: Record<string, any>;
  thresholds: Record<string, any>;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  oldValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  riskLevel?: string;
  complianceFlags?: string[];
  timestamp: string;
  user?: User;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// Create Application request
export interface CreateApplicationRequest {
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    ssn?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    employmentStatus: EmploymentStatus;
    employer?: string;
    monthlyIncome: number;
    creditScore?: number;
    existingDebts?: number;
  };
  loanDetails: {
    amount: number;
    termMonths: number;
    purpose: string;
  };
}

// Update Application request
export interface UpdateApplicationRequest {
  amount?: number;
  termMonths?: number;
  purpose?: string;
  status?: ApplicationStatus;
  notes?: string;
  conditions?: string[];
}

// Create Assessment request
export interface CreateAssessmentRequest {
  applicationId: string;
  applicantData: {
    monthlyIncome: number;
    employmentYears: number;
    creditScore: number;
    existingDebts: number;
    requestedAmount: number;
    collateralValue: number;
  };
  notes?: string;
}

// Calculate Risk request
export interface CalculateRiskRequest {
  applicantData: {
    monthlyIncome: number;
    employmentYears: number;
    creditScore: number;
    existingDebts: number;
    requestedAmount: number;
    collateralValue: number;
  };
  configId?: string;
}

// Risk calculation result
export interface RiskCalculationResult {
  riskScore: number;
  riskCategory: RiskCategory;
  factorScores: Record<string, number>;
  factorWeights: Record<string, number>;
  factorContributions: Record<string, number>;
  recommendation: string;
  explainability: {
    positiveFactors: Array<{ factor: string; impact: number; explanation: string }>;
    negativeFactors: Array<{ factor: string; impact: number; explanation: string }>;
    keyDrivers: Array<{ factor: string; contribution: number }>;
  };
}

// Change Password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Create User request (Admin)
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// Update User request
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
}

// Create Config request
export interface CreateConfigRequest {
  version: string;
  weights: Record<string, any>;
  thresholds: Record<string, any>;
  notes?: string;
}

// Query parameters for filtering
export interface ApplicationFilters {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssessmentFilters {
  applicationId?: string;
  riskCategory?: RiskCategory;
  page?: number;
  limit?: number;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  riskLevel?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: UserRole;
  page?: number;
  limit?: number;
}

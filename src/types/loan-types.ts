/**
 * TBi Bank CSDR Loan Assessment Platform - Core Types
 * 
 * Comprehensive TypeScript interfaces for loan assessment system
 * Includes audit trails, compliance features, and security considerations
 */

// ====================== CORE ENTITY TYPES ======================

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  
  // Loan Details
  loanAmount: number;
  loanPurpose: LoanPurpose;
  requestedTerm: number; // in months
  interestRate?: number;
  
  // Applicant Information
  applicant: Applicant;
  
  // Collateral Information (optional)
  collateralValue?: number;
  collateralType?: CollateralType;
  collateralDescription?: string;
  
  // Supporting Documents
  documents: Document[];
  
  // Internal Processing
  assignedTo?: string; // User ID
  priority: Priority;
  riskAssessments: RiskAssessment[];
  auditLog: AuditLogEntry[];
  
  // Compliance & Tracking
  configVersion: string;
  dataRetentionDate?: string;
  consentGiven: boolean;
  consentDate: string;
}

export interface Applicant {
  id: string;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  financialInfo: FinancialInfo;
  employmentInfo: EmploymentInfo;
  creditHistory: CreditHistory;
  
  // PII Handling
  piiEncrypted: boolean;
  lastPiiUpdate: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  nationalId: string;
  nationality: string;
  maritalStatus: MaritalStatus;
  dependents: number;
}

export interface ContactInfo {
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  address: Address;
  previousAddresses?: Address[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  residencyType: ResidencyType;
  yearsAtAddress: number;
}

export interface FinancialInfo {
  annualIncome: number;
  monthlyIncome: number;
  otherIncome?: number;
  monthlyExpenses: number;
  existingDebts: Debt[];
  assets: Asset[];
  debtToIncomeRatio: number;
  netWorth: number;
}

export interface EmploymentInfo {
  employmentType: EmploymentType;
  employerName: string;
  jobTitle: string;
  yearsEmployed: number;
  yearsInIndustry: number;
  employerAddress?: Address;
  supervisorContact?: string;
  previousEmployment?: Employment[];
}

export interface Employment {
  employerName: string;
  position: string;
  startDate: string;
  endDate: string;
  reasonForLeaving: string;
}

export interface CreditHistory {
  creditScore: number;
  creditScoreDate: string;
  creditBureau: CreditBureau;
  paymentHistory: PaymentHistoryRecord[];
  previousDefaults: number;
  bankruptcyHistory: BankruptcyRecord[];
  creditInquiries: CreditInquiry[];
}

// ====================== RISK ASSESSMENT TYPES ======================

export interface RiskAssessment {
  id: string;
  applicationId: string;
  timestamp: string;
  configVersion: string;
  
  // Core Assessment Results
  riskScore: number; // 0-100
  riskCategory: RiskCategory;
  recommendation: LoanRecommendation;
  confidence: number; // 0-100
  
  // Detailed Factor Analysis
  factors: RiskFactors;
  
  // Risk Indicators
  keyRiskIndicators: string[];
  mitigationSuggestions: string[];
  
  // Multilingual Summary
  summary: LocalizedString;
  
  // Explainability & Audit
  explainability: ExplainabilityData;
  
  // Human Review
  humanReviewRequired: boolean;
  reviewComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface RiskFactors {
  creditHistory: FactorAssessment;
  incomeStability: FactorAssessment;
  employment: FactorAssessment;
  collateral: FactorAssessment;
  marketConditions: FactorAssessment;
  debtToIncomeRatio: FactorAssessment;
}

export interface FactorAssessment {
  score: number; // 0-100
  weight: number; // percentage weight in overall score
  explanation: string;
  dataPoints: string[];
  confidence: number;
}

export interface ExplainabilityData {
  methodology: string;
  dataPoints: number;
  confidenceFactors: string[];
  limitations: string[];
  modelVersion: string;
  trainingDataCutoff?: string;
}

export interface RiskConfiguration {
  id: string;
  version: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  
  // Risk Scoring Weights
  weights: RiskWeights;
  
  // Thresholds
  thresholds: RiskThresholds;
  
  // Business Rules
  rules: BusinessRule[];
  
  // Compliance Settings
  complianceSettings: ComplianceSettings;
}

export interface RiskWeights {
  creditHistory: number;
  incomeStability: number;
  employment: number;
  collateral: number;
  marketConditions: number;
  debtToIncomeRatio: number;
}

export interface RiskThresholds {
  lowRisk: number;    // Below this = LOW
  mediumRisk: number; // Below this = MEDIUM  
  highRisk: number;   // Below this = HIGH, above = CRITICAL
  
  // Auto-approval thresholds
  autoApproveThreshold: number;
  autoRejectThreshold: number;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string; // JSON rule expression
  action: RuleAction;
  priority: number;
  isActive: boolean;
}

export interface ComplianceSettings {
  requireHumanReview: boolean;
  auditAllDecisions: boolean;
  retentionPeriodMonths: number;
  explainabilityRequired: boolean;
  fairnessMonitoring: boolean;
}

// ====================== USER & PERMISSION TYPES ======================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  department: string;
  manager?: string;
  
  // Security
  lastLogin: string;
  mfaEnabled: boolean;
  accountLocked: boolean;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  
  // Risk & Compliance
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  complianceFlags?: string[];
}

// ====================== SUPPORTING TYPES ======================

export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  
  // Document Classification
  documentType: DocumentType;
  category: DocumentCategory;
  
  // OCR & Processing
  ocrProcessed: boolean;
  ocrData?: OCRData;
  extractedFields?: Record<string, any>;
  
  // Security
  encrypted: boolean;
  accessLevel: AccessLevel;
  retentionDate?: string;
}

export interface OCRData {
  text: string;
  confidence: number;
  fields: OCRField[];
  processedAt: string;
  processingTime: number;
}

export interface OCRField {
  fieldName: string;
  value: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Debt {
  type: DebtType;
  creditor: string;
  originalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  remainingTerm: number;
}

export interface Asset {
  type: AssetType;
  description: string;
  estimatedValue: number;
  liquidityLevel: LiquidityLevel;
  lastValuationDate: string;
}

export interface PaymentHistoryRecord {
  accountType: string;
  paymentStatus: PaymentStatus;
  monthsReported: number;
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
}

export interface BankruptcyRecord {
  type: BankruptcyType;
  filingDate: string;
  dischargeDate?: string;
  assets: number;
  liabilities: number;
}

export interface CreditInquiry {
  inquiryDate: string;
  inquiringEntity: string;
  inquiryType: InquiryType;
}

export interface LocalizedString {
  en: string;
  ar?: string;
  ku?: string;
}

// ====================== ENUMS ======================

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_DOCUMENTS = 'PENDING_DOCUMENTS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  DISBURSED = 'DISBURSED'
}

export enum LoanPurpose {
  HOME_PURCHASE = 'HOME_PURCHASE',
  HOME_REFINANCE = 'HOME_REFINANCE',
  HOME_IMPROVEMENT = 'HOME_IMPROVEMENT',
  BUSINESS = 'BUSINESS',
  EDUCATION = 'EDUCATION',
  VEHICLE = 'VEHICLE',
  PERSONAL = 'PERSONAL',
  DEBT_CONSOLIDATION = 'DEBT_CONSOLIDATION'
}

export enum CollateralType {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  SECURITIES = 'SECURITIES',
  CASH_DEPOSIT = 'CASH_DEPOSIT',
  EQUIPMENT = 'EQUIPMENT',
  INVENTORY = 'INVENTORY'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum RiskCategory {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum LoanRecommendation {
  APPROVE = 'APPROVE',
  REVIEW = 'REVIEW',
  REJECT = 'REJECT'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED'
}

export enum ResidencyType {
  OWN = 'OWN',
  RENT = 'RENT',
  FAMILY = 'FAMILY',
  COMPANY = 'COMPANY'
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  RETIRED = 'RETIRED',
  UNEMPLOYED = 'UNEMPLOYED'
}

export enum CreditBureau {
  EXPERIAN = 'EXPERIAN',
  EQUIFAX = 'EQUIFAX',
  TRANSUNION = 'TRANSUNION'
}

export enum PaymentStatus {
  CURRENT = 'CURRENT',
  LATE_30 = 'LATE_30',
  LATE_60 = 'LATE_60',
  LATE_90 = 'LATE_90',
  CHARGE_OFF = 'CHARGE_OFF'
}

export enum BankruptcyType {
  CHAPTER_7 = 'CHAPTER_7',
  CHAPTER_11 = 'CHAPTER_11',
  CHAPTER_13 = 'CHAPTER_13'
}

export enum InquiryType {
  HARD = 'HARD',
  SOFT = 'SOFT'
}

export enum DebtType {
  MORTGAGE = 'MORTGAGE',
  CREDIT_CARD = 'CREDIT_CARD',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  AUTO_LOAN = 'AUTO_LOAN',
  STUDENT_LOAN = 'STUDENT_LOAN'
}

export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  INVESTMENT = 'INVESTMENT',
  RETIREMENT = 'RETIREMENT',
  PERSONAL_PROPERTY = 'PERSONAL_PROPERTY'
}

export enum LiquidityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum DocumentType {
  INCOME_VERIFICATION = 'INCOME_VERIFICATION',
  EMPLOYMENT_VERIFICATION = 'EMPLOYMENT_VERIFICATION',
  BANK_STATEMENT = 'BANK_STATEMENT',
  TAX_RETURN = 'TAX_RETURN',
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  COLLATERAL_APPRAISAL = 'COLLATERAL_APPRAISAL',
  CREDIT_REPORT = 'CREDIT_REPORT'
}

export enum DocumentCategory {
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  SUPPLEMENTARY = 'SUPPLEMENTARY'
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  LOAN_OFFICER = 'LOAN_OFFICER',
  SENIOR_UNDERWRITER = 'SENIOR_UNDERWRITER',
  UNDERWRITER = 'UNDERWRITER',
  RISK_ANALYST = 'RISK_ANALYST',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // Application Management
  VIEW_APPLICATIONS = 'VIEW_APPLICATIONS',
  CREATE_APPLICATION = 'CREATE_APPLICATION',
  EDIT_APPLICATION = 'EDIT_APPLICATION',
  DELETE_APPLICATION = 'DELETE_APPLICATION',
  APPROVE_APPLICATION = 'APPROVE_APPLICATION',
  REJECT_APPLICATION = 'REJECT_APPLICATION',
  
  // Risk Assessment
  VIEW_RISK_ASSESSMENT = 'VIEW_RISK_ASSESSMENT',
  PERFORM_RISK_ASSESSMENT = 'PERFORM_RISK_ASSESSMENT',
  OVERRIDE_RISK_ASSESSMENT = 'OVERRIDE_RISK_ASSESSMENT',
  
  // Configuration
  VIEW_CONFIG = 'VIEW_CONFIG',
  EDIT_CONFIG = 'EDIT_CONFIG',
  
  // User Management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',
  
  // Reporting
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS'
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  OVERRIDE = 'OVERRIDE',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  EXPORT = 'EXPORT'
}

export enum RuleAction {
  AUTO_APPROVE = 'AUTO_APPROVE',
  AUTO_REJECT = 'AUTO_REJECT',
  REQUIRE_REVIEW = 'REQUIRE_REVIEW',
  FLAG_HIGH_RISK = 'FLAG_HIGH_RISK',
  REQUEST_DOCUMENTS = 'REQUEST_DOCUMENTS'
}

// ====================== API RESPONSE TYPES ======================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchFilters {
  status?: ApplicationStatus[];
  riskCategory?: RiskCategory[];
  assignedTo?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

// ====================== DASHBOARD TYPES ======================

export interface DashboardMetrics {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  averageProcessingTime: number;
  averageRiskScore: number;
  riskDistribution: RiskDistribution;
  monthlyTrends: MonthlyTrend[];
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface MonthlyTrend {
  month: string;
  applications: number;
  approvals: number;
  avgRiskScore: number;
}

// ====================== NOTIFICATION TYPES ======================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: Priority;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  RISK_ASSESSMENT_COMPLETE = 'RISK_ASSESSMENT_COMPLETE',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}
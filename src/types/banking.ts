// Banking-Specific Types for TBi Bank Loan Assessment Platform
export type Language = 'en' | 'ar' | 'ku';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'conditionally_approved' | 'approved' | 'rejected';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type EvidenceType = 'photo' | 'video' | 'document' | 'invoice' | 'qr_scan';
export type RiskLevel = 'low' | 'medium' | 'high';
export type UserRole = 'applicant' | 'loan_officer' | 'admin';

// Localized String Interface
export interface LocalizedString {
  en: string;
  ar: string;
  ku: string;
}

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Geographic and Business Classification
export interface GeographicRegion {
  id: string;
  name: LocalizedString;
  governorate: string;
  coordinates?: { lat: number; lon: number };
  riskAdjustment: number; // -0.1 to +0.1
}

export interface BusinessSector {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  riskMultiplier: number; // 0.8-1.5
  color: string;
  icon: string;
}

// Core Application Interface
export interface Application {
  id: string;
  title: LocalizedString; // Business name
  description: LocalizedString; // Business plan summary
  applicantId: string;
  applicantName: string;
  sectorId: string;
  regionId: string;
  submittedDate: string;
  requestedAmount: number;
  currency: 'IQD' | 'USD';
  status: ApplicationStatus;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  assessments: Assessment[];
  milestones: Milestone[];
  documents: ApplicationDocument[];
  conversations: Conversation[];
  aiSummary?: string;
  explainabilityData?: ExplainabilityData;
  conditions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Assessment and Risk Scoring
export interface Assessment {
  id: string;
  applicationId: string;
  officerId: string;
  officer: User;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  factors: AssessmentFactor[];
  recommendation: 'approve' | 'conditional' | 'reject';
  conditions?: string[];
  timestamp: string;
  modelVersion: string;
  confidence: number;
}

export interface AssessmentFactor {
  name: string;
  value: number | string;
  shapValue: number; // SHAP contribution
  importance: 'high' | 'medium' | 'low';
  explanation: string;
  sourceDocument?: string;
  sourceLocation?: string;
}

export interface ExplainabilityData {
  modelVersion: string;
  features: AssessmentFactor[];
  decisionPath: string[];
  alternativeScenarios: Array<{
    description: string;
    scoreChange: number;
    changedFactors: string[];
  }>;
  timestamp: Date;
  confidence: number;
}

// Milestone Tracking
export interface Milestone {
  id: string;
  applicationId: string;
  title: LocalizedString;
  description: LocalizedString;
  dueDate: string;
  status: MilestoneStatus;
  evidence: Evidence[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  order: number;
  requirements: string[];
}

export interface Evidence {
  id: string;
  milestoneId: string;
  type: EvidenceType;
  fileUrl: string;
  fileName: string;
  metadata: {
    gps?: { lat: number; lon: number; accuracy: number };
    timestamp: string;
    deviceId?: string;
    qrData?: string;
    ocrText?: string;
    fileSize: number;
    mimeType: string;
  };
  verificationResult?: {
    isValid: boolean;
    confidence: number;
    flags: string[];
    verifiedBy?: string;
    verifiedAt?: string;
  };
}

// Document Management
export interface ApplicationDocument {
  id: string;
  applicationId: string;
  type: 'business_plan' | 'financials' | 'id' | 'collateral' | 'other';
  name: string;
  fileUrl: string;
  extractedData?: Record<string, any>;
  ocrConfidence?: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'failed';
}

// Communication
export interface VoiceInteraction {
  id: string;
  applicationId: string;
  userId: string;
  transcript: string;
  audioUrl?: string;
  language: Language;
  confidence: number;
  intent: string;
  response: string;
  timestamp: Date;
  processingTime: number;
}

export interface Conversation {
  id: string;
  applicationId: string;
  participants: string[];
  messages: ConversationMessage[];
  lastActivity: Date;
  status: 'active' | 'resolved';
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'system' | 'document';
  metadata?: {
    voiceInteractionId?: string;
    documentId?: string;
    systemAction?: string;
  };
}

// AI Processing Types
export interface OCRResult {
  text: string;
  confidence: number;
  structuredData: Record<string, any>;
  tables: TableData[];
  entities: ExtractedEntity[];
  boundingBoxes: BoundingBox[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
  confidence: number;
  location: BoundingBox;
}

export interface ExtractedEntity {
  text: string;
  type: string;
  confidence: number;
  location: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: Language;
  intent: string;
  entities: Record<string, any>;
  response: string;
  audioUrl?: string;
}

// Audit and Compliance
export interface AuditLogEntry {
  id: string;
  applicationId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  modelVersions?: Record<string, string>;
}
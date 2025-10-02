-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" DATETIME,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "loan_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "loanAmount" REAL NOT NULL,
    "loanPurpose" TEXT NOT NULL,
    "requestedTerm" INTEGER NOT NULL,
    "interestRate" REAL,
    "applicantId" TEXT NOT NULL,
    "collateralValue" REAL,
    "collateralType" TEXT,
    "collateralDescription" TEXT,
    "assignedToId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "currentRiskScore" REAL,
    "currentRiskLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "configVersion" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" DATETIME,
    CONSTRAINT "loan_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loan_applications_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" DATETIME NOT NULL,
    "nationalId" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "primaryPhone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "email" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Iraq',
    "residencyType" TEXT NOT NULL,
    "yearsAtAddress" INTEGER NOT NULL,
    "annualIncome" REAL NOT NULL,
    "monthlyIncome" REAL NOT NULL,
    "otherIncome" REAL,
    "monthlyExpenses" REAL NOT NULL,
    "debtToIncomeRatio" REAL NOT NULL,
    "netWorth" REAL NOT NULL,
    "employmentType" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "yearsEmployed" REAL NOT NULL,
    "yearsInIndustry" REAL NOT NULL,
    "employerAddress" TEXT,
    "creditScore" INTEGER NOT NULL,
    "creditScoreDate" DATETIME NOT NULL,
    "creditBureau" TEXT NOT NULL,
    "previousDefaults" INTEGER NOT NULL DEFAULT 0,
    "piiEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "lastPiiUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "riskScore" REAL NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "factorScores" JSONB NOT NULL,
    "keyRiskIndicators" TEXT NOT NULL,
    "mitigationSuggestions" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "summaryAr" TEXT,
    "summaryKu" TEXT,
    "explainabilityData" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "configVersion" TEXT NOT NULL,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewComments" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risk_assessments_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "weightCreditHistory" REAL NOT NULL,
    "weightIncomeStability" REAL NOT NULL,
    "weightEmployment" REAL NOT NULL,
    "weightCollateral" REAL NOT NULL,
    "weightMarketConditions" REAL NOT NULL,
    "weightDebtToIncomeRatio" REAL NOT NULL,
    "thresholdLowRisk" REAL NOT NULL,
    "thresholdMediumRisk" REAL NOT NULL,
    "thresholdHighRisk" REAL NOT NULL,
    "autoApproveThreshold" REAL NOT NULL,
    "autoRejectThreshold" REAL NOT NULL,
    "businessRules" JSONB NOT NULL,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "auditAllDecisions" BOOLEAN NOT NULL DEFAULT true,
    "retentionPeriodMonths" INTEGER NOT NULL DEFAULT 84,
    "explainabilityRequired" BOOLEAN NOT NULL DEFAULT true,
    "fairnessMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "risk_configurations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "previousValues" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "complianceFlags" TEXT NOT NULL,
    "applicationId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ocrProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ocrData" JSONB,
    "ocrConfidence" REAL,
    "extractedFields" JSONB,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "retentionDate" DATETIME,
    CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "loan_applications_applicationNumber_key" ON "loan_applications"("applicationNumber");

-- CreateIndex
CREATE INDEX "loan_applications_status_idx" ON "loan_applications"("status");

-- CreateIndex
CREATE INDEX "loan_applications_assignedToId_idx" ON "loan_applications"("assignedToId");

-- CreateIndex
CREATE INDEX "loan_applications_applicationNumber_idx" ON "loan_applications"("applicationNumber");

-- CreateIndex
CREATE INDEX "loan_applications_createdAt_idx" ON "loan_applications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_nationalId_key" ON "applicants"("nationalId");

-- CreateIndex
CREATE INDEX "applicants_nationalId_idx" ON "applicants"("nationalId");

-- CreateIndex
CREATE INDEX "applicants_email_idx" ON "applicants"("email");

-- CreateIndex
CREATE INDEX "risk_assessments_applicationId_idx" ON "risk_assessments"("applicationId");

-- CreateIndex
CREATE INDEX "risk_assessments_riskCategory_idx" ON "risk_assessments"("riskCategory");

-- CreateIndex
CREATE INDEX "risk_assessments_timestamp_idx" ON "risk_assessments"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "risk_configurations_version_key" ON "risk_configurations"("version");

-- CreateIndex
CREATE INDEX "risk_configurations_version_idx" ON "risk_configurations"("version");

-- CreateIndex
CREATE INDEX "risk_configurations_isActive_idx" ON "risk_configurations"("isActive");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_applicationId_idx" ON "audit_logs"("applicationId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "documents_applicationId_idx" ON "documents"("applicationId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");

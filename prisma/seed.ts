/**
 * TBi Bank CSDR Platform - Database Seed Script
 * 
 * Seeds the database with:
 * - 2 users (Admin and Loan Officer)
 * - 1 active risk configuration
 * - 3 sample loan applications with different risk profiles
 * - Sample applicants
 * - Initial audit logs
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only!)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.riskAssessment.deleteMany({});
  await prisma.loanApplication.deleteMany({});
  await prisma.applicant.deleteMany({});
  await prisma.riskConfiguration.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleaned\n');

  // Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tbibank.com',
      name: 'Ahmad Al-Mansour',
      password: hashedPassword,
      role: 'ADMIN',
      mfaEnabled: false,
      createdBy: 'system'
    }
  });

  const loanOfficer = await prisma.user.create({
    data: {
      email: 'officer@tbibank.com',
      name: 'Sarah Hassan',
      password: hashedPassword,
      role: 'LOAN_OFFICER',
      mfaEnabled: false,
      createdBy: admin.id
    }
  });

  console.log(`✅ Created users: ${admin.email}, ${loanOfficer.email}\n`);

  // Create Risk Configuration
  console.log('⚙️  Creating risk configuration...');
  const riskConfig = await prisma.riskConfiguration.create({
    data: {
      version: '1.0.0',
      name: 'TBi Bank Standard Risk Model',
      description: 'Default risk assessment model for general business loans',
      isActive: true,
      
      // Weights (must sum to 100)
      weightCreditHistory: 30,
      weightIncomeStability: 25,
      weightEmployment: 15,
      weightCollateral: 15,
      weightMarketConditions: 5,
      weightDebtToIncomeRatio: 10,
      
      // Thresholds
      thresholdLowRisk: 30,
      thresholdMediumRisk: 50,
      thresholdHighRisk: 70,
      
      // Auto-decision thresholds
      autoApproveThreshold: 25,
      autoRejectThreshold: 75,
      
      // Business Rules
      businessRules: [
        {
          id: 'rule-1',
          name: 'High Credit Score Auto-Approve',
          condition: 'creditScore >= 750 && debtToIncomeRatio <= 30',
          action: 'AUTO_APPROVE',
          priority: 1
        },
        {
          id: 'rule-2',
          name: 'Default History Auto-Review',
          condition: 'previousDefaults > 0',
          action: 'REQUIRE_REVIEW',
          priority: 2
        }
      ],
      
      // Compliance
      requireHumanReview: true,
      auditAllDecisions: true,
      retentionPeriodMonths: 84,
      explainabilityRequired: true,
      fairnessMonitoring: false,
      
      createdBy: admin.id
    }
  });

  console.log(`✅ Created risk configuration: ${riskConfig.version}\n`);

  // Create Applicants and Applications
  console.log('📋 Creating sample loan applications...\n');

  // Application 1: Low Risk - Tech Training Business
  const applicant1 = await prisma.applicant.create({
    data: {
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      middleName: 'Mohammed',
      dateOfBirth: new Date('1985-03-15'),
      nationalId: '19850315001',
      nationality: 'Iraqi',
      maritalStatus: 'MARRIED',
      dependents: 2,
      
      primaryPhone: '+964-770-123-4567',
      email: 'ahmed.rashid@example.com',
      
      street: 'Al-Mansour District, Building 42',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10001',
      country: 'Iraq',
      residencyType: 'OWN',
      yearsAtAddress: 8,
      
      annualIncome: 102000,
      monthlyIncome: 8500,
      otherIncome: 0,
      monthlyExpenses: 6200,
      debtToIncomeRatio: 28.5,
      netWorth: 85000,
      
      employmentType: 'SELF_EMPLOYED',
      employerName: 'Tech Training Center Baghdad',
      jobTitle: 'Owner & CEO',
      yearsEmployed: 5,
      yearsInIndustry: 8,
      employerAddress: 'Karrada District, Baghdad',
      
      creditScore: 720,
      creditScoreDate: new Date('2025-09-15'),
      creditBureau: 'EXPERIAN',
      previousDefaults: 0,
      
      piiEncrypted: false
    }
  });

  const application1 = await prisma.loanApplication.create({
    data: {
      applicationNumber: 'TBI-2025-001',
      status: 'UNDER_REVIEW',
      loanAmount: 50000,
      loanPurpose: 'BUSINESS',
      requestedTerm: 36,
      interestRate: 8.5,
      
      applicantId: applicant1.id,
      
      collateralValue: 35000,
      collateralType: 'EQUIPMENT',
      collateralDescription: 'Computer equipment and training materials valued at $35,000',
      
      assignedToId: loanOfficer.id,
      priority: 'MEDIUM',
      
      currentRiskScore: 32.5,
      currentRiskLevel: 'MEDIUM',
      
      submittedAt: new Date('2025-09-28'),
      
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date('2025-09-28')
    }
  });

  console.log(`✅ Application 1: ${application1.applicationNumber} (Low-Medium Risk)\n`);

  // Application 2: High Risk - Restaurant Startup
  const applicant2 = await prisma.applicant.create({
    data: {
      firstName: 'Layla',
      lastName: 'Ibrahim',
      dateOfBirth: new Date('1990-07-22'),
      nationalId: '19900722002',
      nationality: 'Iraqi',
      maritalStatus: 'SINGLE',
      dependents: 0,
      
      primaryPhone: '+964-750-234-5678',
      email: 'layla.ibrahim@example.com',
      
      street: 'Erbil City Center, Apt 15',
      city: 'Erbil',
      state: 'Kurdistan',
      postalCode: '44001',
      country: 'Iraq',
      residencyType: 'RENT',
      yearsAtAddress: 2,
      
      annualIncome: 48000,
      monthlyIncome: 4000,
      otherIncome: 500,
      monthlyExpenses: 3200,
      debtToIncomeRatio: 42.0,
      netWorth: 12000,
      
      employmentType: 'FULL_TIME',
      employerName: 'Hotel Erbil International',
      jobTitle: 'Restaurant Manager',
      yearsEmployed: 3,
      yearsInIndustry: 6,
      
      creditScore: 650,
      creditScoreDate: new Date('2025-08-20'),
      creditBureau: 'EQUIFAX',
      previousDefaults: 1,
      
      piiEncrypted: false
    }
  });

  const application2 = await prisma.loanApplication.create({
    data: {
      applicationNumber: 'TBI-2025-002',
      status: 'RISK_ASSESSMENT',
      loanAmount: 75000,
      loanPurpose: 'BUSINESS',
      requestedTerm: 60,
      
      applicantId: applicant2.id,
      
      collateralValue: 30000,
      collateralType: 'EQUIPMENT',
      collateralDescription: 'Kitchen equipment and furniture',
      
      assignedToId: loanOfficer.id,
      priority: 'HIGH',
      
      currentRiskScore: 62.0,
      currentRiskLevel: 'HIGH',
      
      submittedAt: new Date('2025-09-30'),
      
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date('2025-09-30')
    }
  });

  console.log(`✅ Application 2: ${application2.applicationNumber} (High Risk)\n`);

  // Application 3: Very Low Risk - Home Improvement
  const applicant3 = await prisma.applicant.create({
    data: {
      firstName: 'Omar',
      lastName: 'Al-Bayati',
      middleName: 'Tariq',
      dateOfBirth: new Date('1978-11-08'),
      nationalId: '19781108003',
      nationality: 'Iraqi',
      maritalStatus: 'MARRIED',
      dependents: 3,
      
      primaryPhone: '+964-780-345-6789',
      email: 'omar.bayati@example.com',
      
      street: 'Basra City, Al-Jumhuriya Street 88',
      city: 'Basra',
      state: 'Basra',
      postalCode: '61001',
      country: 'Iraq',
      residencyType: 'OWN',
      yearsAtAddress: 15,
      
      annualIncome: 156000,
      monthlyIncome: 13000,
      otherIncome: 2000,
      monthlyExpenses: 7500,
      debtToIncomeRatio: 18.0,
      netWorth: 320000,
      
      employmentType: 'FULL_TIME',
      employerName: 'Basra Oil Company',
      jobTitle: 'Senior Engineer',
      yearsEmployed: 12,
      yearsInIndustry: 18,
      
      creditScore: 785,
      creditScoreDate: new Date('2025-09-25'),
      creditBureau: 'EXPERIAN',
      previousDefaults: 0,
      
      piiEncrypted: false
    }
  });

  const application3 = await prisma.loanApplication.create({
    data: {
      applicationNumber: 'TBI-2025-003',
      status: 'APPROVED',
      loanAmount: 30000,
      loanPurpose: 'HOME_IMPROVEMENT',
      requestedTerm: 24,
      interestRate: 6.5,
      
      applicantId: applicant3.id,
      
      collateralValue: 250000,
      collateralType: 'REAL_ESTATE',
      collateralDescription: 'Residential property in Basra',
      
      assignedToId: loanOfficer.id,
      priority: 'LOW',
      
      currentRiskScore: 18.5,
      currentRiskLevel: 'LOW',
      
      submittedAt: new Date('2025-09-25'),
      reviewedAt: new Date('2025-09-27'),
      
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date('2025-09-25')
    }
  });

  console.log(`✅ Application 3: ${application3.applicationNumber} (Low Risk - Approved)\n`);

  // Create initial audit logs
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        userEmail: admin.email,
        action: 'CREATE',
        entityType: 'RiskConfiguration',
        entityId: riskConfig.id,
        changes: { version: riskConfig.version },
        ipAddress: '127.0.0.1',
        userAgent: 'System/Seed',
        sessionId: 'seed-session',
        riskLevel: 'LOW',
        complianceFlags: ['SYSTEM_INIT']
      },
      {
        userId: loanOfficer.id,
        userEmail: loanOfficer.email,
        action: 'CREATE',
        entityType: 'LoanApplication',
        entityId: application1.id,
        applicationId: application1.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-1',
        riskLevel: 'LOW'
      },
      {
        userId: loanOfficer.id,
        userEmail: loanOfficer.email,
        action: 'CREATE',
        entityType: 'LoanApplication',
        entityId: application2.id,
        applicationId: application2.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-2',
        riskLevel: 'LOW'
      },
      {
        userId: loanOfficer.id,
        userEmail: loanOfficer.email,
        action: 'CREATE',
        entityType: 'LoanApplication',
        entityId: application3.id,
        applicationId: application3.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-3',
        riskLevel: 'LOW'
      },
      {
        userId: loanOfficer.id,
        userEmail: loanOfficer.email,
        action: 'APPROVE',
        entityType: 'LoanApplication',
        entityId: application3.id,
        applicationId: application3.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-4',
        riskLevel: 'LOW',
        complianceFlags: ['APPROVED']
      }
    ]
  });

  console.log('✅ Created audit logs\n');

  console.log('✨ Seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 2`);
  console.log(`   - Risk Configurations: 1`);
  console.log(`   - Applicants: 3`);
  console.log(`   - Loan Applications: 3`);
  console.log(`   - Audit Logs: 5\n`);
  
  console.log('🔐 Login Credentials:');
  console.log(`   Admin:        admin@tbibank.com / demo123`);
  console.log(`   Loan Officer: officer@tbibank.com / demo123\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
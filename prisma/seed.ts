import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.riskAssessment.deleteMany();
    await prisma.document.deleteMany();
    await prisma.loanApplication.deleteMany();
    await prisma.applicant.deleteMany();
    await prisma.riskConfiguration.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleaned\n');
  }

  // ==================== CREATE USERS ====================
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tbibank.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      mfaEnabled: false,
    },
  });

  const seniorUnderwriter = await prisma.user.create({
    data: {
      email: 'senior.underwriter@tbibank.com',
      password: hashedPassword,
      name: 'Sarah Williams',
      role: 'SENIOR_UNDERWRITER',
      mfaEnabled: false,
    },
  });

  const loanOfficer1 = await prisma.user.create({
    data: {
      email: 'loan.officer1@tbibank.com',
      password: hashedPassword,
      name: 'Ahmed Al-Rahman',
      role: 'LOAN_OFFICER',
      mfaEnabled: false,
    },
  });

  const loanOfficer2 = await prisma.user.create({
    data: {
      email: 'loan.officer2@tbibank.com',
      password: hashedPassword,
      name: 'Layla Hassan',
      role: 'LOAN_OFFICER',
      mfaEnabled: false,
    },
  });

  const underwriter = await prisma.user.create({
    data: {
      email: 'underwriter@tbibank.com',
      password: hashedPassword,
      name: 'Michael Chen',
      role: 'UNDERWRITER',
      mfaEnabled: false,
    },
  });

  const riskAnalyst = await prisma.user.create({
    data: {
      email: 'risk.analyst@tbibank.com',
      password: hashedPassword,
      name: 'Dr. Fatima Al-Saadi',
      role: 'RISK_ANALYST',
      mfaEnabled: false,
    },
  });

  const complianceOfficer = await prisma.user.create({
    data: {
      email: 'compliance@tbibank.com',
      password: hashedPassword,
      name: 'Robert Martinez',
      role: 'COMPLIANCE_OFFICER',
      mfaEnabled: false,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@tbibank.com',
      password: hashedPassword,
      name: 'John Viewer',
      role: 'VIEWER',
      mfaEnabled: false,
    },
  });

  console.log(`✅ Created ${8} users\n`);

  // ==================== CREATE RISK CONFIGURATION ====================
  console.log('⚙️  Creating risk configuration...');

  const riskConfig = await prisma.riskConfiguration.create({
    data: {
      version: 'v1.0',
      name: 'Standard Risk Model 2025',
      description: 'Production risk assessment model with balanced factor weights',
      isActive: true,
      weightCreditHistory: 30,
      weightIncomeStability: 25,
      weightEmployment: 15,
      weightCollateral: 15,
      weightMarketConditions: 5,
      weightDebtToIncomeRatio: 10,
      thresholdLowRisk: 30,
      thresholdMediumRisk: 50,
      thresholdHighRisk: 70,
      autoApproveThreshold: 75,
      autoRejectThreshold: 30,
      businessRules: [],
      requireHumanReview: true,
      auditAllDecisions: true,
      retentionPeriodMonths: 84,
      explainabilityRequired: true,
      fairnessMonitoring: false,
      createdBy: admin.id,
    },
  });

  console.log(`✅ Created risk configuration: ${riskConfig.version}\n`);

  // ==================== CREATE APPLICANTS & APPLICATIONS ====================
  console.log('📝 Creating loan applications...');

  // Application 1: High quality, likely to be approved
  const applicant1 = await prisma.applicant.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Michael',
      dateOfBirth: new Date('1985-05-15'),
      nationalId: 'IQ-1234567890',
      nationality: 'Iraqi',
      maritalStatus: 'MARRIED',
      dependents: 2,
      primaryPhone: '+964-770-123-4567',
      secondaryPhone: '+964-780-123-4567',
      email: 'john.doe@email.com',
      street: '123 Al-Rasheed Street',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10001',
      country: 'Iraq',
      residencyType: 'OWN',
      yearsAtAddress: 5,
      annualIncome: 72000,
      monthlyIncome: 6000,
      otherIncome: 500,
      monthlyExpenses: 2000,
      debtToIncomeRatio: 0.30,
      netWorth: 150000,
      employmentType: 'FULL_TIME',
      employerName: 'Tech Solutions Iraq',
      jobTitle: 'Senior Software Engineer',
      yearsEmployed: 5,
      yearsInIndustry: 10,
      employerAddress: 'Karrada District, Baghdad',
      creditScore: 750,
      creditScoreDate: new Date('2025-09-01'),
      creditBureau: 'EXPERIAN',
      previousDefaults: 0,
    },
  });

  const app1 = await prisma.loanApplication.create({
    data: {
      applicationNumber: `LA-2025-000001`,
      status: 'SUBMITTED',
      applicantId: applicant1.id,
      loanAmount: 50000,
      loanPurpose: 'HOME_PURCHASE',
      requestedTerm: 240,
      interestRate: 5.5,
      collateralValue: 80000,
      collateralType: 'REAL_ESTATE',
      collateralDescription: 'Residential property in Al-Mansour, Baghdad',
      assignedToId: loanOfficer1.id,
      priority: 'HIGH',
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date(),
      submittedAt: new Date(),
    },
  });

  // Application 2: Medium risk
  const applicant2 = await prisma.applicant.create({
    data: {
      firstName: 'Amira',
      lastName: 'Al-Hassan',
      dateOfBirth: new Date('1990-08-20'),
      nationalId: 'IQ-2345678901',
      nationality: 'Iraqi',
      maritalStatus: 'SINGLE',
      dependents: 0,
      primaryPhone: '+964-770-234-5678',
      email: 'amira.hassan@email.com',
      street: '456 Kadhimiya Road',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10002',
      country: 'Iraq',
      residencyType: 'RENT',
      yearsAtAddress: 2,
      annualIncome: 36000,
      monthlyIncome: 3000,
      otherIncome: 0,
      monthlyExpenses: 1500,
      debtToIncomeRatio: 0.40,
      netWorth: 25000,
      employmentType: 'FULL_TIME',
      employerName: 'Baghdad Medical Center',
      jobTitle: 'Nurse',
      yearsEmployed: 2,
      yearsInIndustry: 3,
      employerAddress: 'Medical City, Baghdad',
      creditScore: 680,
      creditScoreDate: new Date('2025-08-15'),
      creditBureau: 'EQUIFAX',
      previousDefaults: 0,
    },
  });

  const app2 = await prisma.loanApplication.create({
    data: {
      applicationNumber: `LA-2025-000002`,
      status: 'UNDER_REVIEW',
      applicantId: applicant2.id,
      loanAmount: 15000,
      loanPurpose: 'VEHICLE',
      requestedTerm: 60,
      interestRate: 7.0,
      collateralValue: 18000,
      collateralType: 'VEHICLE',
      collateralDescription: '2023 Toyota Corolla',
      assignedToId: loanOfficer2.id,
      priority: 'MEDIUM',
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date(),
      submittedAt: new Date(),
    },
  });

  // Application 3: Higher risk - self-employed with lower credit score
  const applicant3 = await prisma.applicant.create({
    data: {
      firstName: 'Omar',
      lastName: 'Al-Maliki',
      dateOfBirth: new Date('1982-03-10'),
      nationalId: 'IQ-3456789012',
      nationality: 'Iraqi',
      maritalStatus: 'MARRIED',
      dependents: 3,
      primaryPhone: '+964-770-345-6789',
      email: 'omar.maliki@email.com',
      street: '789 Sadr City Avenue',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10003',
      country: 'Iraq',
      residencyType: 'FAMILY',
      yearsAtAddress: 1,
      annualIncome: 48000,
      monthlyIncome: 4000,
      otherIncome: 1000,
      monthlyExpenses: 2500,
      debtToIncomeRatio: 0.50,
      netWorth: 35000,
      employmentType: 'SELF_EMPLOYED',
      employerName: 'Al-Maliki Trading Company',
      jobTitle: 'Business Owner',
      yearsEmployed: 8,
      yearsInIndustry: 8,
      creditScore: 620,
      creditScoreDate: new Date('2025-07-20'),
      creditBureau: 'TRANSUNION',
      previousDefaults: 1,
    },
  });

  const app3 = await prisma.loanApplication.create({
    data: {
      applicationNumber: `LA-2025-000003`,
      status: 'RISK_ASSESSMENT',
      applicantId: applicant3.id,
      loanAmount: 30000,
      loanPurpose: 'BUSINESS',
      requestedTerm: 120,
      interestRate: 8.5,
      collateralValue: 25000,
      collateralType: 'EQUIPMENT',
      collateralDescription: 'Commercial equipment and inventory',
      assignedToId: underwriter.id,
      priority: 'MEDIUM',
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date(),
      submittedAt: new Date(),
    },
  });

  // Application 4: Excellent candidate
  const applicant4 = await prisma.applicant.create({
    data: {
      firstName: 'Zainab',
      lastName: 'Al-Kubaisi',
      dateOfBirth: new Date('1988-11-25'),
      nationalId: 'IQ-4567890123',
      nationality: 'Iraqi',
      maritalStatus: 'MARRIED',
      dependents: 1,
      primaryPhone: '+964-770-456-7890',
      email: 'zainab.kubaisi@email.com',
      street: '321 Adhamiyah Street',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10004',
      country: 'Iraq',
      residencyType: 'OWN',
      yearsAtAddress: 7,
      annualIncome: 96000,
      monthlyIncome: 8000,
      otherIncome: 2000,
      monthlyExpenses: 2500,
      debtToIncomeRatio: 0.25,
      netWorth: 200000,
      employmentType: 'FULL_TIME',
      employerName: 'University of Baghdad',
      jobTitle: 'Associate Professor',
      yearsEmployed: 7,
      yearsInIndustry: 12,
      creditScore: 780,
      creditScoreDate: new Date('2025-09-10'),
      creditBureau: 'EXPERIAN',
      previousDefaults: 0,
    },
  });

  const app4 = await prisma.loanApplication.create({
    data: {
      applicationNumber: `LA-2025-000004`,
      status: 'SUBMITTED',
      applicantId: applicant4.id,
      loanAmount: 75000,
      loanPurpose: 'HOME_REFINANCE',
      requestedTerm: 300,
      interestRate: 4.5,
      collateralValue: 120000,
      collateralType: 'REAL_ESTATE',
      collateralDescription: 'Primary residence in Jadriya, Baghdad',
      assignedToId: loanOfficer1.id,
      priority: 'HIGH',
      configVersion: riskConfig.version,
      consentGiven: true,
      consentDate: new Date(),
      submittedAt: new Date(),
    },
  });

  // Application 5: Draft application
  const applicant5 = await prisma.applicant.create({
    data: {
      firstName: 'Hassan',
      lastName: 'Al-Baghdadi',
      dateOfBirth: new Date('1995-06-30'),
      nationalId: 'IQ-5678901234',
      nationality: 'Iraqi',
      maritalStatus: 'SINGLE',
      dependents: 0,
      primaryPhone: '+964-770-567-8901',
      email: 'hassan.baghdadi@email.com',
      street: '654 Dora District',
      city: 'Baghdad',
      state: 'Baghdad',
      postalCode: '10005',
      country: 'Iraq',
      residencyType: 'RENT',
      yearsAtAddress: 1,
      annualIncome: 24000,
      monthlyIncome: 2000,
      otherIncome: 0,
      monthlyExpenses: 1000,
      debtToIncomeRatio: 0.35,
      netWorth: 5000,
      employmentType: 'FULL_TIME',
      employerName: 'Al-Rasheed Bank',
      jobTitle: 'Junior Teller',
      yearsEmployed: 1,
      yearsInIndustry: 1,
      creditScore: 640,
      creditScoreDate: new Date('2025-08-01'),
      creditBureau: 'EQUIFAX',
      previousDefaults: 0,
    },
  });

  const app5 = await prisma.loanApplication.create({
    data: {
      applicationNumber: `LA-2025-000005`,
      status: 'DRAFT',
      applicantId: applicant5.id,
      loanAmount: 10000,
      loanPurpose: 'PERSONAL',
      requestedTerm: 36,
      interestRate: 9.0,
      assignedToId: loanOfficer2.id,
      priority: 'LOW',
      configVersion: riskConfig.version,
      consentGiven: false,
    },
  });

  console.log(`✅ Created ${5} loan applications with applicants\n`);

  // ==================== SUMMARY ====================
  console.log('📊 Seed Summary:');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`👥 Users: ${8}`);
  console.log(`   - Admin: admin@tbibank.com`);
  console.log(`   - Senior Underwriter: senior.underwriter@tbibank.com`);
  console.log(`   - Loan Officers: loan.officer1@tbibank.com, loan.officer2@tbibank.com`);
  console.log(`   - Underwriter: underwriter@tbibank.com`);
  console.log(`   - Risk Analyst: risk.analyst@tbibank.com`);
  console.log(`   - Compliance: compliance@tbibank.com`);
  console.log(`   - Viewer: viewer@tbibank.com`);
  console.log(`   🔑 Password for all users: Password123!`);
  console.log();
  console.log(`⚙️  Risk Configuration: ${riskConfig.version} (Active)`);
  console.log();
  console.log(`📝 Loan Applications: ${5}`);
  console.log(`   - LA-2025-000001: John Doe - $50k HOME_PURCHASE (SUBMITTED)`);
  console.log(`   - LA-2025-000002: Amira Al-Hassan - $15k VEHICLE (UNDER_REVIEW)`);
  console.log(`   - LA-2025-000003: Omar Al-Maliki - $30k BUSINESS (RISK_ASSESSMENT)`);
  console.log(`   - LA-2025-000004: Zainab Al-Kubaisi - $75k HOME_REFINANCE (SUBMITTED)`);
  console.log(`   - LA-2025-000005: Hassan Al-Baghdadi - $10k PERSONAL (DRAFT)`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✨ Database seeded successfully!\n');
  console.log('🚀 Next steps:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Login with any user email and password: Password123!');
  console.log('   3. Test API at: http://localhost:3001/api/v1');
  console.log('   4. View database: npm run db:studio\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

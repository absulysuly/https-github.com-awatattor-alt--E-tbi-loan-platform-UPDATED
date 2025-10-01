import { 
  Application, 
  BusinessSector, 
  GeographicRegion, 
  Assessment,
  User,
  Milestone,
  AssessmentFactor
} from '../types/banking';

// Iraqi Geographic Regions
export const IRAQI_REGIONS: GeographicRegion[] = [
  { 
    id: 'baghdad', 
    name: { en: 'Baghdad', ar: 'بغداد', ku: 'بەغداد' }, 
    governorate: 'Baghdad',
    coordinates: { lat: 33.3152, lon: 44.3661 },
    riskAdjustment: 0.0
  },
  { 
    id: 'erbil', 
    name: { en: 'Erbil', ar: 'أربيل', ku: 'هەولێر' }, 
    governorate: 'Erbil',
    coordinates: { lat: 36.1900, lon: 44.0092 },
    riskAdjustment: -0.05
  },
  { 
    id: 'sulaymaniyah', 
    name: { en: 'Sulaymaniyah', ar: 'السليمانية', ku: 'سلێمانی' }, 
    governorate: 'Sulaymaniyah',
    coordinates: { lat: 35.5650, lon: 45.4167 },
    riskAdjustment: -0.03
  },
  { 
    id: 'basra', 
    name: { en: 'Basra', ar: 'البصرة', ku: 'بەسرە' }, 
    governorate: 'Basra',
    coordinates: { lat: 30.5085, lon: 47.7804 },
    riskAdjustment: 0.02
  },
  { 
    id: 'mosul', 
    name: { en: 'Mosul', ar: 'الموصل', ku: 'موسڵ' }, 
    governorate: 'Nineveh',
    coordinates: { lat: 36.3350, lon: 43.1189 },
    riskAdjustment: 0.05
  }
];

// Business Sectors
export const BUSINESS_SECTORS: BusinessSector[] = [
  { 
    id: 'technology', 
    name: { en: 'Technology', ar: 'التكنولوجيا', ku: 'تەکنەلۆژیا' },
    description: { 
      en: 'IT services, software development, and digital solutions', 
      ar: 'خدمات تقنية المعلومات وتطوير البرمجيات والحلول الرقمية', 
      ku: 'خزمەتگوزاریەکانی IT و گەشەپێدانی سۆفتوێر' 
    },
    riskMultiplier: 1.2,
    color: '#3B82F6',
    icon: 'laptop'
  },
  { 
    id: 'retail', 
    name: { en: 'Retail Trade', ar: 'التجارة بالتجزئة', ku: 'بازرگانی پچڕۆ' },
    description: { 
      en: 'Shops, markets, and consumer goods distribution', 
      ar: 'المتاجر والأسواق وتوزيع السلع الاستهلاكية', 
      ku: 'فرۆشگاکان و بازاڕەکان و دابەشکردنی کاڵا' 
    },
    riskMultiplier: 0.9,
    color: '#10B981',
    icon: 'store'
  },
  { 
    id: 'manufacturing', 
    name: { en: 'Manufacturing', ar: 'التصنيع', ku: 'پەرەپێدان' },
    description: { 
      en: 'Production, assembly, and industrial processing', 
      ar: 'الإنتاج والتجميع والمعالجة الصناعية', 
      ku: 'بەرهەمهێنان و كۆكردنەوە و پرۆسێسی پیشەسازی' 
    },
    riskMultiplier: 1.0,
    color: '#F59E0B',
    icon: 'factory'
  },
  { 
    id: 'agriculture', 
    name: { en: 'Agriculture', ar: 'الزراعة', ku: 'کشتوکاڵ' },
    description: { 
      en: 'Farming, livestock, and food production', 
      ar: 'الزراعة وتربية المواشي وإنتاج الغذاء', 
      ku: 'جوتیاری و ئاژەڵداری و بەرهەمهێنانی خۆراک' 
    },
    riskMultiplier: 1.1,
    color: '#22C55E',
    icon: 'wheat'
  },
  { 
    id: 'services', 
    name: { en: 'Professional Services', ar: 'الخدمات المهنية', ku: 'خزمەتگوزاریە پیشەیەکان' },
    description: { 
      en: 'Consulting, education, healthcare, and professional services', 
      ar: 'الاستشارات والتعليم والرعاية الصحية والخدمات المهنية', 
      ku: 'ڕاوێژکاری و پەروەردە و تەندروستی و خزمەتگوزاریە پیشەیەکان' 
    },
    riskMultiplier: 0.95,
    color: '#8B5CF6',
    icon: 'briefcase'
  },
  { 
    id: 'construction', 
    name: { en: 'Construction', ar: 'البناء والتشييد', ku: 'بیناسازی' },
    description: { 
      en: 'Building construction, infrastructure, and real estate development', 
      ar: 'بناء المباني والبنية التحتية وتطوير العقارات', 
      ku: 'بیناسازی و ژێرخان و گەشەپێدانی خانووبەرە' 
    },
    riskMultiplier: 1.15,
    color: '#F97316',
    icon: 'building'
  }
];

// Sample Users
export const SAMPLE_USERS: User[] = [
  {
    id: 'user-001',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed.alrashid@example.com',
    role: 'applicant',
    avatarUrl: '/avatars/ahmed.jpg',
    isVerified: true,
    createdAt: new Date('2025-09-20T10:00:00Z')
  },
  {
    id: 'user-002',
    name: 'Fatima Hassan',
    email: 'fatima.hassan@example.com',
    role: 'applicant',
    avatarUrl: '/avatars/fatima.jpg',
    isVerified: true,
    createdAt: new Date('2025-09-21T14:30:00Z')
  },
  {
    id: 'user-003',
    name: 'Omar Karim',
    email: 'omar.karim@example.com',
    role: 'applicant',
    avatarUrl: '/avatars/omar.jpg',
    isVerified: true,
    createdAt: new Date('2025-09-19T09:15:00Z')
  },
  {
    id: 'officer-001',
    name: 'Sarah Al-Mahmoud',
    email: 'sarah.mahmoud@tbibank.com',
    role: 'loan_officer',
    avatarUrl: '/avatars/sarah.jpg',
    isVerified: true,
    createdAt: new Date('2025-01-15T08:00:00Z')
  }
];

// Assessment Factors for Demo
const SAMPLE_ASSESSMENT_FACTORS: AssessmentFactor[] = [
  {
    name: 'Business Experience (Years)',
    value: 5,
    shapValue: 0.15,
    importance: 'high',
    explanation: 'Applicant has 5 years of relevant business experience in technology training',
    sourceDocument: 'business_plan.pdf',
    sourceLocation: 'Page 2, Experience Section'
  },
  {
    name: 'DSCR (Debt Service Coverage Ratio)',
    value: 1.4,
    shapValue: 0.12,
    importance: 'high',
    explanation: 'Strong cash flow coverage with DSCR of 1.4 (above minimum 1.2 threshold)',
    sourceDocument: 'financial_projections.xlsx',
    sourceLocation: 'Cash Flow Analysis Tab'
  },
  {
    name: 'Collateral Coverage Ratio',
    value: 0.25,
    shapValue: -0.08,
    importance: 'medium',
    explanation: 'Limited collateral coverage at 25% of loan amount (below preferred 50%)',
    sourceDocument: 'collateral_assessment.pdf',
    sourceLocation: 'Asset Valuation Summary'
  },
  {
    name: 'Market Analysis Score',
    value: 85,
    shapValue: 0.10,
    importance: 'medium',
    explanation: 'Strong market analysis showing growth potential in technology training sector',
    sourceDocument: 'market_research.pdf',
    sourceLocation: 'Market Opportunity Analysis'
  },
  {
    name: 'Financial History Score',
    value: 78,
    shapValue: 0.08,
    importance: 'medium',
    explanation: 'Good financial track record with consistent revenue growth',
    sourceDocument: 'bank_statements.pdf',
    sourceLocation: '12-Month Transaction History'
  }
];

// Sample Applications
export const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    title: { 
      en: 'Tech Training Center Baghdad',
      ar: 'مركز تدريب التكنولوجيا بغداد', 
      ku: 'ناوەندی ڕاهێنانی تەکنەلۆژیای بەغداد'
    },
    description: { 
      en: 'Computer training center specializing in programming and digital skills for young professionals',
      ar: 'مركز تدريب الحاسوب متخصص في البرمجة والمهارات الرقمية للمهنيين الشباب', 
      ku: 'ناوەندی ڕاهێنانی کۆمپیوتەر کە تایبەتە بە پرۆگرامسازی و شارەزایی دیجیتاڵی بۆ گەنجانی پیشەیی'
    },
    applicantId: 'user-001',
    applicantName: 'Ahmed Al-Rashid',
    sectorId: 'technology',
    regionId: 'baghdad',
    submittedDate: '2025-09-25T10:30:00Z',
    requestedAmount: 50000,
    currency: 'USD',
    status: 'under_review',
    riskScore: 72,
    riskLevel: 'medium',
    assessments: [
      {
        id: 'assess-001',
        applicationId: 'app-001',
        officerId: 'officer-001',
        officer: SAMPLE_USERS[3],
        riskScore: 72,
        riskLevel: 'medium',
        summary: 'Strong business plan with solid experience. Conservative financial projections but limited collateral coverage. Market analysis shows good potential in technology training sector.',
        factors: SAMPLE_ASSESSMENT_FACTORS,
        recommendation: 'conditional',
        conditions: ['Personal guarantee required', 'Monthly progress reports', 'Equipment insurance mandatory'],
        timestamp: '2025-09-26T14:22:00Z',
        modelVersion: 'tbi-risk-model-v1.2',
        confidence: 0.87
      }
    ],
    milestones: [
      {
        id: 'milestone-001',
        applicationId: 'app-001',
        title: {
          en: 'Equipment Purchase',
          ar: 'شراء المعدات',
          ku: 'کڕینی ئامێر'
        },
        description: {
          en: 'Purchase and install computer equipment and furniture',
          ar: 'شراء وتركيب معدات الحاسوب والأثاث',
          ku: 'کڕین و دامەزراندنی ئامێری کۆمپیوتەر و کەلوپەل'
        },
        dueDate: '2025-10-15T00:00:00Z',
        status: 'pending',
        evidence: [],
        verificationStatus: 'pending',
        order: 1,
        requirements: ['Purchase receipts', 'Installation photos', 'Equipment serial numbers']
      },
      {
        id: 'milestone-002',
        applicationId: 'app-001',
        title: {
          en: 'Staff Recruitment',
          ar: 'توظيف الموظفين',
          ku: 'دامەزراندنی ستاف'
        },
        description: {
          en: 'Hire and train qualified instructors',
          ar: 'توظيف وتدريب المدربين المؤهلين',
          ku: 'دامەزراندن و ڕاهێنانی مامۆستای شارەزا'
        },
        dueDate: '2025-11-01T00:00:00Z',
        status: 'pending',
        evidence: [],
        verificationStatus: 'pending',
        order: 2,
        requirements: ['Employment contracts', 'Qualification certificates', 'Training completion certificates']
      }
    ],
    documents: [],
    conversations: [],
    aiSummary: 'Strong business plan with 5 years relevant experience. Conservative financial projections but limited collateral coverage. Recommended for conditional approval with personal guarantee and monthly monitoring.',
    conditions: ['Personal guarantee required', 'Monthly progress reports', '6-month business mentor assignment', 'Equipment insurance mandatory'],
    createdAt: new Date('2025-09-25T10:30:00Z'),
    updatedAt: new Date('2025-09-28T14:22:00Z')
  },
  {
    id: 'app-002',
    title: { 
      en: 'Green Market Erbil',
      ar: 'السوق الأخضر أربيل', 
      ku: 'بازاڕی سەوز هەولێر'
    },
    description: { 
      en: 'Organic food market specializing in locally grown produce and healthy foods',
      ar: 'سوق الأطعمة العضوية متخصص في المنتجات المحلية والأطعمة الصحية', 
      ku: 'بازاڕی خۆراکی ئۆرگانیک کە تایبەتە بە بەرهەمی ناوخۆیی و خۆراکی تەندروست'
    },
    applicantId: 'user-002',
    applicantName: 'Fatima Hassan',
    sectorId: 'retail',
    regionId: 'erbil',
    submittedDate: '2025-09-26T09:15:00Z',
    requestedAmount: 25000,
    currency: 'USD',
    status: 'conditionally_approved',
    riskScore: 68,
    riskLevel: 'medium',
    assessments: [],
    milestones: [],
    documents: [],
    conversations: [],
    aiSummary: 'Solid retail concept with good market research. Prior retail experience is positive factor. Location analysis shows high foot traffic potential.',
    conditions: ['Store lease agreement review', 'Inventory management system implementation', 'Monthly financial reporting'],
    createdAt: new Date('2025-09-26T09:15:00Z'),
    updatedAt: new Date('2025-09-28T16:45:00Z')
  },
  {
    id: 'app-003',
    title: { 
      en: 'Basra Construction Materials',
      ar: 'مواد البناء البصرة', 
      ku: 'کەرەستەی بیناسازی بەسرە'
    },
    description: { 
      en: 'Wholesale supplier of construction materials and tools for the southern region',
      ar: 'مورد بالجملة لمواد وأدوات البناء للمنطقة الجنوبية', 
      ku: 'دابینکەری کەرەستە و ئامرازی بیناسازی بۆ هەرێمی باشوور'
    },
    applicantId: 'user-003',
    applicantName: 'Omar Karim',
    sectorId: 'construction',
    regionId: 'basra',
    submittedDate: '2025-09-24T14:20:00Z',
    requestedAmount: 75000,
    currency: 'USD',
    status: 'approved',
    riskScore: 82,
    riskLevel: 'low',
    assessments: [],
    milestones: [],
    documents: [],
    conversations: [],
    aiSummary: 'Excellent financial projections backed by existing contracts. Strong collateral coverage with warehouse and equipment. High approval confidence.',
    conditions: ['Quarterly financial reports', 'Insurance coverage verification'],
    createdAt: new Date('2025-09-24T14:20:00Z'),
    updatedAt: new Date('2025-09-29T11:30:00Z')
  }
];

// Localized Text for UI
export const UI_TEXT = {
  dashboard: {
    title: { en: 'Loan Applications Dashboard', ar: 'لوحة تحكم طلبات القروض', ku: 'داشبۆردی داواکارییەکانی قەرز' },
    newApplication: { en: 'New Application', ar: 'طلب جديد', ku: 'داواکاری نوێ' },
    searchPlaceholder: { en: 'Search applications...', ar: 'البحث في الطلبات...', ku: 'گەڕان لە داواکارییەکان...' }
  },
  status: {
    draft: { en: 'Draft', ar: 'مسودة', ku: 'ڕەشنووس' },
    submitted: { en: 'Submitted', ar: 'مُقدم', ku: 'پێشکەشکراو' },
    under_review: { en: 'Under Review', ar: 'قيد المراجعة', ku: 'لەژێر پێداچوونەوەدا' },
    conditionally_approved: { en: 'Conditional', ar: 'موافقة مشروطة', ku: 'مەرجدار پەسەند' },
    approved: { en: 'Approved', ar: 'موافق عليه', ku: 'پەسەندکراو' },
    rejected: { en: 'Rejected', ar: 'مرفوض', ku: 'ڕەتکراو' }
  },
  risk: {
    low: { en: 'Low Risk', ar: 'مخاطر منخفضة', ku: 'مەترسی کەم' },
    medium: { en: 'Medium Risk', ar: 'مخاطر متوسطة', ku: 'مەترسی مامناوەند' },
    high: { en: 'High Risk', ar: 'مخاطر عالية', ku: 'مەترسی زۆر' }
  },
  currency: {
    format: (amount: number, currency: 'IQD' | 'USD') => {
      if (currency === 'IQD') {
        return new Intl.NumberFormat('ar-IQ', {
          style: 'currency',
          currency: 'IQD',
          minimumFractionDigits: 0
        }).format(amount);
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  }
};
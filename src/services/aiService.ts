// AI Service for TBi Bank Loan Assessment Platform
import { 
  Assessment, 
  OCRResult, 
  VoiceProcessingResult, 
  ExplainabilityData, 
  AssessmentFactor,
  User 
} from '../types/banking';

class AIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env?.VITE_AI_SERVICE_URL || 'http://localhost:3001/api/ai';
    this.apiKey = import.meta.env?.VITE_AI_API_KEY || 'demo-key';
  }

  // Document OCR Processing
  async processDocument(file: File, documentType: string): Promise<OCRResult> {
    console.log(`Processing ${file.name} as ${documentType}...`);
    
    // Simulate processing time
    await this.delay(2000);
    
    // Mock OCR results based on document type
    const mockResults: Record<string, any> = {
      business_plan: {
        businessName: 'Tech Training Center Baghdad',
        ownerName: 'Ahmed Al-Rashid',
        requestedAmount: 50000,
        businessType: 'Technology Training',
        yearsOfExperience: 5,
        monthlyRevenue: 8500,
        expenses: 6200,
        location: 'Baghdad, Iraq',
        employees: 8
      },
      financials: {
        annualRevenue: 102000,
        netProfit: 27600,
        assets: 45000,
        liabilities: 18000,
        cashFlow: 2300,
        dscr: 1.4
      },
      id: {
        fullName: 'Ahmed Al-Rashid',
        idNumber: '12345678901',
        dateOfBirth: '1985-03-15',
        address: 'Al-Mansour District, Baghdad'
      }
    };

    return {
      text: `Sample extracted text from ${file.name}. This document contains ${documentType} information.`,
      confidence: 0.95,
      structuredData: mockResults[documentType] || {},
      tables: documentType === 'financials' ? [
        {
          headers: ['Period', 'Revenue', 'Expenses', 'Net Income'],
          rows: [
            ['Q1 2025', '$25,000', '$18,000', '$7,000'],
            ['Q2 2025', '$28,000', '$19,500', '$8,500'],
            ['Q3 2025', '$26,500', '$18,800', '$7,700'],
            ['Q4 2025', '$22,500', '$16,200', '$6,300']
          ],
          confidence: 0.92,
          location: { x: 50, y: 100, width: 400, height: 200 }
        }
      ] : [],
      entities: [
        {
          text: mockResults[documentType]?.ownerName || 'Ahmed Al-Rashid',
          type: 'PERSON',
          confidence: 0.98,
          location: { x: 100, y: 200, width: 150, height: 25 }
        },
        {
          text: `$${mockResults[documentType]?.requestedAmount || '50,000'}`,
          type: 'MONEY',
          confidence: 0.96,
          location: { x: 300, y: 400, width: 80, height: 20 }
        }
      ],
      boundingBoxes: []
    };
  }

  // Risk Assessment Generation
  async generateRiskAssessment(applicationId: string, documentData: any): Promise<Assessment> {
    console.log(`Generating risk assessment for application ${applicationId}...`);
    
    // Simulate AI processing time
    await this.delay(3000);

    const riskScore = this.calculateRiskScore(documentData);
    const factors = this.generateAssessmentFactors(documentData, riskScore);
    
    const mockOfficer: User = {
      id: 'ai-system',
      name: 'AI Assessment System',
      email: 'ai@tbibank.com',
      role: 'admin',
      avatarUrl: '/avatars/ai-system.png',
      isVerified: true,
      createdAt: new Date()
    };

    return {
      id: `assessment-${Date.now()}`,
      applicationId,
      officerId: 'ai-system',
      officer: mockOfficer,
      riskScore,
      riskLevel: riskScore >= 75 ? 'low' : riskScore >= 60 ? 'medium' : 'high',
      summary: this.generateAssessmentSummary(documentData, riskScore),
      factors,
      recommendation: riskScore >= 75 ? 'approve' : riskScore >= 60 ? 'conditional' : 'reject',
      conditions: riskScore >= 60 ? [
        'Personal guarantee required',
        'Monthly financial reporting',
        'Equipment insurance mandatory'
      ] : [],
      timestamp: new Date().toISOString(),
      modelVersion: 'tbi-risk-model-v1.2',
      confidence: 0.87
    };
  }

  // Voice Processing
  async processVoiceQuery(
    audioBlob: Blob, 
    context: string, 
    language: string = 'ar'
  ): Promise<VoiceProcessingResult> {
    console.log(`Processing voice query in ${language}...`);
    
    await this.delay(1500);

    // Mock transcription based on language
    const mockTranscripts = {
      ar: 'ما هي الوثائق المطلوبة الإضافية لطلب القرض؟',
      en: 'What additional documents are required for the loan application?',
      ku: 'چ بەڵگەنامەیەکی زیاتر پێویستە بۆ داواکاری قەرزەکە؟'
    };

    const mockResponses = {
      ar: 'نحتاج إلى تقرير التدفق النقدي المحدث للأشهر 4-6 وخطاب ضمان من البنك. يمكنك تحميل هذه الوثائق في قسم المستندات.',
      en: 'We need an updated cash flow report for months 4-6 and a bank guarantee letter. You can upload these documents in the Documents section.',
      ku: 'پێویستمان بە ڕاپۆرتی کەش فلۆی نوێکراوەیە بۆ مانگەکانی 4-6 و نامەی ضەمانەتی بانک. دەتوانیت ئەم بەڵگەنامانە لە بەشی بەڵگەنامەکان بار بکەیت.'
    };

    return {
      transcript: mockTranscripts[language as keyof typeof mockTranscripts] || mockTranscripts.en,
      confidence: 0.92,
      language: language as any,
      intent: 'request_document_info',
      entities: {
        document_type: 'cash_flow_report',
        time_period: 'months_4_6',
        urgency: 'normal'
      },
      response: mockResponses[language as keyof typeof mockResponses] || mockResponses.en,
      audioUrl: '/generated-response.mp3'
    };
  }

  // Generate Executive Summary
  async generateExecutiveSummary(applicationId: string, documents: any[]): Promise<string> {
    console.log(`Generating executive summary for application ${applicationId}...`);
    
    await this.delay(1000);

    return `AI Executive Summary: The applicant demonstrates strong business acumen with 5 years of relevant experience in technology training. Financial projections are conservative but realistic, showing sustainable growth potential with a DSCR of 1.4. Primary risk factors include limited collateral coverage (25% of loan value) and dependency on local market conditions. Market analysis indicates strong demand for technology training in Baghdad. Recommendation: Conditional approval with personal guarantee, monthly progress monitoring, and equipment insurance requirements. Expected loan performance: Good with proper oversight.`;
  }

  // Explainability Data
  async generateExplainability(assessmentId: string): Promise<ExplainabilityData> {
    console.log(`Generating explainability data for assessment ${assessmentId}...`);
    
    await this.delay(800);

    return {
      modelVersion: 'tbi-risk-model-v1.2',
      features: [
        {
          name: 'Years of Experience',
          value: 5,
          shapValue: 0.15,
          importance: 'high',
          explanation: 'Strong positive impact due to substantial business experience',
          sourceDocument: 'business_plan.pdf',
          sourceLocation: 'Experience section, page 2'
        },
        {
          name: 'Debt Service Coverage Ratio',
          value: 1.4,
          shapValue: 0.12,
          importance: 'high',
          explanation: 'Above minimum threshold of 1.2, indicating good repayment capacity',
          sourceDocument: 'financial_projections.xlsx',
          sourceLocation: 'Cash flow analysis tab'
        },
        {
          name: 'Collateral to Loan Ratio',
          value: 0.25,
          shapValue: -0.08,
          importance: 'medium',
          explanation: 'Below preferred 50% coverage, increasing risk exposure',
          sourceDocument: 'collateral_assessment.pdf',
          sourceLocation: 'Asset valuation summary'
        },
        {
          name: 'Market Growth Potential',
          value: 85,
          shapValue: 0.10,
          importance: 'medium',
          explanation: 'Strong market opportunity in technology training sector',
          sourceDocument: 'market_research.pdf',
          sourceLocation: 'Growth projections section'
        }
      ],
      decisionPath: [
        'Document extraction completed with 95% confidence',
        'Financial ratios calculated from extracted data',
        'Risk factors weighted using sector-specific model (Technology: 1.2x)',
        'Regional adjustment applied (Baghdad: neutral)',
        'Final score adjusted for collateral coverage limitations'
      ],
      alternativeScenarios: [
        {
          description: 'If collateral coverage increased to 50%',
          scoreChange: 8,
          changedFactors: ['Collateral to Loan Ratio']
        },
        {
          description: 'If DSCR improved to 1.6',
          scoreChange: 5,
          changedFactors: ['Debt Service Coverage Ratio']
        },
        {
          description: 'If experience reduced to 2 years',
          scoreChange: -12,
          changedFactors: ['Years of Experience']
        }
      ],
      timestamp: new Date(),
      confidence: 0.87
    };
  }

  // Private helper methods
  private calculateRiskScore(data: any): number {
    let score = 50; // Base score
    
    // Experience factor
    const experience = data.yearsOfExperience || 3;
    if (experience >= 5) score += 15;
    else if (experience >= 3) score += 10;
    else if (experience >= 1) score += 5;
    
    // Financial health
    const monthlyRevenue = data.monthlyRevenue || 5000;
    const expenses = data.expenses || 4000;
    const requestedAmount = data.requestedAmount || 50000;
    
    const dscr = (monthlyRevenue - expenses) / (requestedAmount * 0.1 / 12);
    if (dscr >= 1.5) score += 20;
    else if (dscr >= 1.2) score += 15;
    else if (dscr >= 1.0) score += 5;
    else score -= 10;
    
    // Business type factor
    if (data.businessType === 'Technology Training') score += 5;
    
    // Random factor for demo variability
    score += Math.random() * 10 - 5;
    
    return Math.max(20, Math.min(100, Math.round(score)));
  }

  private generateAssessmentFactors(data: any, riskScore: number): AssessmentFactor[] {
    return [
      {
        name: 'Business Experience (Years)',
        value: data.yearsOfExperience || 3,
        shapValue: 0.15,
        importance: 'high',
        explanation: `${data.yearsOfExperience || 3} years of relevant business experience provides strong foundation`,
        sourceDocument: 'business_plan.pdf',
        sourceLocation: 'Experience section, page 2'
      },
      {
        name: 'DSCR (Debt Service Coverage Ratio)',
        value: 1.4,
        shapValue: 0.12,
        importance: 'high',
        explanation: 'Strong cash flow coverage indicates good repayment capacity',
        sourceDocument: 'financial_projections.xlsx',
        sourceLocation: 'Cash flow analysis'
      },
      {
        name: 'Collateral Coverage',
        value: '25%',
        shapValue: -0.08,
        importance: 'medium',
        explanation: 'Limited collateral coverage increases risk exposure',
        sourceDocument: 'collateral_assessment.pdf',
        sourceLocation: 'Asset valuation'
      },
      {
        name: 'Market Potential Score',
        value: 85,
        shapValue: 0.10,
        importance: 'medium',
        explanation: 'Strong market demand for proposed business sector',
        sourceDocument: 'market_research.pdf',
        sourceLocation: 'Market analysis'
      },
      {
        name: 'Financial Stability',
        value: Math.round(riskScore * 0.8),
        shapValue: 0.08,
        importance: 'medium',
        explanation: 'Financial history and projections show stability',
        sourceDocument: 'bank_statements.pdf',
        sourceLocation: 'Transaction history'
      }
    ];
  }

  private generateAssessmentSummary(data: any, riskScore: number): string {
    const experience = data.yearsOfExperience >= 5 ? 'Strong' : 
                     data.yearsOfExperience >= 3 ? 'Moderate' : 'Limited';
    
    const financial = riskScore >= 75 ? 'excellent' : 
                     riskScore >= 60 ? 'good' : 'concerning';
    
    const businessType = data.businessType || 'business';
    
    return `${experience} business experience in ${businessType.toLowerCase()} with ${financial} financial projections. Risk score: ${riskScore}/100. ${
      riskScore >= 75 ? 'Recommended for approval with standard terms.' : 
      riskScore >= 60 ? 'Conditional approval recommended with enhanced monitoring and guarantees.' : 
      'Additional collateral or guarantees required before approval consideration.'
    }`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
/**
 * TBi Bank CSDR Risk Assessment Engine
 * 
 * Core risk scoring engine with:
 * - Configurable factor weights
 * - Threshold-based risk categorization
 * - Explainability generation (SHAP-like values)
 * - Multi-factor analysis
 * - Alternative scenario computation
 */

import { PrismaClient, RiskLevel, LoanRecommendation } from '@prisma/client';

const prisma = new PrismaClient();

// ====================== TYPES ======================

export interface RiskFactorInput {
  creditScore: number;
  creditScoreDate: Date;
  previousDefaults: number;
  
  annualIncome: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  debtToIncomeRatio: number;
  
  employmentType: string;
  yearsEmployed: number;
  yearsInIndustry: number;
  
  loanAmount: number;
  collateralValue?: number;
  collateralType?: string;
  
  marketScore?: number; // External market condition score (0-100)
}

export interface RiskConfiguration {
  version: string;
  weights: {
    creditHistory: number;
    incomeStability: number;
    employment: number;
    collateral: number;
    marketConditions: number;
    debtToIncomeRatio: number;
  };
  thresholds: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  autoApproveThreshold: number;
  autoRejectThreshold: number;
}

export interface FactorAssessment {
  score: number; // 0-100
  weight: number; // percentage
  contribution: number; // weighted contribution to final score
  explanation: string;
  dataPoints: string[];
  confidence: number; // 0-100
}

export interface RiskAssessmentResult {
  riskScore: number; // 0-100 (lower is better/safer)
  riskCategory: RiskLevel;
  recommendation: LoanRecommendation;
  confidence: number;
  
  factors: {
    creditHistory: FactorAssessment;
    incomeStability: FactorAssessment;
    employment: FactorAssessment;
    collateral: FactorAssessment;
    marketConditions: FactorAssessment;
    debtToIncomeRatio: FactorAssessment;
  };
  
  keyRiskIndicators: string[];
  mitigationSuggestions: string[];
  
  explainability: {
    methodology: string;
    dataPoints: number;
    confidenceFactors: string[];
    limitations: string[];
    alternativeScenarios: AlternativeScenario[];
  };
}

export interface AlternativeScenario {
  description: string;
  scoreChange: number;
  newScore: number;
  changedFactors: string[];
}

// ====================== RISK ENGINE ======================

export class RiskEngine {
  private config: RiskConfiguration;
  
  constructor(config: RiskConfiguration) {
    this.config = config;
    this.validateConfig();
  }
  
  /**
   * Main assessment function
   */
  async assessRisk(input: RiskFactorInput): Promise<RiskAssessmentResult> {
    // Calculate individual factor scores
    const creditHistoryFactor = this.assessCreditHistory(input);
    const incomeStabilityFactor = this.assessIncomeStability(input);
    const employmentFactor = this.assessEmployment(input);
    const collateralFactor = this.assessCollateral(input);
    const marketConditionsFactor = this.assessMarketConditions(input);
    const debtToIncomeRatioFactor = this.assessDebtToIncomeRatio(input);
    
    // Apply weights and calculate final score
    const weightedScore = 
      (creditHistoryFactor.score * this.config.weights.creditHistory / 100) +
      (incomeStabilityFactor.score * this.config.weights.incomeStability / 100) +
      (employmentFactor.score * this.config.weights.employment / 100) +
      (collateralFactor.score * this.config.weights.collateral / 100) +
      (marketConditionsFactor.score * this.config.weights.marketConditions / 100) +
      (debtToIncomeRatioFactor.score * this.config.weights.debtToIncomeRatio / 100);
    
    const riskScore = Math.round(weightedScore * 100) / 100;
    
    // Determine risk category
    const riskCategory = this.categorizeRisk(riskScore);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(riskScore, riskCategory);
    
    // Calculate confidence
    const confidence = this.calculateConfidence([
      creditHistoryFactor,
      incomeStabilityFactor,
      employmentFactor,
      collateralFactor,
      marketConditionsFactor,
      debtToIncomeRatioFactor
    ]);
    
    // Identify key risk indicators
    const keyRiskIndicators = this.identifyRiskIndicators(input, {
      creditHistory: creditHistoryFactor,
      incomeStability: incomeStabilityFactor,
      employment: employmentFactor,
      collateral: collateralFactor,
      marketConditions: marketConditionsFactor,
      debtToIncomeRatio: debtToIncomeRatioFactor
    });
    
    // Generate mitigation suggestions
    const mitigationSuggestions = this.generateMitigationSuggestions(input, keyRiskIndicators);
    
    // Generate alternative scenarios
    const alternativeScenarios = this.generateAlternativeScenarios(input, riskScore);
    
    return {
      riskScore,
      riskCategory,
      recommendation,
      confidence,
      factors: {
        creditHistory: creditHistoryFactor,
        incomeStability: incomeStabilityFactor,
        employment: employmentFactor,
        collateral: collateralFactor,
        marketConditions: marketConditionsFactor,
        debtToIncomeRatio: debtToIncomeRatioFactor
      },
      keyRiskIndicators,
      mitigationSuggestions,
      explainability: {
        methodology: 'Multi-factor weighted risk analysis with configurable thresholds',
        dataPoints: 15,
        confidenceFactors: [
          'Credit score data age',
          'Employment stability',
          'Income verification status',
          'Collateral appraisal quality'
        ],
        limitations: [
          'Historical performance data not yet available for model validation',
          'Market conditions are estimated based on regional indicators',
          'Model requires periodic recalibration with actual loan outcomes'
        ],
        alternativeScenarios
      }
    };
  }
  
  // ====================== FACTOR ASSESSMENT METHODS ======================
  
  private assessCreditHistory(input: RiskFactorInput): FactorAssessment {
    const { creditScore, previousDefaults, creditScoreDate } = input;
    
    // Normalize credit score (higher is better)
    // Assuming score range of 300-850 (FICO-like)
    let scoreNormalized = ((creditScore - 300) / 550) * 100;
    scoreNormalized = Math.max(0, Math.min(100, scoreNormalized));
    
    // Penalize for defaults (each default reduces score by 15 points)
    const defaultPenalty = previousDefaults * 15;
    scoreNormalized = Math.max(0, scoreNormalized - defaultPenalty);
    
    // Check credit score age (prefer recent scores)
    const ageInDays = Math.floor((Date.now() - creditScoreDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageConfidence = ageInDays < 90 ? 100 : Math.max(50, 100 - (ageInDays - 90) / 3);
    
    // Inverse score for risk (lower credit score = higher risk score)
    const riskScore = 100 - scoreNormalized;
    
    return {
      score: Math.round(riskScore * 100) / 100,
      weight: this.config.weights.creditHistory,
      contribution: (riskScore * this.config.weights.creditHistory / 100),
      explanation: this.generateCreditExplanation(creditScore, previousDefaults, ageInDays),
      dataPoints: [
        `Credit score: ${creditScore}`,
        `Previous defaults: ${previousDefaults}`,
        `Score age: ${ageInDays} days`
      ],
      confidence: ageConfidence
    };
  }
  
  private assessIncomeStability(input: RiskFactorInput): FactorAssessment {
    const { annualIncome, monthlyIncome, monthlyExpenses } = input;
    
    // Calculate disposable income ratio
    const disposableIncome = monthlyIncome - monthlyExpenses;
    const disposableRatio = disposableIncome / monthlyIncome;
    
    // Score based on disposable income (higher is better, lower risk)
    let score = 0;
    if (disposableRatio >= 0.4) score = 10; // Excellent
    else if (disposableRatio >= 0.3) score = 25; // Good
    else if (disposableRatio >= 0.2) score = 50; // Fair
    else if (disposableRatio >= 0.1) score = 75; // Poor
    else score = 90; // Critical
    
    // Adjust based on absolute income level
    if (annualIncome < 15000) score += 10; // Low income increases risk
    else if (annualIncome < 30000) score += 5;
    else if (annualIncome > 100000) score -= 5; // High income reduces risk
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score: Math.round(score * 100) / 100,
      weight: this.config.weights.incomeStability,
      contribution: (score * this.config.weights.incomeStability / 100),
      explanation: this.generateIncomeExplanation(disposableRatio, annualIncome),
      dataPoints: [
        `Annual income: $${annualIncome.toLocaleString()}`,
        `Monthly disposable: $${disposableIncome.toLocaleString()}`,
        `Disposable ratio: ${(disposableRatio * 100).toFixed(1)}%`
      ],
      confidence: 90
    };
  }
  
  private assessEmployment(input: RiskFactorInput): FactorAssessment {
    const { employmentType, yearsEmployed, yearsInIndustry } = input;
    
    let score = 50; // Base score
    
    // Employment type scoring
    const employmentScores: Record<string, number> = {
      'FULL_TIME': 0,
      'SELF_EMPLOYED': 15,
      'CONTRACT': 25,
      'PART_TIME': 35,
      'RETIRED': 20,
      'UNEMPLOYED': 80
    };
    score += employmentScores[employmentType] || 30;
    
    // Years employed (longer is better)
    if (yearsEmployed >= 5) score -= 20;
    else if (yearsEmployed >= 3) score -= 10;
    else if (yearsEmployed >= 1) score -= 5;
    else score += 10; // Less than 1 year increases risk
    
    // Industry experience
    if (yearsInIndustry >= 10) score -= 10;
    else if (yearsInIndustry >= 5) score -= 5;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score: Math.round(score * 100) / 100,
      weight: this.config.weights.employment,
      contribution: (score * this.config.weights.employment / 100),
      explanation: this.generateEmploymentExplanation(employmentType, yearsEmployed, yearsInIndustry),
      dataPoints: [
        `Employment type: ${employmentType}`,
        `Years employed: ${yearsEmployed}`,
        `Industry experience: ${yearsInIndustry} years`
      ],
      confidence: 85
    };
  }
  
  private assessCollateral(input: RiskFactorInput): FactorAssessment {
    const { loanAmount, collateralValue, collateralType } = input;
    
    if (!collateralValue || collateralValue === 0) {
      return {
        score: 80, // High risk for unsecured loans
        weight: this.config.weights.collateral,
        contribution: (80 * this.config.weights.collateral / 100),
        explanation: 'No collateral provided - unsecured loan increases risk significantly',
        dataPoints: ['Loan type: Unsecured'],
        confidence: 100
      };
    }
    
    // Calculate loan-to-value ratio
    const ltv = (loanAmount / collateralValue) * 100;
    
    // Score based on LTV (lower LTV = lower risk)
    let score = 0;
    if (ltv <= 50) score = 10; // Excellent coverage
    else if (ltv <= 70) score = 25; // Good coverage
    else if (ltv <= 90) score = 50; // Acceptable coverage
    else if (ltv <= 100) score = 70; // Minimal coverage
    else score = 90; // Undercollateralized
    
    // Adjust based on collateral type
    const collateralAdjustments: Record<string, number> = {
      'REAL_ESTATE': -5,
      'CASH_DEPOSIT': -10,
      'SECURITIES': 0,
      'VEHICLE': 5,
      'EQUIPMENT': 10,
      'INVENTORY': 15
    };
    score += collateralAdjustments[collateralType || ''] || 0;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score: Math.round(score * 100) / 100,
      weight: this.config.weights.collateral,
      contribution: (score * this.config.weights.collateral / 100),
      explanation: this.generateCollateralExplanation(ltv, collateralType),
      dataPoints: [
        `Loan amount: $${loanAmount.toLocaleString()}`,
        `Collateral value: $${collateralValue.toLocaleString()}`,
        `LTV ratio: ${ltv.toFixed(1)}%`,
        `Type: ${collateralType || 'Not specified'}`
      ],
      confidence: 80
    };
  }
  
  private assessMarketConditions(input: RiskFactorInput): FactorAssessment {
    // In production, this would fetch real market indicators
    // For now, use provided score or default to neutral
    const marketScore = input.marketScore || 50;
    
    return {
      score: marketScore,
      weight: this.config.weights.marketConditions,
      contribution: (marketScore * this.config.weights.marketConditions / 100),
      explanation: this.generateMarketExplanation(marketScore),
      dataPoints: [
        'Economic growth rate: Stable',
        'Regional unemployment: Moderate',
        'Industry outlook: Neutral'
      ],
      confidence: 60 // Lower confidence as it's harder to predict
    };
  }
  
  private assessDebtToIncomeRatio(input: RiskFactorInput): FactorAssessment {
    const { debtToIncomeRatio } = input;
    
    // Score based on DTI (lower is better)
    let score = 0;
    if (debtToIncomeRatio <= 20) score = 10; // Excellent
    else if (debtToIncomeRatio <= 30) score = 25; // Good
    else if (debtToIncomeRatio <= 40) score = 50; // Acceptable
    else if (debtToIncomeRatio <= 50) score = 75; // High
    else score = 90; // Critical
    
    return {
      score: Math.round(score * 100) / 100,
      weight: this.config.weights.debtToIncomeRatio,
      contribution: (score * this.config.weights.debtToIncomeRatio / 100),
      explanation: this.generateDTIExplanation(debtToIncomeRatio),
      dataPoints: [
        `Debt-to-income ratio: ${debtToIncomeRatio.toFixed(1)}%`
      ],
      confidence: 95
    };
  }
  
  // ====================== HELPER METHODS ======================
  
  private categorizeRisk(score: number): RiskLevel {
    if (score < this.config.thresholds.lowRisk) return 'LOW';
    if (score < this.config.thresholds.mediumRisk) return 'MEDIUM';
    if (score < this.config.thresholds.highRisk) return 'HIGH';
    return 'CRITICAL';
  }
  
  private generateRecommendation(score: number, category: RiskLevel): LoanRecommendation {
    if (score <= this.config.autoApproveThreshold) return 'APPROVE';
    if (score >= this.config.autoRejectThreshold) return 'REJECT';
    return 'REVIEW';
  }
  
  private calculateConfidence(factors: FactorAssessment[]): number {
    const avgConfidence = factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length;
    return Math.round(avgConfidence * 100) / 100;
  }
  
  private identifyRiskIndicators(input: RiskFactorInput, factors: any): string[] {
    const indicators: string[] = [];
    
    if (factors.creditHistory.score > 60) indicators.push('Poor credit history');
    if (factors.incomeStability.score > 60) indicators.push('Limited disposable income');
    if (factors.employment.score > 60) indicators.push('Employment instability');
    if (factors.collateral.score > 70) indicators.push('Insufficient collateral coverage');
    if (factors.debtToIncomeRatio.score > 60) indicators.push('High existing debt burden');
    if (input.previousDefaults > 0) indicators.push(`${input.previousDefaults} previous default(s)`);
    
    return indicators;
  }
  
  private generateMitigationSuggestions(input: RiskFactorInput, indicators: string[]): string[] {
    const suggestions: string[] = [];
    
    if (indicators.some(i => i.includes('collateral'))) {
      suggestions.push('Request additional collateral or co-signer');
    }
    if (indicators.some(i => i.includes('income'))) {
      suggestions.push('Reduce loan amount or extend repayment term');
    }
    if (indicators.some(i => i.includes('credit'))) {
      suggestions.push('Require credit counseling or financial education');
    }
    if (indicators.some(i => i.includes('employment'))) {
      suggestions.push('Wait for employment stability (6+ months)');
    }
    if (indicators.some(i => i.includes('debt'))) {
      suggestions.push('Recommend debt consolidation before loan approval');
    }
    
    suggestions.push('Monthly progress monitoring and reporting');
    suggestions.push('Personal guarantee from business owner');
    
    return suggestions;
  }
  
  private generateAlternativeScenarios(input: RiskFactorInput, currentScore: number): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    
    // Scenario 1: Improved collateral
    if (input.collateralValue) {
      const improvedCollateral = input.collateralValue * 1.5;
      const newLTV = (input.loanAmount / improvedCollateral) * 100;
      const scoreImprovement = newLTV < 70 ? 8 : 5;
      scenarios.push({
        description: `If collateral value increased to $${improvedCollateral.toLocaleString()}`,
        scoreChange: -scoreImprovement,
        newScore: Math.round((currentScore - scoreImprovement) * 100) / 100,
        changedFactors: ['collateral']
      });
    }
    
    // Scenario 2: Reduced loan amount
    const reducedLoan = input.loanAmount * 0.75;
    scenarios.push({
      description: `If loan amount reduced to $${reducedLoan.toLocaleString()} (25% reduction)`,
      scoreChange: -6,
      newScore: Math.round((currentScore - 6) * 100) / 100,
      changedFactors: ['collateral', 'debtToIncomeRatio']
    });
    
    // Scenario 3: Improved credit score
    if (input.creditScore < 700) {
      scenarios.push({
        description: 'If credit score improved to 720+',
        scoreChange: -12,
        newScore: Math.round((currentScore - 12) * 100) / 100,
        changedFactors: ['creditHistory']
      });
    }
    
    return scenarios;
  }
  
  private validateConfig(): void {
    const totalWeight = 
      this.config.weights.creditHistory +
      this.config.weights.incomeStability +
      this.config.weights.employment +
      this.config.weights.collateral +
      this.config.weights.marketConditions +
      this.config.weights.debtToIncomeRatio;
    
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Risk configuration weights must sum to 100, got ${totalWeight}`);
    }
  }
  
  // ====================== EXPLANATION GENERATORS ======================
  
  private generateCreditExplanation(score: number, defaults: number, age: number): string {
    if (score >= 750) return 'Excellent credit history with strong repayment track record';
    if (score >= 700) return 'Good credit history demonstrating reliable financial behavior';
    if (score >= 650) return 'Fair credit history with some past challenges but improving';
    if (score >= 600) return 'Below average credit history with notable risk factors';
    return 'Poor credit history with significant concerns requiring careful review';
  }
  
  private generateIncomeExplanation(ratio: number, income: number): string {
    if (ratio >= 0.4) return 'Strong income stability with significant disposable income';
    if (ratio >= 0.3) return 'Good income position supporting loan repayment capacity';
    if (ratio >= 0.2) return 'Adequate income but limited financial flexibility';
    return 'Concerning income situation with minimal disposable income';
  }
  
  private generateEmploymentExplanation(type: string, years: number, industry: number): string {
    if (type === 'FULL_TIME' && years >= 5) return 'Stable full-time employment with excellent tenure';
    if (type === 'FULL_TIME' && years >= 2) return 'Good full-time employment stability';
    if (type === 'SELF_EMPLOYED') return 'Self-employed status requires enhanced income verification';
    return 'Employment situation requires additional assessment';
  }
  
  private generateCollateralExplanation(ltv: number, type?: string): string {
    if (ltv <= 50) return `Excellent collateral coverage providing strong security (LTV: ${ltv.toFixed(1)}%)`;
    if (ltv <= 70) return `Good collateral coverage with acceptable risk level (LTV: ${ltv.toFixed(1)}%)`;
    if (ltv <= 90) return `Moderate collateral coverage requiring monitoring (LTV: ${ltv.toFixed(1)}%)`;
    return `Limited collateral coverage increasing default risk (LTV: ${ltv.toFixed(1)}%)`;
  }
  
  private generateMarketExplanation(score: number): string {
    if (score <= 30) return 'Favorable market conditions supporting loan performance';
    if (score <= 50) return 'Neutral market conditions with balanced outlook';
    return 'Challenging market conditions requiring careful monitoring';
  }
  
  private generateDTIExplanation(ratio: number): string {
    if (ratio <= 20) return 'Excellent debt management with minimal existing obligations';
    if (ratio <= 30) return 'Good debt levels supporting additional borrowing capacity';
    if (ratio <= 40) return 'Moderate debt burden approaching prudent limits';
    return 'High debt burden limiting additional borrowing capacity';
  }
}

// ====================== EXPORT DEFAULT CONFIGURATION ======================

export const DEFAULT_RISK_CONFIG: RiskConfiguration = {
  version: '1.0.0',
  weights: {
    creditHistory: 30,
    incomeStability: 25,
    employment: 15,
    collateral: 15,
    marketConditions: 5,
    debtToIncomeRatio: 10
  },
  thresholds: {
    lowRisk: 30,
    mediumRisk: 50,
    highRisk: 70
  },
  autoApproveThreshold: 25,
  autoRejectThreshold: 75
};
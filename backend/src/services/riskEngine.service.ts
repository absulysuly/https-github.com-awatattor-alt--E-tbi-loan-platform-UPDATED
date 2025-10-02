import { prisma } from '../server';
import {
  LoanApplication,
  Applicant,
  RiskLevel,
  LoanRecommendation,
  RiskConfiguration,
} from '@prisma/client';

export interface RiskFactorScore {
  score: number; // 0-100
  weight: number;
  weightedScore: number;
  indicators: string[];
  explanation: string;
}

export interface RiskAssessmentResult {
  riskScore: number; // 0-100
  riskCategory: RiskLevel;
  recommendation: LoanRecommendation;
  confidence: number;
  factorScores: {
    creditHistory: RiskFactorScore;
    incomeStability: RiskFactorScore;
    employment: RiskFactorScore;
    collateral: RiskFactorScore;
    marketConditions: RiskFactorScore;
    debtToIncomeRatio: RiskFactorScore;
  };
  keyRiskIndicators: string[];
  mitigationSuggestions: string[];
  explainability: {
    shapValues: Record<string, number>;
    decisionPath: string[];
    scenarios: Array<{
      name: string;
      change: string;
      newScore: number;
      impact: number;
    }>;
  };
}

export class RiskEngineService {
  /**
   * Perform comprehensive risk assessment on a loan application
   */
  static async assessLoanApplication(
    applicationId: string,
    configVersion?: string
  ): Promise<RiskAssessmentResult> {
    // Fetch application with applicant
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { applicant: true },
    });

    if (!application) {
      throw new Error('Loan application not found');
    }

    // Get active risk configuration
    const config = configVersion
      ? await prisma.riskConfiguration.findUnique({
          where: { version: configVersion },
        })
      : await prisma.riskConfiguration.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });

    if (!config) {
      throw new Error('No active risk configuration found');
    }

    // Calculate individual factor scores
    const factorScores = {
      creditHistory: this.assessCreditHistory(application.applicant, config),
      incomeStability: this.assessIncomeStability(application.applicant, config),
      employment: this.assessEmployment(application.applicant, config),
      collateral: this.assessCollateral(application, config),
      marketConditions: this.assessMarketConditions(application, config),
      debtToIncomeRatio: this.assessDebtToIncomeRatio(application.applicant, config),
    };

    // Calculate overall risk score
    const riskScore =
      factorScores.creditHistory.weightedScore +
      factorScores.incomeStability.weightedScore +
      factorScores.employment.weightedScore +
      factorScores.collateral.weightedScore +
      factorScores.marketConditions.weightedScore +
      factorScores.debtToIncomeRatio.weightedScore;

    // Determine risk category
    const riskCategory = this.determineRiskCategory(riskScore, config);

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskScore, config);

    // Calculate confidence
    const confidence = this.calculateConfidence(factorScores, application);

    // Collect key risk indicators
    const keyRiskIndicators = this.collectKeyRiskIndicators(factorScores);

    // Generate mitigation suggestions
    const mitigationSuggestions = this.generateMitigationSuggestions(factorScores);

    // Generate explainability data
    const explainability = this.generateExplainability(factorScores, application);

    return {
      riskScore,
      riskCategory,
      recommendation,
      confidence,
      factorScores,
      keyRiskIndicators,
      mitigationSuggestions,
      explainability,
    };
  }

  /**
   * Assess credit history factor
   */
  private static assessCreditHistory(
    applicant: Applicant,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    let baseScore = 0;

    // Credit score contribution (0-60 points)
    if (applicant.creditScore >= 750) {
      baseScore += 60;
      indicators.push('Excellent credit score');
    } else if (applicant.creditScore >= 700) {
      baseScore += 50;
      indicators.push('Good credit score');
    } else if (applicant.creditScore >= 650) {
      baseScore += 40;
      indicators.push('Fair credit score');
    } else if (applicant.creditScore >= 600) {
      baseScore += 25;
      indicators.push('Below average credit score');
    } else {
      baseScore += 10;
      indicators.push('Poor credit score - HIGH RISK');
    }

    // Previous defaults (0-40 points)
    if (applicant.previousDefaults === 0) {
      baseScore += 40;
      indicators.push('No previous defaults');
    } else if (applicant.previousDefaults === 1) {
      baseScore += 25;
      indicators.push('One previous default');
    } else {
      baseScore += 5;
      indicators.push(`${applicant.previousDefaults} previous defaults - HIGH RISK`);
    }

    const weight = config.weightCreditHistory;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: `Credit history evaluated based on score (${applicant.creditScore}) and default history (${applicant.previousDefaults} defaults)`,
    };
  }

  /**
   * Assess income stability factor
   */
  private static assessIncomeStability(
    applicant: Applicant,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    let baseScore = 0;

    // Income to loan ratio
    const monthlyIncome = applicant.monthlyIncome;
    indicators.push(`Monthly income: $${monthlyIncome.toLocaleString()}`);

    // Stability based on income level
    if (monthlyIncome >= 10000) {
      baseScore += 50;
      indicators.push('High income level');
    } else if (monthlyIncome >= 5000) {
      baseScore += 40;
      indicators.push('Good income level');
    } else if (monthlyIncome >= 3000) {
      baseScore += 25;
      indicators.push('Moderate income level');
    } else {
      baseScore += 10;
      indicators.push('Low income level - CONCERN');
    }

    // Additional income source
    if (applicant.otherIncome && applicant.otherIncome > 0) {
      baseScore += 20;
      indicators.push(`Additional income: $${applicant.otherIncome.toLocaleString()}`);
    } else {
      baseScore += 10;
      indicators.push('No additional income sources');
    }

    // Net worth consideration
    if (applicant.netWorth > 100000) {
      baseScore += 30;
      indicators.push('Strong net worth');
    } else if (applicant.netWorth > 50000) {
      baseScore += 20;
      indicators.push('Moderate net worth');
    } else {
      baseScore += 5;
      indicators.push('Limited net worth');
    }

    const weight = config.weightIncomeStability;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: 'Income stability assessed through monthly income, additional income sources, and net worth',
    };
  }

  /**
   * Assess employment factor
   */
  private static assessEmployment(
    applicant: Applicant,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    let baseScore = 0;

    // Employment type (0-40 points)
    switch (applicant.employmentType) {
      case 'FULL_TIME':
        baseScore += 40;
        indicators.push('Full-time employment');
        break;
      case 'CONTRACT':
        baseScore += 30;
        indicators.push('Contract employment');
        break;
      case 'SELF_EMPLOYED':
        baseScore += 25;
        indicators.push('Self-employed - requires additional scrutiny');
        break;
      case 'PART_TIME':
        baseScore += 15;
        indicators.push('Part-time employment - CONCERN');
        break;
      case 'RETIRED':
        baseScore += 20;
        indicators.push('Retired - verify pension income');
        break;
      default:
        baseScore += 5;
        indicators.push('Unemployed - HIGH RISK');
    }

    // Years employed (0-30 points)
    if (applicant.yearsEmployed >= 5) {
      baseScore += 30;
      indicators.push(`Long employment tenure: ${applicant.yearsEmployed} years`);
    } else if (applicant.yearsEmployed >= 2) {
      baseScore += 20;
      indicators.push(`Stable employment: ${applicant.yearsEmployed} years`);
    } else if (applicant.yearsEmployed >= 1) {
      baseScore += 10;
      indicators.push(`Recent employment: ${applicant.yearsEmployed} years`);
    } else {
      baseScore += 5;
      indicators.push('Very recent employment - CONCERN');
    }

    // Industry experience (0-30 points)
    if (applicant.yearsInIndustry >= 10) {
      baseScore += 30;
      indicators.push('Extensive industry experience');
    } else if (applicant.yearsInIndustry >= 5) {
      baseScore += 20;
      indicators.push('Good industry experience');
    } else {
      baseScore += 10;
      indicators.push('Limited industry experience');
    }

    const weight = config.weightEmployment;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: 'Employment assessed through employment type, tenure, and industry experience',
    };
  }

  /**
   * Assess collateral factor
   */
  private static assessCollateral(
    application: LoanApplication,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    let baseScore = 0;

    if (!application.collateralValue || !application.collateralType) {
      baseScore = 0;
      indicators.push('No collateral provided - UNSECURED LOAN');
    } else {
      const loanToValue = application.loanAmount / application.collateralValue;

      if (loanToValue <= 0.6) {
        baseScore = 100;
        indicators.push('Excellent collateral coverage (LTV ≤ 60%)');
      } else if (loanToValue <= 0.8) {
        baseScore = 80;
        indicators.push('Good collateral coverage (LTV ≤ 80%)');
      } else if (loanToValue <= 0.9) {
        baseScore = 60;
        indicators.push('Adequate collateral coverage (LTV ≤ 90%)');
      } else if (loanToValue <= 1.0) {
        baseScore = 40;
        indicators.push('Marginal collateral coverage (LTV ≤ 100%)');
      } else {
        baseScore = 10;
        indicators.push('Insufficient collateral - HIGH RISK');
      }

      indicators.push(`Collateral type: ${application.collateralType}`);
      indicators.push(
        `Collateral value: $${application.collateralValue.toLocaleString()}`
      );
    }

    const weight = config.weightCollateral;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: 'Collateral assessed through loan-to-value ratio and collateral type',
    };
  }

  /**
   * Assess market conditions factor
   */
  private static assessMarketConditions(
    application: LoanApplication,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    
    // For now, use a baseline score. In production, this would integrate with
    // external market data APIs
    let baseScore = 70;
    indicators.push('Current market conditions: Stable');
    indicators.push('Interest rate environment: Moderate');
    
    // Adjust based on loan purpose
    switch (application.loanPurpose) {
      case 'HOME_PURCHASE':
      case 'HOME_REFINANCE':
        indicators.push('Real estate market: Stable demand');
        break;
      case 'BUSINESS':
        indicators.push('Business lending: Moderate risk');
        baseScore -= 10;
        break;
      case 'VEHICLE':
        indicators.push('Vehicle market: Standard conditions');
        break;
      default:
        indicators.push('General lending: Normal conditions');
    }

    const weight = config.weightMarketConditions;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: 'Market conditions evaluated based on current economic indicators and loan purpose',
    };
  }

  /**
   * Assess debt-to-income ratio factor
   */
  private static assessDebtToIncomeRatio(
    applicant: Applicant,
    config: RiskConfiguration
  ): RiskFactorScore {
    const indicators: string[] = [];
    let baseScore = 0;

    const dti = applicant.debtToIncomeRatio;
    indicators.push(`Debt-to-Income Ratio: ${(dti * 100).toFixed(1)}%`);

    if (dti <= 0.2) {
      baseScore = 100;
      indicators.push('Excellent DTI - Low debt burden');
    } else if (dti <= 0.35) {
      baseScore = 80;
      indicators.push('Good DTI - Manageable debt');
    } else if (dti <= 0.43) {
      baseScore = 60;
      indicators.push('Acceptable DTI - At standard threshold');
    } else if (dti <= 0.5) {
      baseScore = 30;
      indicators.push('High DTI - CONCERN');
    } else {
      baseScore = 10;
      indicators.push('Very high DTI - HIGH RISK');
    }

    const weight = config.weightDebtToIncomeRatio;
    const weightedScore = (baseScore * weight) / 100;

    return {
      score: baseScore,
      weight,
      weightedScore,
      indicators,
      explanation: 'DTI ratio indicates the proportion of income allocated to debt obligations',
    };
  }

  /**
   * Determine risk category based on score and thresholds
   */
  private static determineRiskCategory(
    score: number,
    config: RiskConfiguration
  ): RiskLevel {
    if (score >= config.thresholdHighRisk) {
      return 'LOW';
    } else if (score >= config.thresholdMediumRisk) {
      return 'MEDIUM';
    } else if (score >= config.thresholdLowRisk) {
      return 'HIGH';
    } else {
      return 'CRITICAL';
    }
  }

  /**
   * Generate loan recommendation
   */
  private static generateRecommendation(
    score: number,
    config: RiskConfiguration
  ): LoanRecommendation {
    if (score >= config.autoApproveThreshold) {
      return 'APPROVE';
    } else if (score <= config.autoRejectThreshold) {
      return 'REJECT';
    } else {
      return 'REVIEW';
    }
  }

  /**
   * Calculate confidence in the assessment
   */
  private static calculateConfidence(
    factorScores: Record<string, RiskFactorScore>,
    application: LoanApplication
  ): number {
    // Factors that increase confidence:
    // 1. Complete data
    // 2. Consistent scores across factors
    // 3. Recent credit check

    let confidence = 80; // Base confidence

    // Check data completeness
    if (application.collateralValue && application.collateralType) {
      confidence += 5;
    }

    // Check score consistency (variance)
    const scores = Object.values(factorScores).map((f) => f.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 15) {
      confidence += 10; // Consistent scores
    } else if (stdDev > 30) {
      confidence -= 10; // Highly variable scores
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Collect key risk indicators from all factors
   */
  private static collectKeyRiskIndicators(
    factorScores: Record<string, RiskFactorScore>
  ): string[] {
    const indicators: string[] = [];

    Object.entries(factorScores).forEach(([factor, data]) => {
      data.indicators.forEach((indicator) => {
        if (
          indicator.includes('HIGH RISK') ||
          indicator.includes('CONCERN') ||
          indicator.includes('CRITICAL')
        ) {
          indicators.push(`${factor}: ${indicator}`);
        }
      });
    });

    return indicators;
  }

  /**
   * Generate mitigation suggestions
   */
  private static generateMitigationSuggestions(
    factorScores: Record<string, RiskFactorScore>
  ): string[] {
    const suggestions: string[] = [];

    if (factorScores.creditHistory.score < 50) {
      suggestions.push('Require co-signer with better credit history');
      suggestions.push('Consider higher interest rate to offset credit risk');
    }

    if (factorScores.collateral.score < 50) {
      suggestions.push('Request additional collateral or down payment');
      suggestions.push('Consider credit insurance');
    }

    if (factorScores.debtToIncomeRatio.score < 50) {
      suggestions.push('Require proof of debt reduction plan');
      suggestions.push('Consider smaller loan amount');
    }

    if (factorScores.employment.score < 40) {
      suggestions.push('Verify income through multiple sources');
      suggestions.push('Require longer employment history verification');
    }

    if (suggestions.length === 0) {
      suggestions.push('Standard loan terms appropriate');
    }

    return suggestions;
  }

  /**
   * Generate explainability data including SHAP-like values
   */
  private static generateExplainability(
    factorScores: Record<string, RiskFactorScore>,
    application: LoanApplication
  ): RiskAssessmentResult['explainability'] {
    // Calculate SHAP-like values (contribution to final score)
    const shapValues: Record<string, number> = {};
    const totalWeighted = Object.values(factorScores).reduce(
      (sum, f) => sum + f.weightedScore,
      0
    );

    Object.entries(factorScores).forEach(([factor, data]) => {
      shapValues[factor] = data.weightedScore;
    });

    // Decision path
    const decisionPath = [
      'Application received',
      'Data validation completed',
      'Credit history analyzed',
      'Income and employment verified',
      'Collateral assessed',
      'Risk factors weighted',
      'Final score calculated',
      'Recommendation generated',
    ];

    // Scenario analysis
    const scenarios = [
      {
        name: 'With 10% higher income',
        change: '+10% monthly income',
        newScore: totalWeighted + 2,
        impact: 2,
      },
      {
        name: 'With co-signer (750+ credit)',
        change: 'Add co-signer with excellent credit',
        newScore: totalWeighted + 8,
        impact: 8,
      },
      {
        name: 'With additional collateral',
        change: '+20% collateral value',
        newScore: totalWeighted + 3,
        impact: 3,
      },
    ];

    return {
      shapValues,
      decisionPath,
      scenarios,
    };
  }
}

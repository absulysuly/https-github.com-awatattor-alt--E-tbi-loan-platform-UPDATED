import apiClient from '../../lib/api-client';
import type {
  RiskAssessment,
  CreateAssessmentRequest,
  CalculateRiskRequest,
  RiskCalculationResult,
  AssessmentFilters,
  PaginatedResponse,
  ApiResponse,
} from '../../types/api';

export const assessmentsService = {
  /**
   * Get all risk assessments with filters
   */
  async getAssessments(filters?: AssessmentFilters): Promise<PaginatedResponse<RiskAssessment>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<PaginatedResponse<RiskAssessment>>(
      `/assessments?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * Get single assessment by ID
   */
  async getAssessmentById(id: string): Promise<RiskAssessment> {
    const response = await apiClient.get<ApiResponse<{ assessment: RiskAssessment }>>(
      `/assessments/${id}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.assessment;
    }
    
    throw new Error('Failed to fetch assessment');
  },

  /**
   * Create new risk assessment for an application
   */
  async createAssessment(data: CreateAssessmentRequest): Promise<RiskAssessment> {
    const response = await apiClient.post<ApiResponse<{ assessment: RiskAssessment }>>(
      '/assessments',
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.assessment;
    }
    
    throw new Error(response.data.message || 'Failed to create assessment');
  },

  /**
   * Calculate risk score without creating assessment
   */
  async calculateRisk(data: CalculateRiskRequest): Promise<RiskCalculationResult> {
    const response = await apiClient.post<ApiResponse<RiskCalculationResult>>(
      '/assessments/calculate',
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to calculate risk');
  },

  /**
   * Get explainability data for an assessment
   */
  async getExplainability(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<{ explainability: any }>>(
      `/assessments/${id}/explainability`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.explainability;
    }
    
    throw new Error('Failed to fetch explainability data');
  },

  /**
   * Generate alternative scenarios (what-if analysis)
   */
  async generateScenarios(id: string, modifications: Record<string, number>): Promise<any[]> {
    const response = await apiClient.post<ApiResponse<{ scenarios: any[] }>>(
      `/assessments/${id}/scenarios`,
      { modifications }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.scenarios;
    }
    
    throw new Error('Failed to generate scenarios');
  },

  /**
   * Override risk decision (Manager/Admin only)
   */
  async overrideRisk(
    id: string,
    newRiskCategory: string,
    reason: string
  ): Promise<RiskAssessment> {
    const response = await apiClient.post<ApiResponse<{ assessment: RiskAssessment }>>(
      `/assessments/${id}/override`,
      { newRiskCategory, reason }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.assessment;
    }
    
    throw new Error(response.data.message || 'Failed to override risk');
  },

  /**
   * Get assessments for a specific application
   */
  async getAssessmentsByApplication(applicationId: string): Promise<RiskAssessment[]> {
    const response = await apiClient.get<ApiResponse<{ assessments: RiskAssessment[] }>>(
      `/assessments/application/${applicationId}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.assessments;
    }
    
    throw new Error('Failed to fetch assessments for application');
  },
};

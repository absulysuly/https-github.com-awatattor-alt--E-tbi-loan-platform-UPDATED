import apiClient from '../../lib/api-client';
import type {
  LoanApplication,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationFilters,
  PaginatedResponse,
  ApiResponse,
} from '../../types/api';

export const applicationsService = {
  /**
   * Get all loan applications with filters
   */
  async getApplications(filters?: ApplicationFilters): Promise<PaginatedResponse<LoanApplication>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<PaginatedResponse<LoanApplication>>(
      `/applications?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * Get single application by ID
   */
  async getApplicationById(id: string): Promise<LoanApplication> {
    const response = await apiClient.get<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error('Failed to fetch application');
  },

  /**
   * Create new loan application
   */
  async createApplication(data: CreateApplicationRequest): Promise<LoanApplication> {
    const response = await apiClient.post<ApiResponse<{ application: LoanApplication }>>(
      '/applications',
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to create application');
  },

  /**
   * Update existing application
   */
  async updateApplication(id: string, data: UpdateApplicationRequest): Promise<LoanApplication> {
    const response = await apiClient.put<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}`,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to update application');
  },

  /**
   * Delete application
   */
  async deleteApplication(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/applications/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete application');
    }
  },

  /**
   * Submit application for review
   */
  async submitApplication(id: string, comments?: string): Promise<LoanApplication> {
    const response = await apiClient.post<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}/submit`,
      { comments }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to submit application');
  },

  /**
   * Review application (Underwriter)
   */
  async reviewApplication(
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED',
    comments?: string,
    conditions?: string[]
  ): Promise<LoanApplication> {
    const response = await apiClient.post<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}/review`,
      { decision, comments, conditions }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to review application');
  },

  /**
   * Approve application (Manager/Admin)
   */
  async approveApplication(id: string, comments?: string, conditions?: string[]): Promise<LoanApplication> {
    const response = await apiClient.post<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}/approve`,
      { comments, conditions }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to approve application');
  },

  /**
   * Reject application (Manager/Admin)
   */
  async rejectApplication(id: string, reason: string): Promise<LoanApplication> {
    const response = await apiClient.post<ApiResponse<{ application: LoanApplication }>>(
      `/applications/${id}/reject`,
      { reason }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.application;
    }
    
    throw new Error(response.data.message || 'Failed to reject application');
  },

  /**
   * Get application history
   */
  async getApplicationHistory(id: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<{ history: any[] }>>(
      `/applications/${id}/history`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.history;
    }
    
    throw new Error('Failed to fetch application history');
  },
};

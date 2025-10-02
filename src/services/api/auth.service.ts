import apiClient, { setAuthToken, removeAuthToken, setUser, removeUser } from '../../lib/api-client';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ApiResponse,
  AuthTokens,
  User,
} from '../../types/api';

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthTokens> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      setAuthToken(token);
      setUser(user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      removeAuthToken();
      removeUser();
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      const user = response.data.data.user;
      setUser(user);
      return user;
    }
    
    throw new Error('Failed to fetch user profile');
  },

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    
    if (response.data.success && response.data.data) {
      const { token } = response.data.data;
      setAuthToken(token);
      return token;
    }
    
    throw new Error('Failed to refresh token');
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  },
};

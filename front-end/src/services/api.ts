import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import type { ApiResponse, User, UserProfile, Submission, SubmissionResponse, SubmissionForm, GuideWithExercises } from '@/types';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Request interceptor para agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const url = config.url ?? '';
        const isAuthLogin = url.includes(API_ENDPOINTS.auth.login);

        if (!isAuthLogin) {
          config.headers = config.headers ?? {};
          const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

          if (authToken) {
            config.headers['X-Auth-Token'] = authToken;
          }

          if (refreshToken) {
            config.headers['X-Refresh-Token'] = refreshToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para manejar errores globalmente
    this.api.interceptors.response.use(
      (response) => {
        const newAuthToken = response.headers['x-auth-token'];
        const newRefreshToken = response.headers['x-refresh-token'];

        if (newAuthToken && newRefreshToken) {
          this.setAuthTokens(newAuthToken, newRefreshToken);
        }

        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.api.get(API_ENDPOINTS.health);
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get(API_ENDPOINTS.users.me);
    return response.data;
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await this.api.get(API_ENDPOINTS.users.profile);
    return response.data;
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.api.get(API_ENDPOINTS.users.all);
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await this.api.get(API_ENDPOINTS.users.byId(id));
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.api.delete(API_ENDPOINTS.users.delete(id));
    return response.data;
  }

  // Submission endpoints
  async submitSolution(formData: SubmissionForm): Promise<ApiResponse<SubmissionResponse>> {
    const response = await this.api.post(API_ENDPOINTS.submissions.submit, formData);
    return response.data;
  }

  async getMySubmissions(): Promise<ApiResponse<Submission[]>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.my);
    return response.data;
  }

  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.byId(id));
    return response.data;
  }

  async getSubmissionStatus(id: string): Promise<ApiResponse<SubmissionResponse>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.status(id));
    return response.data;
  }

  async getAvailableExercises(): Promise<ApiResponse<GuideWithExercises[]>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.availableExercises);
    return response.data;
  }

  // Utility method to set auth tokens
  setAuthTokens(authToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Utility method to clear auth tokens
  clearAuthTokens(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export const apiService = new ApiService();
export default apiService;

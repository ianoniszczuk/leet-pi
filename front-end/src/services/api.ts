import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import type { ApiResponse, User, UserProfile, Submission, SubmissionResponse, SubmissionForm } from '@/types';

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
        const token = localStorage.getItem('auth0_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para manejar errores globalmente
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('auth0_token');
          window.location.href = '/login';
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

  // Utility method to set auth token
  setAuthToken(token: string): void {
    localStorage.setItem('auth0_token', token);
  }

  // Utility method to clear auth token
  clearAuthToken(): void {
    localStorage.removeItem('auth0_token');
  }
}

export const apiService = new ApiService();
export default apiService;

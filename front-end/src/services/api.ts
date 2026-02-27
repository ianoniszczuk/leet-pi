import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import { cacheService } from './cacheService';
import { CACHE_KEYS } from '@/config/cache';
import type { ApiResponse, User, UserProfile, Submission, SubmissionResponse, SubmissionForm, GuideWithExercises, UserStatus, CSVUploadResult, AdminGuide, ExerciseRankingsData, AdminUser, UserDetailData, PaginatedAdminUsersResponse } from '@/types';

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
          // No redirigir automáticamente, dejar que el componente maneje el error
          console.warn('Authentication token expired or invalid');
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

  async updateProfile(data: { firstName: string; lastName: string }): Promise<ApiResponse<UserProfile>> {
    const response = await this.api.patch(API_ENDPOINTS.users.updateMe, data);
    return response.data;
  }

  // Submission endpoints
  async submitSolution(formData: SubmissionForm): Promise<ApiResponse<SubmissionResponse>> {
    const response = await this.api.post(API_ENDPOINTS.submissions.submit, formData);

    // Invalidar caché relacionado después de submit exitoso
    if (response.data.success) {
      this.invalidateUserCache();
    }

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

  async getExerciseRankings(guideNumber: number, exerciseNumber: number): Promise<ApiResponse<ExerciseRankingsData>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.rankings(guideNumber, exerciseNumber));
    console.log(response.data);
    return response.data;
  }

  async getAvailableExercises(): Promise<ApiResponse<GuideWithExercises[]>> {
    const response = await this.api.get(API_ENDPOINTS.submissions.availableExercises);
    return response.data;
  }

  async getAvailableExercisesConditional(
    etag?: string | null
  ): Promise<
    | { notModified: true }
    | { notModified: false; data: GuideWithExercises[]; etag: string | null }
  > {
    const headers: Record<string, string> = {};
    if (etag) headers['If-None-Match'] = etag;

    const response = await this.api.get(
      API_ENDPOINTS.submissions.availableExercises,
      {
        headers,
        validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
      }
    );

    if (response.status === 304) return { notModified: true };

    return {
      notModified: false,
      data: response.data.data as GuideWithExercises[],
      etag: (response.headers['etag'] as string | undefined) ?? null,
    };
  }

  // Admin endpoints
  async uploadCSV(file: File): Promise<ApiResponse<CSVUploadResult>> {
    const formData = new FormData();
    formData.append('csv', file);

    const response = await this.api.post(API_ENDPOINTS.admin.uploadCSV, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getUserStatus(): Promise<ApiResponse<UserStatus>> {
    const response = await this.api.get(API_ENDPOINTS.admin.userStatus);
    return response.data;
  }

  async getAdminUsers(params?: { search?: string; page?: number; limit?: number; role?: string; enabled?: boolean }): Promise<ApiResponse<PaginatedAdminUsersResponse>> {
    const response = await this.api.get(API_ENDPOINTS.admin.users, { params });
    return response.data;
  }

  async updateUserEnabled(userId: string, enabled: boolean): Promise<ApiResponse<AdminUser>> {
    const response = await this.api.patch(API_ENDPOINTS.admin.userEnabled(userId), { enabled });
    return response.data;
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<ApiResponse<{ userId: string; roles: string[] }>> {
    const response = await this.api.put(API_ENDPOINTS.admin.userRoles(userId), { roles });
    return response.data;
  }

  async getAdminUserDetails(userId: string): Promise<ApiResponse<UserDetailData>> {
    const response = await this.api.get(API_ENDPOINTS.admin.userDetails(userId));
    return response.data;
  }

  // Admin guide/exercise endpoints
  async getAdminGuides(): Promise<ApiResponse<AdminGuide[]>> {
    const response = await this.api.get(API_ENDPOINTS.admin.guide());
    return response.data;
  }

  async createGuide(data: { guideNumber: number; enabled?: boolean; deadline?: string | null }): Promise<ApiResponse<AdminGuide>> {
    const response = await this.api.post(API_ENDPOINTS.admin.guide(), data);
    return response.data;
  }

  async updateGuide(n: number, data: { enabled?: boolean; deadline?: string | null }): Promise<ApiResponse<AdminGuide>> {
    const response = await this.api.patch(API_ENDPOINTS.admin.guide(n), data);
    return response.data;
  }

  async deleteGuide(n: number): Promise<ApiResponse> {
    const response = await this.api.delete(API_ENDPOINTS.admin.guide(n));
    return response.data;
  }

  async createExercise(g: number, data: { exerciseNumber: number; enabled?: boolean }): Promise<ApiResponse> {
    const response = await this.api.post(API_ENDPOINTS.admin.exercise(g), data);
    return response.data;
  }

  async updateExercise(g: number, e: number, data: { enabled: boolean }): Promise<ApiResponse> {
    const response = await this.api.patch(API_ENDPOINTS.admin.exercise(g, e), data);
    return response.data;
  }

  async deleteExercise(g: number, e: number): Promise<ApiResponse> {
    const response = await this.api.delete(API_ENDPOINTS.admin.exercise(g, e));
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

  // Cache management methods
  invalidateUserCache(): void {
    // Invalidar caché de submissions y profile después de submit
    cacheService.invalidate(CACHE_KEYS.mySubmissions());
    cacheService.invalidate(CACHE_KEYS.userProfile());
  }

  invalidateAllCache(): void {
    cacheService.invalidateAll();
  }

  invalidateCacheByKey(key: string): void {
    cacheService.invalidate(key);
  }
}

export const apiService = new ApiService();
export default apiService;

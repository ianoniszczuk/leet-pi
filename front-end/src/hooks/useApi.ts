import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import type { ApiResponse, GuideWithExercises } from '@/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  execute: (...args: any[]) => Promise<T>;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response.data;
      } else {
        const errorMessage = response.error?.message || 'Error desconocido';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error de conexión';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [apiCall]);

  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  useEffect(() => {
    execute();
  }, dependencies);

  return {
    ...state,
    refetch,
    execute,
  };
}

// Hook específico para submissions
export function useSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSolution = async (formData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.submitSolution(formData);
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMessage = response.error?.message || 'Error al enviar solución';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let errorMessage = 'Error de conexión';
      
      if (error.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        // Limpiar tokens y redirigir al login
        apiService.clearAuthTokens();
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitSolution,
    loading,
    error,
  };
}

// Hook específico para obtener ejercicios disponibles
export function useAvailableExercises() {
  return useApi<GuideWithExercises[]>(
    () => apiService.getAvailableExercises(),
    []
  );
}

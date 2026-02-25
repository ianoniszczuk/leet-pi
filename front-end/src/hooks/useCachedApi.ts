import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { apiService } from '@/services/api';
import { CACHE_KEYS, CACHE_CONFIG } from '@/config/cache';
import type { ApiResponse } from '@/types';

interface UseCachedApiOptions {
  cacheKey: string;
  ttl: number;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseCachedApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseCachedApiReturn<T> extends UseCachedApiState<T> {
  refetch: () => Promise<void>;
  invalidateCache: () => void;
}

/**
 * Hook que integra caché con llamadas API
 * 
 * Flujo:
 * 1. Intenta cargar desde caché primero
 * 2. Si hay datos válidos en caché, los devuelve inmediatamente
 * 3. Si no hay caché o está expirado, hace la llamada API
 * 4. Guarda la respuesta en caché automáticamente
 * 5. Permite forzar refresh con refetch()
 */
export function useCachedApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseCachedApiOptions
): UseCachedApiReturn<T> {
  const { cacheKey, ttl, enabled = true, onSuccess, onError } = options;

  // Limpiar caché corrupto al inicio (temporal para debugging)
  useEffect(() => {
    const cached = cacheService.get<T>(cacheKey);
    if (cached === null) {
      console.log(`[useCachedApi] Cache cleared or empty for key: ${cacheKey}`);
    }
  }, [cacheKey]);

  const [state, setState] = useState<UseCachedApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Usar useRef para mantener una referencia estable a apiCall
  const apiCallRef = useRef(apiCall);
  apiCallRef.current = apiCall;

  // Flag para evitar múltiples llamadas simultáneas
  const isExecutingRef = useRef(false);

  const execute = useCallback(async (): Promise<T | null> => {
    if (!enabled || isExecutingRef.current) {
      return null;
    }

    isExecutingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCallRef.current();
      
      if (response.success && response.data) {
        // Guardar en caché solo si no es un array vacío
        const isEmpty = Array.isArray(response.data) && response.data.length === 0;
        if (!isEmpty) {
          cacheService.set(cacheKey, response.data, ttl);
        }
        
        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        // Callback de éxito
        if (onSuccess) {
          onSuccess(response.data);
        }

        return response.data;
      } else {
        const errorMessage = response.error?.message || 'Error desconocido';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (onError) {
          onError(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error de conexión';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      if (onError) {
        onError(errorMessage);
      }

      throw error;
    } finally {
      isExecutingRef.current = false;
    }
  }, [cacheKey, ttl, enabled, onSuccess, onError]); // Removido apiCall de las dependencias

  const refetch = useCallback(async () => {
    // Invalidar caché antes de hacer nueva llamada
    cacheService.invalidate(cacheKey);
    await execute();
  }, [execute, cacheKey]);

  const invalidateCache = useCallback(() => {
    cacheService.invalidate(cacheKey);
  }, [cacheKey]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log(`[useCachedApi] Checking cache for key: ${cacheKey}`);

    // Intentar cargar desde caché primero
    const cachedData = cacheService.get<T>(cacheKey);
    
    if (cachedData) {
      console.log(`[useCachedApi] Found cached data for key: ${cacheKey}`);
      // Hay datos válidos en caché, usarlos inmediatamente
      setState({
        data: cachedData,
        loading: false,
        error: null,
      });

      if (onSuccess) {
        onSuccess(cachedData);
      }
    } else {
      console.log(`[useCachedApi] No cached data, making API call for key: ${cacheKey}`);
      // No hay caché válido, hacer llamada API
      execute();
    }
  }, [cacheKey, enabled]); // Removido execute y onSuccess de las dependencias

  return {
    ...state,
    refetch,
    invalidateCache,
  };
}

/**
 * Hook específico para obtener ejercicios disponibles con caché
 */
export function useCachedAvailableExercises() {
  return useCachedApi(
    () => apiService.getAvailableExercises(),
    {
      cacheKey: CACHE_KEYS.availableExercises,
      ttl: CACHE_CONFIG.availableExercises,
    }
  );
}

/**
 * Hook específico para obtener perfil de usuario con caché
 */
export function useCachedUserProfile(userId?: string) {
  return useCachedApi(
    () => apiService.getUserProfile(),
    {
      cacheKey: CACHE_KEYS.userProfile(userId),
      ttl: CACHE_CONFIG.userProfile,
    }
  );
}

/**
 * Hook específico para obtener submissions del usuario con caché
 */
export function useCachedMySubmissions(userId?: string) {
  return useCachedApi(
    () => apiService.getMySubmissions(),
    {
      cacheKey: CACHE_KEYS.mySubmissions(userId),
      ttl: CACHE_CONFIG.mySubmissions,
    }
  );
}

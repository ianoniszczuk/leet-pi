// Configuración de TTL (Time To Live) para diferentes tipos de datos
export const CACHE_CONFIG = {
  // Available Exercises - Cambian poco frecuentemente
  availableExercises: 2 * 60 * 1000,   // 2 minutos (ETag refresh on expiry)

  // User Profile - Cambia ocasionalmente (estadísticas)
  userProfile: 10 * 60 * 1000,         // 10 minutos

  // User Submissions - Se actualiza frecuentemente
  mySubmissions: 2 * 60 * 1000,        // 2 minutos

  // Admin Metrics - Aggregaciones costosas; no necesitan tiempo real
  metrics: 5 * 60 * 1000,              // 5 minutos
} as const;

// Claves para identificar diferentes tipos de caché
export const CACHE_KEYS = {
  availableExercises: 'exercises:available',

  userProfile: (userId?: string) => `user:profile:${userId || 'me'}`,

  mySubmissions: (userId?: string) => `submissions:${userId || 'me'}`,

  // Metrics
  metricsProgress: 'metrics:progress',
  metricsResolutionTime: 'metrics:resolution-time',
  metricsAttempts: 'metrics:attempts',
  metricsActiveStudents: 'metrics:active-students',
  metricsErrorRate: 'metrics:error-rate',
  metricsAtRisk: 'metrics:at-risk',
  metricsProgressDistribution: 'metrics:progress-distribution',
  metricsWeeklyActivity: 'metrics:weekly-activity',
  metricsCompletionMatrix: 'metrics:completion-matrix',
} as const;

// Tipos para TypeScript
export type CacheConfigKey = keyof typeof CACHE_CONFIG;
export type CacheKeysKey = keyof typeof CACHE_KEYS;

// Utilidades para trabajar con caché
export const CacheUtils = {
  /**
   * Obtiene el TTL para un tipo de caché específico
   */
  getTTL(key: CacheConfigKey): number {
    return CACHE_CONFIG[key];
  },

  /**
   * Genera la clave de caché para un endpoint específico
   */
  getCacheKey(key: CacheKeysKey, ...params: any[]): string {
    const keyGenerator = CACHE_KEYS[key];

    if (typeof keyGenerator === 'function') {
      return keyGenerator(...params);
    }

    return keyGenerator;
  },

  /**
   * Verifica si una clave de caché es válida
   */
  isValidCacheKey(key: string): boolean {
    return Object.values(CACHE_KEYS).some(keyGenerator => {
      if (typeof keyGenerator === 'function') {
        // Para funciones, verificamos si la clave coincide con algún patrón
        return key.includes(keyGenerator().split(':')[0]);
      }
      return key === keyGenerator;
    });
  },
};

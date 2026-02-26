interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

class CacheService {
  private readonly CACHE_PREFIX = 'cache:';

  /**
   * Obtiene datos del caché si están disponibles y no han expirado
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`[CacheService] No cached data found for key: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Verificar si ha expirado
      if (this.isEntryExpired(entry)) {
        console.log(`[CacheService] Cache expired for key: ${key}`);
        this.invalidate(key);
        return null;
      }

      console.log(`[CacheService] Found valid cached data for key: ${key}`);
      return entry.data;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      this.invalidate(key);
      return null;
    }
  }

  /**
   * Guarda datos en el caché con TTL específico
   */
  set<T>(key: string, data: T, ttl: number, etag?: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        ...(etag !== undefined ? { etag } : {}),
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`[CacheService] Saved to cache: ${key}, expires in ${ttl}ms`);
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }

  getEtag(key: string): string | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      const entry: CacheEntry = JSON.parse(cached);
      return entry.etag ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Invalida un elemento específico del caché
   */
  invalidate(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Error invalidating cache:', error);
    }
  }

  /**
   * Invalida todo el caché (limpia todos los elementos con prefijo cache:)
   */
  invalidateAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing all cache:', error);
    }
  }

  /**
   * Verifica si un elemento del caché ha expirado
   */
  isExpired(key: string): boolean {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return true;
      }

      const entry: CacheEntry = JSON.parse(cached);
      return this.isEntryExpired(entry);
    } catch (error) {
      console.warn('Error checking cache expiration:', error);
      return true;
    }
  }

  /**
   * Limpia todos los elementos expirados del caché
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const entry: CacheEntry = JSON.parse(cached);
              if (this.isEntryExpired(entry)) {
                localStorage.removeItem(key);
              }
            } catch (error) {
              // Si hay error parseando, eliminar el elemento corrupto
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Error during cache cleanup:', error);
    }
  }

  /**
   * Obtiene información del caché (para debugging)
   */
  getCacheInfo(): { key: string; size: number; expiresAt: number }[] {
    const info: { key: string; size: number; expiresAt: number }[] = [];
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              const entry: CacheEntry = JSON.parse(cached);
              info.push({
                key: key.replace(this.CACHE_PREFIX, ''),
                size: cached.length,
                expiresAt: entry.timestamp + entry.ttl,
              });
            } catch (error) {
              // Ignorar elementos corruptos
            }
          }
        }
      });
    } catch (error) {
      console.warn('Error getting cache info:', error);
    }

    return info;
  }

  /**
   * Genera la clave completa para localStorage
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Verifica si una entrada específica ha expirado
   */
  private isEntryExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }
}

// Exportar instancia singleton
export const cacheService = new CacheService();
export default cacheService;

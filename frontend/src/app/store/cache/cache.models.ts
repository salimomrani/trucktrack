/**
 * Cache status representing the current state of cached data
 */
export type CacheStatus = 'idle' | 'loading' | 'fresh' | 'stale' | 'error';

/**
 * Cache metadata for tracking data freshness
 */
export interface CacheMetadata {
  lastUpdated: number;      // Unix timestamp (ms)
  status: CacheStatus;
  error?: string;
}

/**
 * Cache state for a specific entity type
 */
export interface EntityCacheState {
  trucks: CacheMetadata;
  drivers: CacheMetadata;
  groups: CacheMetadata;
  stats: CacheMetadata;
}

/**
 * Initial cache metadata
 */
export const initialCacheMetadata: CacheMetadata = {
  lastUpdated: 0,
  status: 'idle'
};

/**
 * Check if cache is stale based on TTL
 */
export function isCacheStale(cache: CacheMetadata, ttlMs: number): boolean {
  if (cache.status === 'idle' || cache.status === 'error') {
    return true;
  }
  const now = Date.now();
  return now - cache.lastUpdated > ttlMs;
}

/**
 * Check if cache needs refresh (stale or idle)
 */
export function shouldRefreshCache(cache: CacheMetadata, ttlMs: number): boolean {
  if (cache.status === 'loading') {
    return false; // Don't trigger another load while loading
  }
  return isCacheStale(cache, ttlMs);
}

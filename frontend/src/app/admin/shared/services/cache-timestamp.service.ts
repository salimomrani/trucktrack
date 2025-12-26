import { Injectable } from '@angular/core';
import { CacheMetadata } from '../../../store/cache/cache.models';
import { CACHE_TTL, CacheEntityType } from '../../../store/cache/cache.constants';

/**
 * Service for managing cache timestamps and freshness checks.
 * Used to implement the stale-while-revalidate pattern.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheTimestampService {

  /**
   * Check if cached data is stale (past TTL)
   * @param cache The cache metadata to check
   * @param entityType The type of entity to get the correct TTL
   * @returns true if cache is stale or has never been loaded
   */
  isStale(cache: CacheMetadata, entityType: CacheEntityType): boolean {
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }

    const ttl = CACHE_TTL[entityType];
    const now = Date.now();
    return now - cache.lastUpdated > ttl;
  }

  /**
   * Check if cache should be refreshed (stale and not currently loading)
   * @param cache The cache metadata to check
   * @param entityType The type of entity to get the correct TTL
   * @returns true if a refresh should be triggered
   */
  shouldRefresh(cache: CacheMetadata, entityType: CacheEntityType): boolean {
    // Don't trigger another load while already loading
    if (cache.status === 'loading') {
      return false;
    }

    return this.isStale(cache, entityType);
  }

  /**
   * Check if cache is fresh and can be used without refresh
   * @param cache The cache metadata to check
   * @param entityType The type of entity to get the correct TTL
   * @returns true if cache is fresh
   */
  isFresh(cache: CacheMetadata, entityType: CacheEntityType): boolean {
    if (cache.status !== 'fresh') {
      return false;
    }

    const ttl = CACHE_TTL[entityType];
    const now = Date.now();
    return now - cache.lastUpdated <= ttl;
  }

  /**
   * Get time remaining until cache expires
   * @param cache The cache metadata
   * @param entityType The type of entity
   * @returns Milliseconds until expiry, 0 if already expired
   */
  getTimeUntilExpiry(cache: CacheMetadata, entityType: CacheEntityType): number {
    if (cache.lastUpdated === 0) {
      return 0;
    }

    const ttl = CACHE_TTL[entityType];
    const expiresAt = cache.lastUpdated + ttl;
    const remaining = expiresAt - Date.now();

    return Math.max(0, remaining);
  }

  /**
   * Get human-readable time since last update
   * @param cache The cache metadata
   * @returns Human-readable string like "2 minutes ago"
   */
  getTimeSinceUpdate(cache: CacheMetadata): string {
    if (cache.lastUpdated === 0) {
      return 'Never';
    }

    const seconds = Math.floor((Date.now() - cache.lastUpdated) / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}

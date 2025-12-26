import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EntityCacheState, CacheMetadata } from './cache.models';
import { CACHE_TTL } from './cache.constants';

/**
 * Feature selector for cache state
 */
export const selectCacheState = createFeatureSelector<EntityCacheState>('cache');

/**
 * Select trucks cache metadata
 */
export const selectTrucksCacheState = createSelector(
  selectCacheState,
  (state): CacheMetadata => state.trucks
);

/**
 * Select drivers cache metadata
 */
export const selectDriversCacheState = createSelector(
  selectCacheState,
  (state): CacheMetadata => state.drivers
);

/**
 * Select groups cache metadata
 */
export const selectGroupsCacheState = createSelector(
  selectCacheState,
  (state): CacheMetadata => state.groups
);

/**
 * Select stats cache metadata
 */
export const selectStatsCacheState = createSelector(
  selectCacheState,
  (state): CacheMetadata => state.stats
);

/**
 * Check if trucks cache is stale
 */
export const selectIsTrucksCacheStale = createSelector(
  selectTrucksCacheState,
  (cache): boolean => {
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.TRUCKS;
  }
);

/**
 * Check if trucks cache needs refresh (stale and not loading)
 */
export const selectShouldRefreshTrucks = createSelector(
  selectTrucksCacheState,
  (cache): boolean => {
    if (cache.status === 'loading') {
      return false;
    }
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.TRUCKS;
  }
);

/**
 * Check if drivers cache is stale
 */
export const selectIsDriversCacheStale = createSelector(
  selectDriversCacheState,
  (cache): boolean => {
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.DRIVERS;
  }
);

/**
 * Check if drivers cache needs refresh
 */
export const selectShouldRefreshDrivers = createSelector(
  selectDriversCacheState,
  (cache): boolean => {
    if (cache.status === 'loading') {
      return false;
    }
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.DRIVERS;
  }
);

/**
 * Check if groups cache is stale
 */
export const selectIsGroupsCacheStale = createSelector(
  selectGroupsCacheState,
  (cache): boolean => {
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.GROUPS;
  }
);

/**
 * Check if groups cache needs refresh
 */
export const selectShouldRefreshGroups = createSelector(
  selectGroupsCacheState,
  (cache): boolean => {
    if (cache.status === 'loading') {
      return false;
    }
    if (cache.status === 'idle' || cache.status === 'error') {
      return true;
    }
    return Date.now() - cache.lastUpdated > CACHE_TTL.GROUPS;
  }
);

/**
 * Check if any cache is currently loading
 */
export const selectIsAnyCacheLoading = createSelector(
  selectCacheState,
  (state): boolean => {
    return (
      state.trucks.status === 'loading' ||
      state.drivers.status === 'loading' ||
      state.groups.status === 'loading' ||
      state.stats.status === 'loading'
    );
  }
);

/**
 * Check if all primary caches are fresh
 */
export const selectAllCachesFresh = createSelector(
  selectCacheState,
  (state): boolean => {
    const now = Date.now();
    return (
      state.trucks.status === 'fresh' &&
      now - state.trucks.lastUpdated <= CACHE_TTL.TRUCKS &&
      state.drivers.status === 'fresh' &&
      now - state.drivers.lastUpdated <= CACHE_TTL.DRIVERS &&
      state.groups.status === 'fresh' &&
      now - state.groups.lastUpdated <= CACHE_TTL.GROUPS
    );
  }
);

// ============================================
// T038: Dashboard Stats Selectors for US4
// ============================================

/**
 * T038: Select dashboard cache summary.
 * Provides cache state information for the dashboard.
 */
export const selectDashboardCacheStats = createSelector(
  selectCacheState,
  (state) => ({
    trucksStatus: state.trucks.status,
    trucksLastUpdated: state.trucks.lastUpdated,
    driversStatus: state.drivers.status,
    driversLastUpdated: state.drivers.lastUpdated,
    groupsStatus: state.groups.status,
    groupsLastUpdated: state.groups.lastUpdated,
    statsStatus: state.stats.status,
    statsLastUpdated: state.stats.lastUpdated
  })
);

/**
 * T038: Format cache age for display.
 * Returns human-readable "X minutes ago" text.
 */
export const selectTrucksCacheAge = createSelector(
  selectTrucksCacheState,
  (cache): string => {
    if (cache.lastUpdated === 0) return 'Never';
    const ageMs = Date.now() - cache.lastUpdated;
    const ageSecs = Math.floor(ageMs / 1000);
    if (ageSecs < 60) return 'Just now';
    const ageMins = Math.floor(ageSecs / 60);
    if (ageMins === 1) return '1 minute ago';
    return `${ageMins} minutes ago`;
  }
);

import { createReducer, on } from '@ngrx/store';
import { EntityCacheState, initialCacheMetadata } from './cache.models';
import * as CacheActions from './cache.actions';

/**
 * Initial cache state for all entity types
 */
export const initialCacheState: EntityCacheState = {
  trucks: { ...initialCacheMetadata },
  drivers: { ...initialCacheMetadata },
  groups: { ...initialCacheMetadata },
  stats: { ...initialCacheMetadata }
};

/**
 * Cache reducer handling cache state transitions
 */
export const cacheReducer = createReducer(
  initialCacheState,

  // Trucks cache status updates
  on(CacheActions.setTrucksCacheStatus, (state, { status, error }) => ({
    ...state,
    trucks: {
      ...state.trucks,
      status,
      error,
      lastUpdated: status === 'fresh' ? Date.now() : state.trucks.lastUpdated
    }
  })),

  on(CacheActions.markTrucksCacheFresh, (state) => ({
    ...state,
    trucks: {
      ...state.trucks,
      status: 'fresh' as const,
      lastUpdated: Date.now(),
      error: undefined
    }
  })),

  on(CacheActions.invalidateTrucksCache, (state) => ({
    ...state,
    trucks: {
      ...state.trucks,
      status: 'stale' as const
    }
  })),

  // Drivers cache status updates
  on(CacheActions.setDriversCacheStatus, (state, { status, error }) => ({
    ...state,
    drivers: {
      ...state.drivers,
      status,
      error,
      lastUpdated: status === 'fresh' ? Date.now() : state.drivers.lastUpdated
    }
  })),

  on(CacheActions.markDriversCacheFresh, (state) => ({
    ...state,
    drivers: {
      ...state.drivers,
      status: 'fresh' as const,
      lastUpdated: Date.now(),
      error: undefined
    }
  })),

  on(CacheActions.invalidateDriversCache, (state) => ({
    ...state,
    drivers: {
      ...state.drivers,
      status: 'stale' as const
    }
  })),

  // Groups cache status updates
  on(CacheActions.setGroupsCacheStatus, (state, { status, error }) => ({
    ...state,
    groups: {
      ...state.groups,
      status,
      error,
      lastUpdated: status === 'fresh' ? Date.now() : state.groups.lastUpdated
    }
  })),

  on(CacheActions.markGroupsCacheFresh, (state) => ({
    ...state,
    groups: {
      ...state.groups,
      status: 'fresh' as const,
      lastUpdated: Date.now(),
      error: undefined
    }
  })),

  on(CacheActions.invalidateGroupsCache, (state) => ({
    ...state,
    groups: {
      ...state.groups,
      status: 'stale' as const
    }
  })),

  // Stats cache status updates
  on(CacheActions.setStatsCacheStatus, (state, { status, error }) => ({
    ...state,
    stats: {
      ...state.stats,
      status,
      error,
      lastUpdated: status === 'fresh' ? Date.now() : state.stats.lastUpdated
    }
  })),

  on(CacheActions.markStatsCacheFresh, (state) => ({
    ...state,
    stats: {
      ...state.stats,
      status: 'fresh' as const,
      lastUpdated: Date.now(),
      error: undefined
    }
  })),

  on(CacheActions.invalidateStatsCache, (state) => ({
    ...state,
    stats: {
      ...state.stats,
      status: 'stale' as const
    }
  })),

  // Clear all caches (on logout)
  on(CacheActions.clearAllCaches, () => ({
    ...initialCacheState
  }))
);

import { createAction, props } from '@ngrx/store';
import { CacheStatus } from './cache.models';
import { CacheEntityType } from './cache.constants';

// Check cache and trigger refresh if needed
export const checkTrucksCache = createAction('[Cache] Check Trucks Cache');
export const checkDriversCache = createAction('[Cache] Check Drivers Cache');
export const checkGroupsCache = createAction('[Cache] Check Groups Cache');
export const checkStatsCache = createAction('[Cache] Check Stats Cache');

// Set cache status
export const setTrucksCacheStatus = createAction(
  '[Cache] Set Trucks Cache Status',
  props<{ status: CacheStatus; error?: string }>()
);

export const setDriversCacheStatus = createAction(
  '[Cache] Set Drivers Cache Status',
  props<{ status: CacheStatus; error?: string }>()
);

export const setGroupsCacheStatus = createAction(
  '[Cache] Set Groups Cache Status',
  props<{ status: CacheStatus; error?: string }>()
);

export const setStatsCacheStatus = createAction(
  '[Cache] Set Stats Cache Status',
  props<{ status: CacheStatus; error?: string }>()
);

// Mark cache as fresh after successful load
export const markTrucksCacheFresh = createAction('[Cache] Mark Trucks Cache Fresh');
export const markDriversCacheFresh = createAction('[Cache] Mark Drivers Cache Fresh');
export const markGroupsCacheFresh = createAction('[Cache] Mark Groups Cache Fresh');
export const markStatsCacheFresh = createAction('[Cache] Mark Stats Cache Fresh');

// Invalidate specific cache (force refresh on next access)
export const invalidateTrucksCache = createAction('[Cache] Invalidate Trucks Cache');
export const invalidateDriversCache = createAction('[Cache] Invalidate Drivers Cache');
export const invalidateGroupsCache = createAction('[Cache] Invalidate Groups Cache');
export const invalidateStatsCache = createAction('[Cache] Invalidate Stats Cache');

// Clear all caches (used on logout)
export const clearAllCaches = createAction('[Cache] Clear All Caches');

// Generic cache refresh trigger (for background refresh)
export const triggerCacheRefresh = createAction(
  '[Cache] Trigger Cache Refresh',
  props<{ entityType: CacheEntityType }>()
);

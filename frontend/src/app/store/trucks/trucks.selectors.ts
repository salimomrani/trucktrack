import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TrucksState, trucksAdapter } from './trucks.state';
import { TruckStatus } from '../../models/truck.model';

export const selectTrucksState = createFeatureSelector<TrucksState>('trucks');

const { selectAll, selectEntities } = trucksAdapter.getSelectors();

export const selectAllTrucks = createSelector(selectTrucksState, selectAll);

export const selectTrucksEntities = createSelector(selectTrucksState, selectEntities);

export const selectSelectedTruckId = createSelector(
  selectTrucksState,
  (state) => state.selectedTruckId
);

export const selectSelectedTruck = createSelector(
  selectTrucksEntities,
  selectSelectedTruckId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectTrucksLoading = createSelector(
  selectTrucksState,
  (state) => state.loading
);

export const selectTrucksError = createSelector(
  selectTrucksState,
  (state) => state.error
);

export const selectSearchResults = createSelector(
  selectTrucksState,
  (state) => state.searchResults
);

export const selectIsSearching = createSelector(
  selectTrucksState,
  (state) => state.isSearching
);

// T106: Status Filter Selectors for US2
export const selectStatusFilters = createSelector(
  selectTrucksState,
  (state) => state.statusFilters
);

export const selectFilteredTrucks = createSelector(
  selectAllTrucks,
  selectStatusFilters,
  (trucks, statusFilters) => trucks.filter(truck => statusFilters.includes(truck.status))
);

export const selectHasActiveFilters = createSelector(
  selectStatusFilters,
  (statusFilters) => statusFilters.length < 3
);

// Filter search results based on status filters
// If user deselects "Active", search should not return active trucks
export const selectFilteredSearchResults = createSelector(
  selectSearchResults,
  selectStatusFilters,
  (searchResults, statusFilters) => searchResults.filter(truck => statusFilters.includes(truck.status))
);

// ============================================
// T034-T037: Memoized Selectors for US4
// ============================================

/**
 * T035: Select only active trucks (ACTIVE or IDLE status).
 * Memoized - only recalculates when trucks array changes.
 */
export const selectActiveTrucks = createSelector(
  selectAllTrucks,
  (trucks) => trucks.filter(truck => truck.status === 'ACTIVE' || truck.status === 'IDLE')
);

/**
 * T036: Parameterized selector factory for selecting a truck by ID.
 * Uses closure for memoization with the specific ID.
 */
export const selectTruckById = (truckId: string) => createSelector(
  selectTrucksEntities,
  (entities) => entities[truckId] ?? null
);

/**
 * T037: Select trucks by group ID.
 * Filters trucks belonging to a specific group.
 */
export const selectTrucksByGroup = (groupId: string) => createSelector(
  selectAllTrucks,
  (trucks) => trucks.filter(truck => truck.truckGroupId === groupId)
);

/**
 * T037: Select truck counts by status.
 * Useful for dashboard status breakdown.
 */
export const selectTruckCountsByStatus = createSelector(
  selectAllTrucks,
  (trucks) => {
    const counts = { active: 0, idle: 0, offline: 0, total: 0 };
    trucks.forEach(truck => {
      counts.total++;
      switch (truck.status) {
        case TruckStatus.ACTIVE: counts.active++; break;
        case TruckStatus.IDLE: counts.idle++; break;
        case TruckStatus.OFFLINE: counts.offline++; break;
      }
    });
    return counts;
  }
);

/**
 * T037: Select online truck count (ACTIVE + IDLE).
 */
export const selectOnlineTruckCount = createSelector(
  selectTruckCountsByStatus,
  (counts) => counts.active + counts.idle
);

/**
 * T037: Select percentage of trucks online.
 */
export const selectOnlineTruckPercentage = createSelector(
  selectTruckCountsByStatus,
  (counts) => counts.total > 0 ? Math.round(((counts.active + counts.idle) / counts.total) * 100) : 0
);

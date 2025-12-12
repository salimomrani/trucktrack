import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TrucksState, trucksAdapter } from './trucks.state';

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

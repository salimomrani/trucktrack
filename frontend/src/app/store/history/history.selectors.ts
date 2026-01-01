import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HistoryState } from './history.state';

export const selectHistoryState = createFeatureSelector<HistoryState>('history');

export const selectHistoryEntries = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.entries
);

export const selectHistoryLoading = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.loading
);

export const selectHistoryError = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.error
);

// Select history entries for a specific truck
export const selectHistoryByTruckId = (truckId: string) => createSelector(
  selectHistoryEntries,
  (entries) => entries.filter(entry => entry.truckId === truckId)
);

// ============================================
// Pagination Selectors (for infinite scroll)
// ============================================

export const selectHistoryCurrentPage = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.currentPage
);

export const selectHistoryTotalElements = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.totalElements
);

export const selectHistoryTotalPages = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.totalPages
);

export const selectHistoryHasMorePages = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.hasMorePages
);

export const selectHistoryLoadingMore = createSelector(
  selectHistoryState,
  (state: HistoryState) => state.loadingMore
);

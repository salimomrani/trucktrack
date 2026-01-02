import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TripsState, tripsAdapter } from './trips.state';
import { TripStatus } from '../../admin/trips/trip.model';

// Feature selector
export const selectTripsState = createFeatureSelector<TripsState>('trips');

// Entity adapter selectors
const { selectAll, selectEntities, selectIds, selectTotal } = tripsAdapter.getSelectors();

// ============================================
// Basic Entity Selectors
// ============================================

export const selectAllTrips = createSelector(
  selectTripsState,
  selectAll
);

export const selectTripEntities = createSelector(
  selectTripsState,
  selectEntities
);

export const selectTripIds = createSelector(
  selectTripsState,
  selectIds
);

export const selectTripsCount = createSelector(
  selectTripsState,
  selectTotal
);

// ============================================
// Selection Selectors
// ============================================

export const selectSelectedTripId = createSelector(
  selectTripsState,
  (state) => state.selectedTripId
);

export const selectSelectedTrip = createSelector(
  selectTripEntities,
  selectSelectedTripId,
  (entities, selectedId) => selectedId ? entities[selectedId] ?? null : null
);

// Parameterized selector for getting trip by ID
export const selectTripById = (tripId: string) => createSelector(
  selectTripEntities,
  (entities) => entities[tripId] ?? null
);

// ============================================
// Loading State Selectors
// ============================================

export const selectTripsLoading = createSelector(
  selectTripsState,
  (state) => state.loading
);

export const selectTripLoading = createSelector(
  selectTripsState,
  (state) => state.loadingTrip
);

export const selectTripsSaving = createSelector(
  selectTripsState,
  (state) => state.saving
);

export const selectTripsError = createSelector(
  selectTripsState,
  (state) => state.error
);

export const selectAnalyticsLoading = createSelector(
  selectTripsState,
  (state) => state.analyticsLoading
);

export const selectStatsLoading = createSelector(
  selectTripsState,
  (state) => state.statsLoading
);

export const selectHistoryLoading = createSelector(
  selectTripsState,
  (state) => state.historyLoading
);

// ============================================
// Pagination Selectors
// ============================================

export const selectCurrentPage = createSelector(
  selectTripsState,
  (state) => state.currentPage
);

export const selectPageSize = createSelector(
  selectTripsState,
  (state) => state.pageSize
);

export const selectTotalElements = createSelector(
  selectTripsState,
  (state) => state.totalElements
);

export const selectTotalPages = createSelector(
  selectTripsState,
  (state) => state.totalPages
);

export const selectHasMore = createSelector(
  selectTripsState,
  (state) => state.hasMore
);

export const selectPagination = createSelector(
  selectCurrentPage,
  selectPageSize,
  selectTotalElements,
  selectTotalPages,
  selectHasMore,
  (page, size, totalElements, totalPages, hasMore) => ({
    page,
    size,
    totalElements,
    totalPages,
    hasMore
  })
);

// ============================================
// Filter Selectors
// ============================================

export const selectStatusFilter = createSelector(
  selectTripsState,
  (state) => state.statusFilter
);

export const selectSearchQuery = createSelector(
  selectTripsState,
  (state) => state.searchQuery
);

export const selectDriverIdFilter = createSelector(
  selectTripsState,
  (state) => state.driverIdFilter
);

export const selectTruckIdFilter = createSelector(
  selectTripsState,
  (state) => state.truckIdFilter
);

export const selectStartDateFilter = createSelector(
  selectTripsState,
  (state) => state.startDateFilter
);

export const selectEndDateFilter = createSelector(
  selectTripsState,
  (state) => state.endDateFilter
);

export const selectAllFilters = createSelector(
  selectStatusFilter,
  selectSearchQuery,
  selectDriverIdFilter,
  selectTruckIdFilter,
  selectStartDateFilter,
  selectEndDateFilter,
  (status, search, driverId, truckId, startDate, endDate) => ({
    status,
    search,
    driverId,
    truckId,
    startDate,
    endDate
  })
);

export const selectHasActiveFilters = createSelector(
  selectAllFilters,
  (filters) =>
    filters.status !== null ||
    filters.search !== '' ||
    filters.driverId !== null ||
    filters.truckId !== null ||
    filters.startDate !== null ||
    filters.endDate !== null
);

// ============================================
// Status-based Selectors
// ============================================

export const selectTripsByStatus = (status: TripStatus) => createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === status)
);

export const selectPendingTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === 'PENDING')
);

export const selectAssignedTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === 'ASSIGNED')
);

export const selectInProgressTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === 'IN_PROGRESS')
);

export const selectCompletedTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === 'COMPLETED')
);

export const selectCancelledTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip => trip.status === 'CANCELLED')
);

export const selectActiveTrips = createSelector(
  selectAllTrips,
  (trips) => trips.filter(trip =>
    trip.status === 'ASSIGNED' || trip.status === 'IN_PROGRESS'
  )
);

// ============================================
// Stats Selectors
// ============================================

export const selectStats = createSelector(
  selectTripsState,
  (state) => state.stats
);

export const selectStatByStatus = (status: string) => createSelector(
  selectStats,
  (stats) => stats[status] ?? 0
);

export const selectPendingCount = createSelector(
  selectStats,
  (stats) => stats['PENDING'] ?? 0
);

export const selectAssignedCount = createSelector(
  selectStats,
  (stats) => stats['ASSIGNED'] ?? 0
);

export const selectInProgressCount = createSelector(
  selectStats,
  (stats) => stats['IN_PROGRESS'] ?? 0
);

export const selectCompletedCount = createSelector(
  selectStats,
  (stats) => stats['COMPLETED'] ?? 0
);

export const selectCancelledCount = createSelector(
  selectStats,
  (stats) => stats['CANCELLED'] ?? 0
);

// ============================================
// Analytics Selectors
// ============================================

export const selectAnalytics = createSelector(
  selectTripsState,
  (state) => state.analytics
);

export const selectTotalTrips = createSelector(
  selectAnalytics,
  (analytics) => analytics?.totalTrips ?? 0
);

export const selectCompletionRate = createSelector(
  selectAnalytics,
  (analytics) => analytics?.completionRate ?? 0
);

export const selectCancellationRate = createSelector(
  selectAnalytics,
  (analytics) => analytics?.cancellationRate ?? 0
);

export const selectAverageDuration = createSelector(
  selectAnalytics,
  (analytics) => analytics?.averageDurationMinutes ?? null
);

export const selectTripsToday = createSelector(
  selectAnalytics,
  (analytics) => analytics?.tripsToday ?? 0
);

export const selectTripsThisWeek = createSelector(
  selectAnalytics,
  (analytics) => analytics?.tripsThisWeek ?? 0
);

export const selectTripsThisMonth = createSelector(
  selectAnalytics,
  (analytics) => analytics?.tripsThisMonth ?? 0
);

export const selectTripsTrendPercent = createSelector(
  selectAnalytics,
  (analytics) => analytics?.tripsTrendPercent ?? null
);

export const selectCompletionRateTrend = createSelector(
  selectAnalytics,
  (analytics) => analytics?.completionRateTrendPercent ?? null
);

// ============================================
// History Selectors
// ============================================

export const selectTripHistory = createSelector(
  selectTripsState,
  (state) => state.tripHistory
);

export const selectTripHistoryCount = createSelector(
  selectTripHistory,
  (history) => history.length
);

// ============================================
// Computed Selectors
// ============================================

export const selectIsEmpty = createSelector(
  selectTripsCount,
  selectTripsLoading,
  (count, loading) => count === 0 && !loading
);

export const selectHasTrips = createSelector(
  selectTripsCount,
  (count) => count > 0
);

// Combined view model for list component
export const selectTripsListViewModel = createSelector(
  selectAllTrips,
  selectTripsLoading,
  selectTripsSaving,
  selectTripsError,
  selectPagination,
  selectAllFilters,
  selectStats,
  (trips, loading, saving, error, pagination, filters, stats) => ({
    trips,
    loading,
    saving,
    error,
    pagination,
    filters,
    stats
  })
);

// Combined view model for detail component
export const selectTripDetailViewModel = createSelector(
  selectSelectedTrip,
  selectTripLoading,
  selectTripsSaving,
  selectTripsError,
  selectTripHistory,
  selectHistoryLoading,
  (trip, loading, saving, error, history, historyLoading) => ({
    trip,
    loading,
    saving,
    error,
    history,
    historyLoading
  })
);

// Combined view model for stats component
export const selectTripStatsViewModel = createSelector(
  selectAnalytics,
  selectAnalyticsLoading,
  selectTripsError,
  (analytics, loading, error) => ({
    analytics,
    loading,
    error
  })
);

import { createReducer, on } from '@ngrx/store';
import { initialTripsState, tripsAdapter } from './trips.state';
import * as TripsActions from './trips.actions';

export const tripsReducer = createReducer(
  initialTripsState,

  // ============================================
  // Load Trips
  // ============================================

  on(TripsActions.loadTrips, (state, { page, size, status, search, driverId, truckId, startDate, endDate }) => ({
    ...state,
    loading: true,
    error: null,
    currentPage: page ?? state.currentPage,
    pageSize: size ?? state.pageSize,
    statusFilter: status !== undefined ? status : state.statusFilter,
    searchQuery: search ?? state.searchQuery,
    driverIdFilter: driverId !== undefined ? driverId : state.driverIdFilter,
    truckIdFilter: truckId !== undefined ? truckId : state.truckIdFilter,
    startDateFilter: startDate !== undefined ? startDate : state.startDateFilter,
    endDateFilter: endDate !== undefined ? endDate : state.endDateFilter
  })),

  on(TripsActions.loadTripsSuccess, (state, { response }) =>
    tripsAdapter.setAll(response.content, {
      ...state,
      loading: false,
      error: null,
      currentPage: response.page,
      totalElements: response.totalElements,
      totalPages: response.totalPages,
      hasMore: response.hasNext
    })
  ),

  on(TripsActions.loadTripsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ============================================
  // Load Single Trip
  // ============================================

  on(TripsActions.loadTrip, (state) => ({
    ...state,
    loadingTrip: true,
    error: null
  })),

  on(TripsActions.loadTripSuccess, (state, { trip }) =>
    tripsAdapter.upsertOne(trip, {
      ...state,
      loadingTrip: false,
      selectedTripId: trip.id
    })
  ),

  on(TripsActions.loadTripFailure, (state, { error }) => ({
    ...state,
    loadingTrip: false,
    error
  })),

  // ============================================
  // Create Trip
  // ============================================

  on(TripsActions.createTrip, (state) => ({
    ...state,
    saving: true,
    error: null
  })),

  on(TripsActions.createTripSuccess, (state, { trip }) =>
    tripsAdapter.addOne(trip, {
      ...state,
      saving: false,
      totalElements: state.totalElements + 1
    })
  ),

  on(TripsActions.createTripFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error
  })),

  // ============================================
  // Update Trip
  // ============================================

  on(TripsActions.updateTrip, (state) => ({
    ...state,
    saving: true,
    error: null
  })),

  on(TripsActions.updateTripSuccess, (state, { trip }) =>
    tripsAdapter.updateOne(
      { id: trip.id, changes: trip },
      { ...state, saving: false }
    )
  ),

  on(TripsActions.updateTripFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error
  })),

  // ============================================
  // Assign Trip
  // ============================================

  on(TripsActions.assignTrip, (state) => ({
    ...state,
    saving: true,
    error: null
  })),

  on(TripsActions.assignTripSuccess, (state, { trip }) =>
    tripsAdapter.updateOne(
      { id: trip.id, changes: trip },
      { ...state, saving: false }
    )
  ),

  on(TripsActions.assignTripFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error
  })),

  // ============================================
  // Reassign Trip
  // ============================================

  on(TripsActions.reassignTrip, (state) => ({
    ...state,
    saving: true,
    error: null
  })),

  on(TripsActions.reassignTripSuccess, (state, { trip }) =>
    tripsAdapter.updateOne(
      { id: trip.id, changes: trip },
      { ...state, saving: false }
    )
  ),

  on(TripsActions.reassignTripFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error
  })),

  // ============================================
  // Cancel Trip
  // ============================================

  on(TripsActions.cancelTrip, (state) => ({
    ...state,
    saving: true,
    error: null
  })),

  on(TripsActions.cancelTripSuccess, (state, { trip }) =>
    tripsAdapter.updateOne(
      { id: trip.id, changes: trip },
      { ...state, saving: false }
    )
  ),

  on(TripsActions.cancelTripFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error
  })),

  // ============================================
  // Load Trip History
  // ============================================

  on(TripsActions.loadTripHistory, (state) => ({
    ...state,
    historyLoading: true,
    tripHistory: []
  })),

  on(TripsActions.loadTripHistorySuccess, (state, { history }) => ({
    ...state,
    historyLoading: false,
    tripHistory: history
  })),

  on(TripsActions.loadTripHistoryFailure, (state, { error }) => ({
    ...state,
    historyLoading: false,
    error
  })),

  // ============================================
  // Load Analytics
  // ============================================

  on(TripsActions.loadAnalytics, (state) => ({
    ...state,
    analyticsLoading: true
  })),

  on(TripsActions.loadAnalyticsSuccess, (state, { analytics }) => ({
    ...state,
    analyticsLoading: false,
    analytics
  })),

  on(TripsActions.loadAnalyticsFailure, (state, { error }) => ({
    ...state,
    analyticsLoading: false,
    error
  })),

  // ============================================
  // Load Stats
  // ============================================

  on(TripsActions.loadStats, (state) => ({
    ...state,
    statsLoading: true
  })),

  on(TripsActions.loadStatsSuccess, (state, { stats }) => ({
    ...state,
    statsLoading: false,
    stats
  })),

  on(TripsActions.loadStatsFailure, (state, { error }) => ({
    ...state,
    statsLoading: false,
    error
  })),

  // ============================================
  // Filter Actions
  // ============================================

  on(TripsActions.setStatusFilter, (state, { status }) => ({
    ...state,
    statusFilter: status,
    currentPage: 0
  })),

  on(TripsActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query,
    currentPage: 0
  })),

  on(TripsActions.setDriverFilter, (state, { driverId }) => ({
    ...state,
    driverIdFilter: driverId,
    currentPage: 0
  })),

  on(TripsActions.setTruckFilter, (state, { truckId }) => ({
    ...state,
    truckIdFilter: truckId,
    currentPage: 0
  })),

  on(TripsActions.setDateFilter, (state, { startDate, endDate }) => ({
    ...state,
    startDateFilter: startDate,
    endDateFilter: endDate,
    currentPage: 0
  })),

  on(TripsActions.clearFilters, (state) => ({
    ...state,
    statusFilter: null,
    searchQuery: '',
    driverIdFilter: null,
    truckIdFilter: null,
    startDateFilter: null,
    endDateFilter: null,
    currentPage: 0
  })),

  // ============================================
  // Selection Actions
  // ============================================

  on(TripsActions.selectTrip, (state, { tripId }) => ({
    ...state,
    selectedTripId: tripId
  })),

  on(TripsActions.clearSelection, (state) => ({
    ...state,
    selectedTripId: null
  })),

  // ============================================
  // Clear Actions
  // ============================================

  on(TripsActions.clearTrips, (state) =>
    tripsAdapter.removeAll({
      ...state,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      hasMore: false
    })
  ),

  on(TripsActions.clearError, (state) => ({
    ...state,
    error: null
  })),

  on(TripsActions.clearTripHistory, (state) => ({
    ...state,
    tripHistory: []
  }))
);

import { createAction, props } from '@ngrx/store';
import {
  TripResponse,
  TripStatus,
  TripAnalytics,
  TripStatusHistoryResponse,
  CreateTripRequest,
  UpdateTripRequest,
  AssignTripRequest,
  PageResponse
} from '../../admin/trips/trip.model';

// ============================================
// Load Trips (Paginated)
// ============================================

export const loadTrips = createAction(
  '[Trips] Load Trips',
  props<{
    page?: number;
    size?: number;
    status?: TripStatus | null;
    search?: string;
    driverId?: string | null;
    truckId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>()
);

export const loadTripsSuccess = createAction(
  '[Trips] Load Trips Success',
  props<{ response: PageResponse<TripResponse> }>()
);

export const loadTripsFailure = createAction(
  '[Trips] Load Trips Failure',
  props<{ error: string }>()
);

// ============================================
// Load Single Trip
// ============================================

export const loadTrip = createAction(
  '[Trips] Load Trip',
  props<{ id: string }>()
);

export const loadTripSuccess = createAction(
  '[Trips] Load Trip Success',
  props<{ trip: TripResponse }>()
);

export const loadTripFailure = createAction(
  '[Trips] Load Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Create Trip
// ============================================

export const createTrip = createAction(
  '[Trips] Create Trip',
  props<{ request: CreateTripRequest }>()
);

export const createTripSuccess = createAction(
  '[Trips] Create Trip Success',
  props<{ trip: TripResponse }>()
);

export const createTripFailure = createAction(
  '[Trips] Create Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Update Trip
// ============================================

export const updateTrip = createAction(
  '[Trips] Update Trip',
  props<{ id: string; request: UpdateTripRequest }>()
);

export const updateTripSuccess = createAction(
  '[Trips] Update Trip Success',
  props<{ trip: TripResponse }>()
);

export const updateTripFailure = createAction(
  '[Trips] Update Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Assign Trip
// ============================================

export const assignTrip = createAction(
  '[Trips] Assign Trip',
  props<{ id: string; request: AssignTripRequest }>()
);

export const assignTripSuccess = createAction(
  '[Trips] Assign Trip Success',
  props<{ trip: TripResponse }>()
);

export const assignTripFailure = createAction(
  '[Trips] Assign Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Reassign Trip
// ============================================

export const reassignTrip = createAction(
  '[Trips] Reassign Trip',
  props<{ id: string; request: AssignTripRequest }>()
);

export const reassignTripSuccess = createAction(
  '[Trips] Reassign Trip Success',
  props<{ trip: TripResponse }>()
);

export const reassignTripFailure = createAction(
  '[Trips] Reassign Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Cancel Trip
// ============================================

export const cancelTrip = createAction(
  '[Trips] Cancel Trip',
  props<{ id: string; reason?: string }>()
);

export const cancelTripSuccess = createAction(
  '[Trips] Cancel Trip Success',
  props<{ trip: TripResponse }>()
);

export const cancelTripFailure = createAction(
  '[Trips] Cancel Trip Failure',
  props<{ error: string }>()
);

// ============================================
// Load Trip History (Status Changes)
// ============================================

export const loadTripHistory = createAction(
  '[Trips] Load Trip History',
  props<{ tripId: string }>()
);

export const loadTripHistorySuccess = createAction(
  '[Trips] Load Trip History Success',
  props<{ history: TripStatusHistoryResponse[] }>()
);

export const loadTripHistoryFailure = createAction(
  '[Trips] Load Trip History Failure',
  props<{ error: string }>()
);

// ============================================
// Load Analytics
// ============================================

export const loadAnalytics = createAction('[Trips] Load Analytics');

export const loadAnalyticsSuccess = createAction(
  '[Trips] Load Analytics Success',
  props<{ analytics: TripAnalytics }>()
);

export const loadAnalyticsFailure = createAction(
  '[Trips] Load Analytics Failure',
  props<{ error: string }>()
);

// ============================================
// Load Stats (Status Counts)
// ============================================

export const loadStats = createAction('[Trips] Load Stats');

export const loadStatsSuccess = createAction(
  '[Trips] Load Stats Success',
  props<{ stats: { [key: string]: number } }>()
);

export const loadStatsFailure = createAction(
  '[Trips] Load Stats Failure',
  props<{ error: string }>()
);

// ============================================
// Filter Actions
// ============================================

export const setStatusFilter = createAction(
  '[Trips] Set Status Filter',
  props<{ status: TripStatus | null }>()
);

export const setSearchQuery = createAction(
  '[Trips] Set Search Query',
  props<{ query: string }>()
);

export const setDriverFilter = createAction(
  '[Trips] Set Driver Filter',
  props<{ driverId: string | null }>()
);

export const setTruckFilter = createAction(
  '[Trips] Set Truck Filter',
  props<{ truckId: string | null }>()
);

export const setDateFilter = createAction(
  '[Trips] Set Date Filter',
  props<{ startDate: string | null; endDate: string | null }>()
);

export const clearFilters = createAction('[Trips] Clear Filters');

// ============================================
// Selection Actions
// ============================================

export const selectTrip = createAction(
  '[Trips] Select Trip',
  props<{ tripId: string }>()
);

export const clearSelection = createAction('[Trips] Clear Selection');

// ============================================
// Clear Actions
// ============================================

export const clearTrips = createAction('[Trips] Clear Trips');

export const clearError = createAction('[Trips] Clear Error');

export const clearTripHistory = createAction('[Trips] Clear Trip History');

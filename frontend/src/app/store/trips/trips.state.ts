import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TripResponse, TripStatus, TripAnalytics, TripStatusHistoryResponse } from '../../admin/trips/trip.model';

/**
 * Trips NgRx State
 * Manages admin trips with entity adapter for efficient CRUD operations
 */
export interface TripsState extends EntityState<TripResponse> {
  // Selection
  selectedTripId: string | null;

  // Loading states
  loading: boolean;
  loadingTrip: boolean;
  saving: boolean;

  // Error handling
  error: string | null;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;

  // Filters
  statusFilter: TripStatus | null;
  searchQuery: string;
  driverIdFilter: string | null;
  truckIdFilter: string | null;
  startDateFilter: string | null;
  endDateFilter: string | null;

  // Analytics
  analytics: TripAnalytics | null;
  analyticsLoading: boolean;

  // Trip history (status changes)
  tripHistory: TripStatusHistoryResponse[];
  historyLoading: boolean;

  // Stats by status (for quick counts)
  stats: { [key: string]: number };
  statsLoading: boolean;
}

export const tripsAdapter: EntityAdapter<TripResponse> = createEntityAdapter<TripResponse>({
  selectId: (trip) => trip.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

export const initialTripsState: TripsState = tripsAdapter.getInitialState({
  selectedTripId: null,
  loading: false,
  loadingTrip: false,
  saving: false,
  error: null,
  currentPage: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
  hasMore: false,
  statusFilter: null,
  searchQuery: '',
  driverIdFilter: null,
  truckIdFilter: null,
  startDateFilter: null,
  endDateFilter: null,
  analytics: null,
  analyticsLoading: false,
  tripHistory: [],
  historyLoading: false,
  stats: {},
  statsLoading: false
});

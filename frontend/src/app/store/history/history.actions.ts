import { createAction, props } from '@ngrx/store';
import { TruckHistoryEntry } from './history.state';
import { GPSPositionPage } from '../../models/gps-position.model';

// Load History with optional truckId (single endpoint - legacy)
export const loadHistory = createAction(
  '[History] Load History',
  props<{ startTime: string; endTime: string; truckId?: string | null }>()
);

export const loadHistorySuccess = createAction(
  '[History] Load History Success',
  props<{ entries: TruckHistoryEntry[] }>()
);

export const loadHistoryFailure = createAction(
  '[History] Load History Failure',
  props<{ error: string }>()
);

// Clear History
export const clearHistory = createAction('[History] Clear History');

// ============================================
// Paginated History (for infinite scroll)
// ============================================

// Load first page of history
export const loadHistoryPaged = createAction(
  '[History] Load History Paged',
  props<{ startTime: string; endTime: string; truckId?: string | null; size?: number }>()
);

export const loadHistoryPagedSuccess = createAction(
  '[History] Load History Paged Success',
  props<{ page: GPSPositionPage; startTime: string; endTime: string; truckId?: string | null }>()
);

export const loadHistoryPagedFailure = createAction(
  '[History] Load History Paged Failure',
  props<{ error: string }>()
);

// Load more history (infinite scroll)
export const loadMoreHistory = createAction(
  '[History] Load More History'
);

export const loadMoreHistorySuccess = createAction(
  '[History] Load More History Success',
  props<{ page: GPSPositionPage }>()
);

export const loadMoreHistoryFailure = createAction(
  '[History] Load More History Failure',
  props<{ error: string }>()
);

import { createAction, props } from '@ngrx/store';
import { TruckHistoryEntry } from './history.state';

// Load History
export const loadHistory = createAction('[History] Load History');

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

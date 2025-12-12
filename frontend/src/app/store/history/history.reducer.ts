import { createReducer, on } from '@ngrx/store';
import * as HistoryActions from './history.actions';
import { initialHistoryState } from './history.state';

export const historyReducer = createReducer(
  initialHistoryState,

  // Load History
  on(HistoryActions.loadHistory, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(HistoryActions.loadHistorySuccess, (state, { entries }) => ({
    ...state,
    entries,
    loading: false,
    error: null
  })),

  on(HistoryActions.loadHistoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear History
  on(HistoryActions.clearHistory, () => ({
    ...initialHistoryState
  }))
);

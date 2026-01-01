import { createReducer, on } from '@ngrx/store';
import * as HistoryActions from './history.actions';
import { initialHistoryState, TruckHistoryEntry } from './history.state';
import { GPSPosition } from '../../models/gps-position.model';

// Helper to convert GPSPosition to TruckHistoryEntry
const mapPositionToEntry = (pos: GPSPosition): TruckHistoryEntry => ({
  truckId: pos.truckId,
  timestamp: new Date(pos.timestamp),
  latitude: pos.latitude,
  longitude: pos.longitude,
  speed: pos.speed || 0,
  heading: pos.heading || 0,
  status: (pos.speed && pos.speed > 5) ? 'moving' : 'stopped'
});

export const historyReducer = createReducer(
  initialHistoryState,

  // Load History (legacy - non-paginated)
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
  })),

  // ============================================
  // Paginated History (for infinite scroll)
  // ============================================

  // Load first page
  on(HistoryActions.loadHistoryPaged, (state) => ({
    ...state,
    loading: true,
    error: null,
    entries: [], // Clear existing entries
    currentPage: 0,
    hasMorePages: true
  })),

  on(HistoryActions.loadHistoryPagedSuccess, (state, { page, startTime, endTime, truckId }) => ({
    ...state,
    entries: page.content.map(mapPositionToEntry),
    loading: false,
    error: null,
    currentPage: page.number,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    hasMorePages: !page.last,
    currentStartTime: startTime,
    currentEndTime: endTime,
    currentTruckId: truckId || null
  })),

  on(HistoryActions.loadHistoryPagedFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load more (infinite scroll)
  on(HistoryActions.loadMoreHistory, (state) => ({
    ...state,
    loadingMore: true
  })),

  on(HistoryActions.loadMoreHistorySuccess, (state, { page }) => ({
    ...state,
    entries: [...state.entries, ...page.content.map(mapPositionToEntry)],
    loadingMore: false,
    currentPage: page.number,
    hasMorePages: !page.last,
    error: null
  })),

  on(HistoryActions.loadMoreHistoryFailure, (state, { error }) => ({
    ...state,
    loadingMore: false,
    error
  }))
);

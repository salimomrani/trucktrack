import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

import { authReducer } from './auth/auth.reducer';
import { trucksReducer } from './trucks/trucks.reducer';
import { gpsReducer } from './gps/gps.reducer';
import { historyReducer } from './history/history.reducer';
import { cacheReducer } from './cache/cache.reducer';
import { AuthState } from './auth/auth.state';
import { TrucksState } from './trucks/trucks.state';
import { GpsState } from './gps/gps.state';
import { HistoryState } from './history/history.state';
import { EntityCacheState } from './cache/cache.models';

/**
 * Root application state
 */
export interface AppState {
  auth: AuthState;
  trucks: TrucksState;
  gps: GpsState;
  history: HistoryState;
  cache: EntityCacheState;
}

/**
 * Root reducers map
 */
export const rootReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  trucks: trucksReducer,
  gps: gpsReducer,
  history: historyReducer,
  cache: cacheReducer
};

/**
 * Meta reducers (middleware for all actions)
 */
export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];

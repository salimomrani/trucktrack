import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

import { authReducer } from './auth/auth.reducer';
import { trucksReducer } from './trucks/trucks.reducer';
import { gpsReducer } from './gps/gps.reducer';
import { AuthState } from './auth/auth.state';
import { TrucksState } from './trucks/trucks.state';
import { GpsState } from './gps/gps.state';

/**
 * Root application state
 */
export interface AppState {
  auth: AuthState;
  trucks: TrucksState;
  gps: GpsState;
}

/**
 * Root reducers map
 */
export const rootReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  trucks: trucksReducer,
  gps: gpsReducer
};

/**
 * Meta reducers (middleware for all actions)
 */
export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];

import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

import { authReducer } from './auth/auth.reducer';
import { trucksReducer } from './trucks/trucks.reducer';
import { gpsReducer } from './gps/gps.reducer';
import { historyReducer } from './history/history.reducer';
import { cacheReducer } from './cache';
import { notificationsReducer } from './notifications/notifications.reducer';
import { tripsReducer } from './trips/trips.reducer';
import { languageReducer } from './language/language.reducer';
import { dashboardReducer } from './dashboard/dashboard.reducer';
import { AuthState } from './auth/auth.state';
import { TrucksState } from './trucks/trucks.state';
import { GpsState } from './gps/gps.state';
import { HistoryState } from './history/history.state';
import { EntityCacheState } from './cache';
import { NotificationsState } from './notifications/notifications.state';
import { TripsState } from './trips/trips.state';
import { LanguageState } from './language/language.state';
import { DashboardState } from './dashboard/dashboard.state';

/**
 * Root application state
 * T016: Added dashboard state
 */
export interface AppState {
  auth: AuthState;
  trucks: TrucksState;
  gps: GpsState;
  history: HistoryState;
  cache: EntityCacheState;
  notifications: NotificationsState;
  trips: TripsState;
  language: LanguageState;
  dashboard: DashboardState;
}

/**
 * Root reducers map
 * T016: Added dashboard reducer
 */
export const rootReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  trucks: trucksReducer,
  gps: gpsReducer,
  history: historyReducer,
  cache: cacheReducer,
  notifications: notificationsReducer,
  trips: tripsReducer,
  language: languageReducer,
  dashboard: dashboardReducer
};

/**
 * Meta reducers (middleware for all actions)
 */
export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];

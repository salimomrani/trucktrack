import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, race, filter, map, take } from 'rxjs';
import { AppState } from './index';
import * as AuthSelectors from './auth/auth.selectors';
import * as TrucksSelectors from './trucks/trucks.selectors';
import * as GpsSelectors from './gps/gps.selectors';
import * as AuthActions from './auth/auth.actions';
import * as TrucksActions from './trucks/trucks.actions';
import * as GpsActions from './gps/gps.actions';
import { LoginRequest } from '../core/models/auth.model';
import { GPSPositionEvent } from '../models/gps-position.model';

/**
 * Store Facade with Signals Integration
 * Provides a clean API to interact with NgRx store using Angular 17+ signals
 */
@Injectable({
  providedIn: 'root'
})
export class StoreFacade {
  private store = inject(Store<AppState>);
  private actions$ = inject(Actions);

  // Auth Signals
  readonly currentUser = toSignal(this.store.select(AuthSelectors.selectCurrentUser));
  readonly isAuthenticated = toSignal(this.store.select(AuthSelectors.selectIsAuthenticated), {
    initialValue: false
  });
  readonly authLoading = toSignal(this.store.select(AuthSelectors.selectAuthLoading), {
    initialValue: false
  });
  readonly authError = toSignal(this.store.select(AuthSelectors.selectAuthError));

  // Trucks Signals
  readonly trucks = toSignal(this.store.select(TrucksSelectors.selectAllTrucks), {
    initialValue: []
  });
  readonly selectedTruck = toSignal(this.store.select(TrucksSelectors.selectSelectedTruck));
  readonly trucksLoading = toSignal(this.store.select(TrucksSelectors.selectTrucksLoading), {
    initialValue: false
  });

  // GPS Signals
  readonly latestPosition = toSignal(this.store.select(GpsSelectors.selectLatestPosition));
  readonly allPositions = toSignal(this.store.select(GpsSelectors.selectAllPositions), {
    initialValue: {}
  });

  // Computed Signals
  readonly trucksCount = computed(() => this.trucks().length);
  readonly hasActiveTrucks = computed(() => this.trucksCount() > 0);
  readonly userEmail = computed(() => this.currentUser()?.email);

  // Auth Actions
  login(credentials: LoginRequest) {
    this.store.dispatch(AuthActions.login({ credentials }));
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  loadUser() {
    this.store.dispatch(AuthActions.loadUser());
  }

  checkAuthStatus() {
    this.store.dispatch(AuthActions.checkAuthStatus());
  }

  /**
   * Refresh access token
   * Returns an Observable that completes when refresh succeeds or errors when it fails
   */
  refreshToken(): Observable<void> {
    // Dispatch refresh action
    this.store.dispatch(AuthActions.refreshToken());

    // Wait for either success or failure
    return race([
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenSuccess),
        take(1),
        map(() => undefined)
      ),
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        take(1),
        map((action) => {
          throw new Error(action.error);
        })
      )
    ]);
  }

  // Trucks Actions
  loadTrucks() {
    this.store.dispatch(TrucksActions.loadTrucks());
  }

  selectTruck(truckId: string) {
    this.store.dispatch(TrucksActions.selectTruck({ truckId }));
  }

  updateTruckPosition(truckId: string, latitude: number, longitude: number, speed: number, heading: number) {
    this.store.dispatch(TrucksActions.updateTruckPosition({ truckId, latitude, longitude, speed, heading }));
  }

  // GPS Actions
  addGpsPosition(position: GPSPositionEvent) {
    this.store.dispatch(GpsActions.addGpsPosition({ position }));
  }

  clearGpsPositions() {
    this.store.dispatch(GpsActions.clearGpsPositions());
  }

  // Helper to get position for specific truck
  getTruckPosition(truckId: string) {
    return toSignal(this.store.select(GpsSelectors.selectTruckPosition(truckId)));
  }
}

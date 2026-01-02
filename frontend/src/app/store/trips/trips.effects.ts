import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as TripsActions from './trips.actions';
import { selectTripsState } from './trips.selectors';
import { TripService } from '../../admin/trips/trip.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Injectable()
export class TripsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly tripService = inject(TripService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // ============================================
  // Load Trips
  // ============================================

  loadTrips$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.loadTrips),
      withLatestFrom(this.store.select(selectTripsState)),
      switchMap(([action, state]) => {
        const page = action.page ?? state.currentPage;
        const size = action.size ?? state.pageSize;
        const status = action.status !== undefined ? action.status : state.statusFilter;
        const search = action.search ?? state.searchQuery;
        const driverId = action.driverId !== undefined ? action.driverId : state.driverIdFilter;
        const truckId = action.truckId !== undefined ? action.truckId : state.truckIdFilter;
        const startDate = action.startDate !== undefined ? action.startDate : state.startDateFilter;
        const endDate = action.endDate !== undefined ? action.endDate : state.endDateFilter;

        return this.tripService.getTrips(
          page,
          size,
          search || undefined,
          status || undefined,
          driverId || undefined,
          truckId || undefined,
          startDate || undefined,
          endDate || undefined
        ).pipe(
          map(response => TripsActions.loadTripsSuccess({ response })),
          catchError(error => of(TripsActions.loadTripsFailure({
            error: error.error?.message || error.message || 'Failed to load trips'
          })))
        );
      })
    )
  );

  // ============================================
  // Load Single Trip
  // ============================================

  loadTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.loadTrip),
      switchMap(({ id }) =>
        this.tripService.getTripById(id).pipe(
          map(trip => TripsActions.loadTripSuccess({ trip })),
          catchError(error => of(TripsActions.loadTripFailure({
            error: error.error?.message || error.message || 'Failed to load trip'
          })))
        )
      )
    )
  );

  // ============================================
  // Create Trip
  // ============================================

  createTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.createTrip),
      switchMap(({ request }) =>
        this.tripService.createTrip(request).pipe(
          map(trip => TripsActions.createTripSuccess({ trip })),
          catchError(error => of(TripsActions.createTripFailure({
            error: error.error?.message || error.message || 'Failed to create trip'
          })))
        )
      )
    )
  );

  createTripSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.createTripSuccess),
      tap(({ trip }) => {
        this.toast.success('Trip created successfully');
        this.router.navigate(['/admin/trips', trip.id]);
      })
    ),
    { dispatch: false }
  );

  // ============================================
  // Update Trip
  // ============================================

  updateTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.updateTrip),
      switchMap(({ id, request }) =>
        this.tripService.updateTrip(id, request).pipe(
          map(trip => TripsActions.updateTripSuccess({ trip })),
          catchError(error => of(TripsActions.updateTripFailure({
            error: error.error?.message || error.message || 'Failed to update trip'
          })))
        )
      )
    )
  );

  updateTripSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.updateTripSuccess),
      tap(() => {
        this.toast.success('Trip updated successfully');
      })
    ),
    { dispatch: false }
  );

  // ============================================
  // Assign Trip
  // ============================================

  assignTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.assignTrip),
      switchMap(({ id, request }) =>
        this.tripService.assignTrip(id, request).pipe(
          map(trip => TripsActions.assignTripSuccess({ trip })),
          catchError(error => of(TripsActions.assignTripFailure({
            error: error.error?.message || error.message || 'Failed to assign trip'
          })))
        )
      )
    )
  );

  assignTripSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.assignTripSuccess),
      tap(() => {
        this.toast.success('Trip assigned successfully');
      })
    ),
    { dispatch: false }
  );

  // ============================================
  // Reassign Trip
  // ============================================

  reassignTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.reassignTrip),
      switchMap(({ id, request }) =>
        this.tripService.reassignTrip(id, request).pipe(
          map(trip => TripsActions.reassignTripSuccess({ trip })),
          catchError(error => of(TripsActions.reassignTripFailure({
            error: error.error?.message || error.message || 'Failed to reassign trip'
          })))
        )
      )
    )
  );

  reassignTripSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.reassignTripSuccess),
      tap(() => {
        this.toast.success('Trip reassigned successfully');
      })
    ),
    { dispatch: false }
  );

  // ============================================
  // Cancel Trip
  // ============================================

  cancelTrip$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.cancelTrip),
      switchMap(({ id, reason }) =>
        this.tripService.cancelTrip(id, reason).pipe(
          map(trip => TripsActions.cancelTripSuccess({ trip })),
          catchError(error => of(TripsActions.cancelTripFailure({
            error: error.error?.message || error.message || 'Failed to cancel trip'
          })))
        )
      )
    )
  );

  cancelTripSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.cancelTripSuccess),
      tap(() => {
        this.toast.success('Trip cancelled successfully');
      })
    ),
    { dispatch: false }
  );

  // ============================================
  // Load Trip History
  // ============================================

  loadTripHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.loadTripHistory),
      switchMap(({ tripId }) =>
        this.tripService.getTripHistory(tripId).pipe(
          map(history => TripsActions.loadTripHistorySuccess({ history })),
          catchError(error => of(TripsActions.loadTripHistoryFailure({
            error: error.error?.message || error.message || 'Failed to load trip history'
          })))
        )
      )
    )
  );

  // ============================================
  // Load Analytics
  // ============================================

  loadAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.loadAnalytics),
      switchMap(() =>
        this.tripService.getAnalytics().pipe(
          map(analytics => TripsActions.loadAnalyticsSuccess({ analytics })),
          catchError(error => of(TripsActions.loadAnalyticsFailure({
            error: error.error?.message || error.message || 'Failed to load analytics'
          })))
        )
      )
    )
  );

  // ============================================
  // Load Stats
  // ============================================

  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripsActions.loadStats),
      switchMap(() =>
        this.tripService.getTripStats().pipe(
          map(stats => TripsActions.loadStatsSuccess({ stats })),
          catchError(error => of(TripsActions.loadStatsFailure({
            error: error.error?.message || error.message || 'Failed to load stats'
          })))
        )
      )
    )
  );

  // ============================================
  // Reload on Filter Change
  // ============================================

  reloadOnFilterChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TripsActions.setStatusFilter,
        TripsActions.setSearchQuery,
        TripsActions.setDriverFilter,
        TripsActions.setTruckFilter,
        TripsActions.setDateFilter,
        TripsActions.clearFilters
      ),
      map(() => TripsActions.loadTrips({ page: 0 }))
    )
  );

  // ============================================
  // Refresh Stats After Mutations
  // ============================================

  refreshStatsAfterMutation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TripsActions.createTripSuccess,
        TripsActions.assignTripSuccess,
        TripsActions.reassignTripSuccess,
        TripsActions.cancelTripSuccess
      ),
      map(() => TripsActions.loadStats())
    )
  );

  // ============================================
  // Error Handling
  // ============================================

  showErrorToast$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        TripsActions.loadTripsFailure,
        TripsActions.loadTripFailure,
        TripsActions.createTripFailure,
        TripsActions.updateTripFailure,
        TripsActions.assignTripFailure,
        TripsActions.reassignTripFailure,
        TripsActions.cancelTripFailure,
        TripsActions.loadTripHistoryFailure,
        TripsActions.loadAnalyticsFailure,
        TripsActions.loadStatsFailure
      ),
      tap(({ error }) => {
        this.toast.error(error);
      })
    ),
    { dispatch: false }
  );
}

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardApiService } from '../../services/dashboard.service';
import * as DashboardActions from './dashboard.actions';

/**
 * T015: Dashboard NgRx effects (skeleton).
 * Feature: 022-dashboard-real-data
 *
 * Effects will be enhanced in subsequent tasks:
 * - T021: loadKpis$ implementation
 * - T028: loadFleetStatus$ implementation
 * - T036: loadActivity$ implementation
 * - T044: loadPerformance$ implementation
 * - T052: loadAllDashboardData$ implementation
 */
@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly dashboardService = inject(DashboardApiService);

  /**
   * T052: Load all dashboard data in a single API call.
   */
  loadAllDashboardData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadAllDashboardData),
      switchMap(({ performancePeriod }) =>
        this.dashboardService.getDashboardData(performancePeriod ?? 'week').pipe(
          map(data => DashboardActions.loadAllDashboardDataSuccess({ data })),
          catchError(error =>
            of(DashboardActions.loadAllDashboardDataFailure({
              error: error.error?.message || error.message || 'Failed to load dashboard data'
            }))
          )
        )
      )
    )
  );

  /**
   * T021: Load KPIs only.
   */
  loadKpis$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadKpis),
      switchMap(() =>
        this.dashboardService.getKpis().pipe(
          map(kpis => DashboardActions.loadKpisSuccess({ kpis })),
          catchError(error =>
            of(DashboardActions.loadKpisFailure({
              error: error.error?.message || error.message || 'Failed to load KPIs'
            }))
          )
        )
      )
    )
  );

  /**
   * T028: Load fleet status.
   */
  loadFleetStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadFleetStatus),
      switchMap(() =>
        this.dashboardService.getFleetStatus().pipe(
          map(fleetStatus => DashboardActions.loadFleetStatusSuccess({ fleetStatus })),
          catchError(error =>
            of(DashboardActions.loadFleetStatusFailure({
              error: error.error?.message || error.message || 'Failed to load fleet status'
            }))
          )
        )
      )
    )
  );

  /**
   * T036: Load recent activity.
   */
  loadActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadActivity),
      switchMap(({ limit }) =>
        this.dashboardService.getActivity(limit ?? 5).pipe(
          map(activity => DashboardActions.loadActivitySuccess({ activity })),
          catchError(error =>
            of(DashboardActions.loadActivityFailure({
              error: error.error?.message || error.message || 'Failed to load activity'
            }))
          )
        )
      )
    )
  );

  /**
   * T044: Load performance metrics.
   */
  loadPerformance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadPerformance),
      switchMap(({ period }) =>
        this.dashboardService.getPerformance(period).pipe(
          map(performance => DashboardActions.loadPerformanceSuccess({ performance })),
          catchError(error =>
            of(DashboardActions.loadPerformanceFailure({
              error: error.error?.message || error.message || 'Failed to load performance'
            }))
          )
        )
      )
    )
  );

  /**
   * Refresh dashboard - triggers loadAllDashboardData.
   */
  refreshDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.refreshDashboard),
      map(() => DashboardActions.loadAllDashboardData({}))
    )
  );
}

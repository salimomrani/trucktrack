import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  switchMap,
  map,
  catchError,
  withLatestFrom,
  filter,
  tap,
  takeUntil,
  startWith
} from 'rxjs/operators';
import { of, timer, EMPTY } from 'rxjs';
import { HealthService } from '../../core/services/health.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import * as HealthActions from './health.actions';
import * as HealthSelectors from './health.selectors';
import { TranslateService } from '@ngx-translate/core';

/** Polling interval for health checks (30 seconds) */
const POLL_INTERVAL = 30000;

/** Debounce time for consecutive status change toasts */
const TOAST_DEBOUNCE = 5000;

@Injectable()
export class HealthEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly healthService = inject(HealthService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  /** Track last toast time to debounce */
  private lastToastTime = 0;

  /**
   * Check health when action is dispatched
   */
  checkHealth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HealthActions.checkHealth),
      switchMap(() =>
        this.healthService.getHealthStatus().pipe(
          map(health => HealthActions.checkHealthSuccess({ health })),
          catchError(error =>
            of(HealthActions.checkHealthFailure({
              error: error.message || 'Health check failed'
            }))
          )
        )
      )
    )
  );

  /**
   * Start polling when monitoring is activated
   */
  startMonitoring$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HealthActions.startMonitoring),
      switchMap(() =>
        timer(0, POLL_INTERVAL).pipe(
          takeUntil(this.actions$.pipe(ofType(HealthActions.stopMonitoring))),
          map(() => HealthActions.checkHealth())
        )
      )
    )
  );

  /**
   * Detect service status changes and dispatch change actions
   */
  detectServiceChanges$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HealthActions.checkHealthSuccess),
      withLatestFrom(
        this.store.select(HealthSelectors.selectChangedServices),
        this.store.select(HealthSelectors.selectServices)
      ),
      filter(([_, changedServices]) => changedServices.length > 0),
      switchMap(([_, changedServices, services]) => {
        const actions = changedServices.map(serviceName => {
          const service = services.find(s => s.name === serviceName);
          if (service) {
            return HealthActions.serviceStatusChanged({
              serviceName: service.name,
              displayName: service.displayName,
              newStatus: service.status
            });
          }
          return null;
        }).filter((action): action is ReturnType<typeof HealthActions.serviceStatusChanged> => action !== null);

        return of(...actions);
      })
    )
  );

  /**
   * Show toast notification when a service status changes
   */
  showServiceStatusToast$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HealthActions.serviceStatusChanged),
      filter(() => {
        // Debounce: only show toast if enough time has passed
        const now = Date.now();
        if (now - this.lastToastTime < TOAST_DEBOUNCE) {
          return false;
        }
        this.lastToastTime = now;
        return true;
      }),
      tap(({ displayName, newStatus }) => {
        if (newStatus === 'DOWN') {
          const message = this.translate.instant('HEALTH.SERVICE_DOWN', { service: displayName });
          this.toastService.error(message, 5000);
        } else {
          const message = this.translate.instant('HEALTH.SERVICE_RESTORED', { service: displayName });
          this.toastService.success(message, 3000);
        }
      })
    ),
    { dispatch: false }
  );

  /**
   * Detect overall status changes
   */
  detectOverallStatusChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HealthActions.checkHealthSuccess),
      withLatestFrom(
        this.store.select(HealthSelectors.selectPreviousStatus),
        this.store.select(HealthSelectors.selectOverallStatus)
      ),
      filter(([_, previousStatus, currentStatus]) =>
        previousStatus !== null && previousStatus !== currentStatus
      ),
      map(([_, previousStatus, currentStatus]) =>
        HealthActions.overallStatusChanged({
          previousStatus: previousStatus!,
          newStatus: currentStatus as 'UP' | 'DEGRADED' | 'DOWN'
        })
      )
    )
  );
}

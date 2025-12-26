import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, EMPTY } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, filter, tap } from 'rxjs/operators';
import { TruckService } from '../../services/truck.service';
import { GroupService } from '../../admin/groups/group.service';
import * as CacheActions from './cache.actions';
import * as TrucksActions from '../trucks/trucks.actions';
import * as CacheSelectors from './cache.selectors';

/**
 * Cache effects implementing stale-while-revalidate pattern.
 * - On cache check: If stale, trigger background refresh
 * - On load success: Mark cache as fresh
 * - On load failure: Mark cache as error
 */
@Injectable()
export class CacheEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private truckService = inject(TruckService);
  private groupService = inject(GroupService);

  /**
   * Check trucks cache and trigger refresh if stale.
   * Implements stale-while-revalidate: existing data is still shown while refreshing.
   */
  checkTrucksCache$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CacheActions.checkTrucksCache),
      withLatestFrom(this.store.select(CacheSelectors.selectShouldRefreshTrucks)),
      filter(([_, shouldRefresh]) => shouldRefresh),
      map(() => {
        // Set status to loading and trigger trucks load
        return TrucksActions.loadTrucks();
      })
    )
  );

  /**
   * Set cache status to loading when trucks load starts
   */
  setTrucksLoading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.loadTrucks),
      map(() => CacheActions.setTrucksCacheStatus({ status: 'loading' }))
    )
  );

  /**
   * Mark trucks cache as fresh when load succeeds
   */
  markTrucksCacheFresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.loadTrucksSuccess),
      map(() => CacheActions.markTrucksCacheFresh())
    )
  );

  /**
   * Mark trucks cache as error when load fails
   */
  markTrucksCacheError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.loadTrucksFailure),
      map(({ error }) => CacheActions.setTrucksCacheStatus({ status: 'error', error }))
    )
  );

  /**
   * Invalidate trucks cache after CRUD operations
   */
  invalidateTrucksOnCrud$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        // Add any truck CRUD success actions here
        // TrucksActions.createTruckSuccess,
        // TrucksActions.updateTruckSuccess,
        // TrucksActions.deleteTruckSuccess
      ),
      map(() => CacheActions.invalidateTrucksCache())
    ),
    { dispatch: false } // Disabled until CRUD actions are added
  );

  // ============================================
  // T020: DRIVERS CACHE EFFECTS
  // ============================================

  /**
   * Check drivers cache and trigger refresh if stale.
   * Note: Drivers cache effect is disabled until a dedicated DriverService is implemented.
   * Currently, drivers are managed through the trips/assignments flow.
   */
  checkDriversCache$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CacheActions.checkDriversCache),
      withLatestFrom(this.store.select(CacheSelectors.selectShouldRefreshDrivers)),
      filter(([_, shouldRefresh]) => shouldRefresh),
      map(() => {
        // TODO: Implement when DriverService.getDrivers() is available
        // For now, just mark as fresh to prevent repeated checks
        return CacheActions.markDriversCacheFresh();
      })
    )
  );

  // ============================================
  // T021: GROUPS CACHE EFFECTS
  // ============================================

  /**
   * Check groups cache and trigger refresh if stale.
   */
  checkGroupsCache$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CacheActions.checkGroupsCache),
      withLatestFrom(this.store.select(CacheSelectors.selectShouldRefreshGroups)),
      filter(([_, shouldRefresh]) => shouldRefresh),
      switchMap(() => {
        this.store.dispatch(CacheActions.setGroupsCacheStatus({ status: 'loading' }));
        return this.groupService.getGroups().pipe(
          map(() => CacheActions.markGroupsCacheFresh()),
          catchError((error) => of(CacheActions.setGroupsCacheStatus({
            status: 'error',
            error: error.message || 'Failed to load groups'
          })))
        );
      })
    )
  );

  // ============================================
  // T025: INVALIDATION TRIGGERS
  // ============================================

  /**
   * Cross-entity cache invalidation.
   * When trucks are updated, groups cache might need refresh too (for truck counts).
   */
  invalidateRelatedCaches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CacheActions.invalidateTrucksCache),
      map(() => CacheActions.invalidateGroupsCache())
    )
  );
}

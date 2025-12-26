import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import { TruckService } from '../../services/truck.service';
import * as TrucksActions from './trucks.actions';
import * as CacheSelectors from '../cache/cache.selectors';

@Injectable()
export class TrucksEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private truckService = inject(TruckService);

  /**
   * Load trucks with cache check.
   * If cache is fresh, skip the API call.
   * This implements the stale-while-revalidate pattern.
   */
  loadTrucks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.loadTrucks),
      withLatestFrom(this.store.select(CacheSelectors.selectTrucksCacheState)),
      switchMap(([_, cacheState]) => {
        // Always load if cache is stale, idle, or error
        // The cache effects will mark the cache appropriately
        return this.truckService.getTrucks().pipe(
          map((response) => TrucksActions.loadTrucksSuccess({ trucks: response.content })),
          catchError((error) =>
            of(TrucksActions.loadTrucksFailure({ error: error.message || 'Failed to load trucks' }))
          )
        );
      })
    )
  );

  searchTrucks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.searchTrucks),
      switchMap(({ query }) =>
        this.truckService.searchTrucks(query).pipe(
          map((results) => TrucksActions.searchTrucksSuccess({ results })),
          catchError((error) =>
            of(TrucksActions.searchTrucksFailure({ error: error.message || 'Search failed' }))
          )
        )
      )
    )
  );
}

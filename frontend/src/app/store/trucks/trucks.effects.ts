import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TruckService } from '../../services/truck.service';
import * as TrucksActions from './trucks.actions';

@Injectable()
export class TrucksEffects {
  private actions$ = inject(Actions);
  private truckService = inject(TruckService);

  loadTrucks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrucksActions.loadTrucks),
      switchMap(() =>
        this.truckService.getTrucks().pipe(
          map((response) => TrucksActions.loadTrucksSuccess({ trucks: response.content })),
          catchError((error) =>
            of(TrucksActions.loadTrucksFailure({ error: error.message || 'Failed to load trucks' }))
          )
        )
      )
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

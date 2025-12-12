import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, withLatestFrom } from 'rxjs/operators';
import * as HistoryActions from './history.actions';
import { selectAllTrucks } from '../trucks/trucks.selectors';
import { TruckHistoryEntry } from './history.state';
import { Truck } from '../../models/truck.model';

@Injectable()
export class HistoryEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadHistory),
      withLatestFrom(this.store.select(selectAllTrucks)),
      map(([_, trucks]) => {
        try {
          const mockEntries = this.generateMockHistory(trucks);
          return HistoryActions.loadHistorySuccess({ entries: mockEntries });
        } catch (error: any) {
          return HistoryActions.loadHistoryFailure({ error: error.message || 'Failed to generate history' });
        }
      }),
      catchError((error) =>
        of(HistoryActions.loadHistoryFailure({ error: error.message || 'Failed to load history' }))
      )
    )
  );

  private generateMockHistory(trucks: Truck[]): TruckHistoryEntry[] {
    const mockData: TruckHistoryEntry[] = [];
    const now = new Date();

    trucks.forEach(truck => {
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 min intervals
        mockData.push({
          truckId: truck.truckId,
          timestamp,
          latitude: (truck.currentLatitude || 40.7128) + (Math.random() - 0.5) * 0.1,
          longitude: (truck.currentLongitude || -74.0060) + (Math.random() - 0.5) * 0.1,
          speed: Math.random() * 80,
          heading: Math.random() * 360,
          status: Math.random() > 0.8 ? 'stopped' : 'moving'
        });
      }
    });

    return mockData;
  }
}

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as HistoryActions from './history.actions';
import { TruckHistoryEntry } from './history.state';
import { TruckService } from '../../services/truck.service';
import { GPSPosition } from '../../models/gps-position.model';

@Injectable()
export class HistoryEffects {
  private actions$ = inject(Actions);
  private truckService = inject(TruckService);

  /**
   * Load history with optional truckId (single API endpoint)
   * GET /location/v1/trucks/history?startTime=...&endTime=...&truckId=... (optional)
   */
  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadHistory),
      switchMap(({ startTime, endTime, truckId }) =>
        this.truckService.getTrucksHistory(startTime, endTime, truckId).pipe(
          map((positions: GPSPosition[]) => {
            const entries = this.mapPositionsToEntries(positions);
            // Sort by timestamp descending
            entries.sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            return HistoryActions.loadHistorySuccess({ entries });
          }),
          catchError((error) =>
            of(HistoryActions.loadHistoryFailure({
              error: error.message || 'Failed to load history'
            }))
          )
        )
      )
    )
  );

  /**
   * Map GPS positions from API to TruckHistoryEntry format
   */
  private mapPositionsToEntries(positions: GPSPosition[]): TruckHistoryEntry[] {
    return positions.map(pos => ({
      truckId: pos.truckId,
      timestamp: new Date(pos.timestamp),
      latitude: pos.latitude,
      longitude: pos.longitude,
      speed: pos.speed || 0,
      heading: pos.heading || 0,
      status: (pos.speed && pos.speed > 5) ? 'moving' : 'stopped'
    }));
  }
}

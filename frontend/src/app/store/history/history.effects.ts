import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import * as HistoryActions from './history.actions';
import { TruckHistoryEntry, HistoryState } from './history.state';
import { TruckService } from '../../services/truck.service';
import { GPSPosition } from '../../models/gps-position.model';
import { selectHistoryState } from './history.selectors';

@Injectable()
export class HistoryEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private truckService = inject(TruckService);

  /**
   * Load history with optional truckId (single API endpoint - legacy)
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

  // ============================================
  // Paginated History Effects (for infinite scroll)
  // ============================================

  /**
   * Load first page of history (paginated)
   */
  loadHistoryPaged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadHistoryPaged),
      switchMap(({ startTime, endTime, truckId, size }) =>
        this.truckService.getTrucksHistoryPaged(startTime, endTime, 0, size || 50, truckId).pipe(
          map(page => HistoryActions.loadHistoryPagedSuccess({ page, startTime, endTime, truckId })),
          catchError((error) =>
            of(HistoryActions.loadHistoryPagedFailure({
              error: error.message || 'Failed to load history'
            }))
          )
        )
      )
    )
  );

  /**
   * Load more history (infinite scroll)
   */
  loadMoreHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HistoryActions.loadMoreHistory),
      withLatestFrom(this.store.select(selectHistoryState)),
      filter(([_, state]) => state.hasMorePages && !state.loadingMore),
      switchMap(([_, state]) => {
        const nextPage = state.currentPage + 1;
        return this.truckService.getTrucksHistoryPaged(
          state.currentStartTime!,
          state.currentEndTime!,
          nextPage,
          50,
          state.currentTruckId
        ).pipe(
          map(page => HistoryActions.loadMoreHistorySuccess({ page })),
          catchError((error) =>
            of(HistoryActions.loadMoreHistoryFailure({
              error: error.message || 'Failed to load more history'
            }))
          )
        );
      })
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

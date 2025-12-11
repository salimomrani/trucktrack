import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GpsState } from './gps.state';

export const selectGpsState = createFeatureSelector<GpsState>('gps');

export const selectLatestPosition = createSelector(
  selectGpsState,
  (state) => state.latestPosition
);

export const selectAllPositions = createSelector(
  selectGpsState,
  (state) => state.positions
);

export const selectTruckPosition = (truckId: string) =>
  createSelector(
    selectAllPositions,
    (positions) => positions[truckId]
  );

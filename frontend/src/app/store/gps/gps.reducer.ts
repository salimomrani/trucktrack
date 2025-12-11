import { createReducer, on } from '@ngrx/store';
import * as GpsActions from './gps.actions';
import { initialGpsState } from './gps.state';

export const gpsReducer = createReducer(
  initialGpsState,

  on(GpsActions.addGpsPosition, (state, { position }) => ({
    ...state,
    latestPosition: position,
    positions: {
      ...state.positions,
      [position.truckId]: position
    }
  })),

  on(GpsActions.clearGpsPositions, () => initialGpsState)
);

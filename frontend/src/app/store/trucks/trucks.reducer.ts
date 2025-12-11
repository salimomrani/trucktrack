import { createReducer, on } from '@ngrx/store';
import * as TrucksActions from './trucks.actions';
import { trucksAdapter, initialTrucksState } from './trucks.state';

export const trucksReducer = createReducer(
  initialTrucksState,

  on(TrucksActions.loadTrucks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(TrucksActions.loadTrucksSuccess, (state, { trucks }) =>
    trucksAdapter.setAll(trucks, {
      ...state,
      loading: false
    })
  ),

  on(TrucksActions.loadTrucksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(TrucksActions.selectTruck, (state, { truckId }) => ({
    ...state,
    selectedTruckId: truckId
  })),

  on(TrucksActions.updateTruckPosition, (state, { truckId, latitude, longitude, speed, heading }) =>
    trucksAdapter.updateOne(
      {
        id: truckId,
        changes: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          currentSpeed: speed,
          currentHeading: heading,
          lastUpdate: new Date().toISOString()
        }
      },
      state
    )
  )
);

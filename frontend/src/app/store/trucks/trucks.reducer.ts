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

  on(TrucksActions.deselectTruck, (state) => ({
    ...state,
    selectedTruckId: null
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
  ),

  // Search Reducers
  on(TrucksActions.searchTrucks, (state) => ({
    ...state,
    isSearching: true
  })),

  on(TrucksActions.searchTrucksSuccess, (state, { results }) => ({
    ...state,
    searchResults: results,
    isSearching: false
  })),

  on(TrucksActions.searchTrucksFailure, (state, { error }) => ({
    ...state,
    isSearching: false,
    error
  })),

  on(TrucksActions.clearSearch, (state) => ({
    ...state,
    searchResults: [],
    isSearching: false
  }))
);

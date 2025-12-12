import { createAction, props } from '@ngrx/store';
import { Truck } from '../../models/truck.model';

export const loadTrucks = createAction('[Trucks] Load Trucks');

export const loadTrucksSuccess = createAction(
  '[Trucks] Load Trucks Success',
  props<{ trucks: Truck[] }>()
);

export const loadTrucksFailure = createAction(
  '[Trucks] Load Trucks Failure',
  props<{ error: string }>()
);

export const selectTruck = createAction(
  '[Trucks] Select Truck',
  props<{ truckId: string }>()
);

export const deselectTruck = createAction('[Trucks] Deselect Truck');

export const updateTruckPosition = createAction(
  '[Trucks] Update Truck Position',
  props<{ truckId: string; latitude: number; longitude: number; speed: number; heading: number }>()
);

// Search Actions
export const searchTrucks = createAction(
  '[Trucks] Search Trucks',
  props<{ query: string }>()
);

export const searchTrucksSuccess = createAction(
  '[Trucks] Search Trucks Success',
  props<{ results: Truck[] }>()
);

export const searchTrucksFailure = createAction(
  '[Trucks] Search Trucks Failure',
  props<{ error: string }>()
);

export const clearSearch = createAction('[Trucks] Clear Search');

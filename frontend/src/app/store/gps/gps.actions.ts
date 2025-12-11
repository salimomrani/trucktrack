import { createAction, props } from '@ngrx/store';
import { GPSPositionEvent } from '../../models/gps-position.model';

export const addGpsPosition = createAction(
  '[GPS] Add Position',
  props<{ position: GPSPositionEvent }>()
);

export const clearGpsPositions = createAction('[GPS] Clear Positions');

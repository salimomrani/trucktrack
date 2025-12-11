import { GPSPositionEvent } from '../../models/gps-position.model';

export interface GpsState {
  latestPosition: GPSPositionEvent | null;
  positions: { [truckId: string]: GPSPositionEvent };
}

export const initialGpsState: GpsState = {
  latestPosition: null,
  positions: {}
};

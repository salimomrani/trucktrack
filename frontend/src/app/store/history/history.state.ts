export interface TruckHistoryEntry {
  truckId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
}

export interface HistoryState {
  entries: TruckHistoryEntry[];
  loading: boolean;
  error: string | null;
}

export const initialHistoryState: HistoryState = {
  entries: [],
  loading: false,
  error: null
};

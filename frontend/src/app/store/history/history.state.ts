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
  // Pagination state for infinite scroll
  currentPage: number;
  totalElements: number;
  totalPages: number;
  hasMorePages: boolean;
  loadingMore: boolean;
  // Query params for loading more
  currentStartTime: string | null;
  currentEndTime: string | null;
  currentTruckId: string | null;
}

export const initialHistoryState: HistoryState = {
  entries: [],
  loading: false,
  error: null,
  // Pagination defaults
  currentPage: 0,
  totalElements: 0,
  totalPages: 0,
  hasMorePages: true,
  loadingMore: false,
  currentStartTime: null,
  currentEndTime: null,
  currentTruckId: null
};

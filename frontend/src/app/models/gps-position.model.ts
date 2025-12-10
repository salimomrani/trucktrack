/**
 * GPS Position model interface
 * T076: Create GPSPosition model interface
 */
export interface GPSPosition {
  eventId?: string;
  truckId: string;
  truckIdReadable?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  satellites?: number;
  timestamp: string; // ISO 8601 timestamp
  ingestedAt?: string;
}

export interface GPSPositionEvent extends GPSPosition {
  // WebSocket event format (same as GPSPosition)
}

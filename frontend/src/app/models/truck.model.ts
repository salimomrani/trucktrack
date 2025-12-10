/**
 * Truck model interface
 * T075: Create Truck model interface
 */
export interface Truck {
  id: string;
  truckId: string;
  licensePlate?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleType: string;
  status: TruckStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  currentSpeed?: number;
  currentHeading?: number;
  lastUpdate?: string; // ISO 8601 timestamp
  truckGroupId: string;
  createdAt: string;
  updatedAt: string;
}

export enum TruckStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  OFFLINE = 'OFFLINE'
}

export interface TruckListResponse {
  content: Truck[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

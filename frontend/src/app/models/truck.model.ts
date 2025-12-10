/**
 * Truck model interface
 * T075: Create Truck model interface
 */
export interface Truck {
  id: string;
  truckIdReadable: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  driverName?: string;
  driverPhone?: string;
  status: TruckStatus;
  lastLatitude?: number;
  lastLongitude?: number;
  lastSpeed?: number;
  lastHeading?: number;
  lastUpdate?: string; // ISO 8601 timestamp
  truckGroupId: string;
  isActive: boolean;
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

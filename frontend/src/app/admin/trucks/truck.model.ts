/**
 * Truck admin interfaces.
 * T069: Create Truck admin interfaces
 * Feature: 002-admin-panel
 */

export type TruckStatus = 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface TruckAdminResponse {
  id: string;
  truckId: string;
  licensePlate: string | null;
  vehicleType: string;
  driverName: string | null;
  driverPhone: string | null;
  driverId: string | null;
  status: TruckStatus;
  statusDisplay: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentSpeed: number | null;
  currentHeading: number | null;
  lastUpdate: string | null;
  primaryGroupId: string;
  primaryGroupName: string;
  groupCount: number;
  groups: GroupInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface DriverOption {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface GroupInfo {
  id: string;
  name: string;
}

export interface CreateTruckRequest {
  truckId: string;
  licensePlate?: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
  primaryGroupId: string;
  additionalGroupIds?: string[];
}

export interface UpdateTruckRequest {
  licensePlate?: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Status display configuration
export const TRUCK_STATUS_LABELS: { [key in TruckStatus]: string } = {
  ACTIVE: 'Active',
  IDLE: 'Idle',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Maintenance',
  OUT_OF_SERVICE: 'Out of Service'
};

export const TRUCK_STATUS_COLORS: { [key in TruckStatus]: string } = {
  ACTIVE: '#4caf50',
  IDLE: '#ff9800',
  OFFLINE: '#9e9e9e',
  MAINTENANCE: '#2196f3',
  OUT_OF_SERVICE: '#f44336'
};

export const TRUCK_STATUSES = [
  { value: 'ACTIVE' as TruckStatus, label: 'Active', color: '#4caf50' },
  { value: 'IDLE' as TruckStatus, label: 'Idle', color: '#ff9800' },
  { value: 'OFFLINE' as TruckStatus, label: 'Offline', color: '#9e9e9e' },
  { value: 'MAINTENANCE' as TruckStatus, label: 'Maintenance', color: '#2196f3' },
  { value: 'OUT_OF_SERVICE' as TruckStatus, label: 'Out of Service', color: '#f44336' }
];

export const VEHICLE_TYPES = [
  'Semi-Trailer',
  'Box Truck',
  'Flatbed',
  'Tanker',
  'Refrigerated',
  'Van',
  'Pickup',
  'Other'
];

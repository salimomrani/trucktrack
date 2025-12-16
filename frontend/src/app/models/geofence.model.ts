/**
 * Geofence model
 * T154: Frontend geofence drawing UI
 */

export enum GeofenceZoneType {
  DEPOT = 'DEPOT',
  DELIVERY_AREA = 'DELIVERY_AREA',
  RESTRICTED_ZONE = 'RESTRICTED_ZONE',
  CUSTOM = 'CUSTOM'
}

export interface Geofence {
  id?: string;
  name: string;
  description?: string;
  zoneType: GeofenceZoneType;
  coordinates: number[][]; // [longitude, latitude] pairs
  radiusMeters?: number;
  centerLatitude?: number;
  centerLongitude?: number;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeofenceCheckResult {
  inside: boolean;
  geofences: Geofence[];
}

export interface PointCheckResult {
  inside: boolean;
  distanceMeters: number;
}

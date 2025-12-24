/**
 * Driver Mobile App - Entity Types
 * Based on data-model.md specification
 */

// Driver Status enum
export type DriverStatusType = 'AVAILABLE' | 'IN_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';

// Trip Status enum
export type TripStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Message sender type
export type SenderType = 'DRIVER' | 'DISPATCH';

// Notification type
export type NotificationType = 'ALERT' | 'GEOFENCE' | 'MESSAGE' | 'SYSTEM';

// Theme preference
export type ThemeType = 'LIGHT' | 'DARK' | 'SYSTEM';

// Map type preference
export type MapTypePreference = 'STANDARD' | 'SATELLITE' | 'HYBRID';

/**
 * Driver session stored locally
 */
export interface DriverSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  truckId?: string;
  truckName?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  createdAt: number; // Unix timestamp
}

/**
 * Driver status with sync info
 */
export interface DriverStatus {
  status: DriverStatusType;
  updatedAt: string; // ISO date string
  syncedAt?: string; // ISO date string
  pendingSync: boolean;
}

/**
 * GPS Position data point
 */
export interface GPSPosition {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  timestamp: string; // ISO date string
  synced: boolean;
  syncedAt?: string;
}

/**
 * Trip assigned to driver
 */
export interface Trip {
  id: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  clientName: string;
  clientPhone?: string;
  scheduledTime: string; // ISO date string
  status: TripStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cachedAt?: string;
}

/**
 * Message between driver and dispatch
 */
export interface Message {
  id: string;
  senderId: string;
  senderType: SenderType;
  senderName?: string;
  content: string;
  timestamp: string; // ISO date string
  isRead: boolean;
  synced: boolean;
  syncedAt?: string;
}

/**
 * Push notification received
 */
export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  receivedAt: string; // ISO date string
  isRead: boolean;
  actionUrl?: string;
}

/**
 * App settings
 */
export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  language: 'fr' | 'en';
  theme: ThemeType;
  mapType: MapTypePreference;
  lastSyncAt?: string;
}

/**
 * Driver profile (from API)
 */
export interface DriverProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DRIVER';
  truckId?: string;
  truckName?: string;
  isActive: boolean;
}

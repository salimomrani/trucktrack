/**
 * Driver Mobile App - Configuration Constants
 */

// Determine if we're in development mode
declare const __DEV__: boolean;

export const Config = {
  // API Configuration
  API_BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://api.trucktrack.com',
  API_TIMEOUT: 30000, // 30 seconds

  // GPS Configuration
  GPS_INTERVAL_ACTIVE: 10000, // 10 seconds when AVAILABLE or IN_DELIVERY
  GPS_INTERVAL_LOW_BATTERY: 30000, // 30 seconds when battery < 15%
  GPS_BATCH_SIZE: 3, // Send after 3 positions accumulated
  GPS_SYNC_INTERVAL: 30000, // Sync every 30 seconds
  GPS_MIN_ACCURACY: 100, // Minimum accuracy in meters to accept position

  // Session Configuration
  SESSION_TIMEOUT_DAYS: 7,
  TOKEN_REFRESH_THRESHOLD: 300, // Refresh token 5 minutes before expiry

  // Cache Configuration
  TRIP_CACHE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  MESSAGE_CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  STALE_DATA_WARNING_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours

  // Battery Configuration
  LOW_BATTERY_THRESHOLD: 15, // 15%

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MESSAGES_PAGE_SIZE: 50,

  // Retry Configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second, exponential backoff

  // App Info
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',
} as const;

export const StatusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_DELIVERY: 'En livraison',
  ON_BREAK: 'En pause',
  OFF_DUTY: 'Hors service',
};

export const StatusColors: Record<string, string> = {
  AVAILABLE: '#4CAF50', // Green
  IN_DELIVERY: '#2196F3', // Blue
  ON_BREAK: '#FF9800', // Orange
  OFF_DUTY: '#9E9E9E', // Grey
};

export const TripStatusLabels: Record<string, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const TripStatusColors: Record<string, string> = {
  PENDING: '#FF9800', // Orange
  IN_PROGRESS: '#2196F3', // Blue
  COMPLETED: '#4CAF50', // Green
  CANCELLED: '#F44336', // Red
};

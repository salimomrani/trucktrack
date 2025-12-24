/**
 * GPS Tracking Service
 * Background location tracking with battery optimization
 */

import BackgroundGeolocation, {
  Location,
  State,
  Config,
  LocationError,
} from 'react-native-background-geolocation';
import { Config as AppConfig } from '@constants/config';
import { api } from '@services/api/client';
import type { GPSPosition } from '@types/entities';

// Types
export interface GPSConfig {
  desiredAccuracy: number;
  distanceFilter: number;
  stopOnTerminate: boolean;
  startOnBoot: boolean;
  debug: boolean;
  logLevel: number;
}

export interface GPSServiceState {
  isTracking: boolean;
  lastPosition: GPSPosition | null;
  error: string | null;
}

// Default configuration
const DEFAULT_CONFIG: Config = {
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
  distanceFilter: 10, // meters
  stopOnTerminate: false,
  startOnBoot: true,
  debug: __DEV__,
  logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF,

  // Activity Recognition
  stopTimeout: 5,

  // HTTP Configuration (backup)
  url: `${AppConfig.API_BASE_URL}/locations`,
  batchSync: true,
  autoSync: true,
  maxBatchSize: 50,

  // Application config
  notification: {
    title: 'TruckTrack',
    text: 'Tracking your location',
    channelName: 'Location Tracking',
  },

  // iOS specific
  locationAuthorizationRequest: 'Always',
  backgroundPermissionRationale: {
    title: 'Allow TruckTrack to access your location in the background?',
    message:
      'TruckTrack needs your location to track deliveries even when the app is closed.',
    positiveAction: 'Allow',
    negativeAction: 'Cancel',
  },
};

// Service state
let isInitialized = false;
let isTracking = false;
let positionCallbacks: ((position: GPSPosition) => void)[] = [];
let errorCallbacks: ((error: string) => void)[] = [];

/**
 * Convert BackgroundGeolocation location to our GPSPosition type
 */
const toGPSPosition = (location: Location): GPSPosition => ({
  id: location.uuid,
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracy: location.coords.accuracy,
  speed: location.coords.speed ?? undefined,
  heading: location.coords.heading ?? undefined,
  timestamp: location.timestamp,
  synced: false,
});

/**
 * Initialize GPS service
 */
export const initializeGPS = async (): Promise<State> => {
  if (isInitialized) {
    return BackgroundGeolocation.getState();
  }

  // Configure the plugin
  const state = await BackgroundGeolocation.ready(DEFAULT_CONFIG);

  // Add location listener
  BackgroundGeolocation.onLocation(
    (location) => {
      const position = toGPSPosition(location);
      positionCallbacks.forEach((cb) => cb(position));

      // Send to server
      sendLocationToServer(position);
    },
    (error) => {
      console.error('Location error:', error);
      errorCallbacks.forEach((cb) => cb(error.message || 'Location error'));
    },
  );

  // Add motion change listener
  BackgroundGeolocation.onMotionChange((event) => {
    console.log('Motion changed:', event.isMoving ? 'moving' : 'stationary');
  });

  // Add provider change listener
  BackgroundGeolocation.onProviderChange((event) => {
    console.log('Provider changed:', event);
    if (!event.enabled) {
      errorCallbacks.forEach((cb) => cb('GPS disabled'));
    }
  });

  isInitialized = true;
  return state;
};

/**
 * Start GPS tracking
 */
export const startTracking = async (): Promise<void> => {
  if (!isInitialized) {
    await initializeGPS();
  }

  if (isTracking) {
    return;
  }

  await BackgroundGeolocation.start();
  isTracking = true;
  console.log('GPS tracking started');
};

/**
 * Stop GPS tracking
 */
export const stopTracking = async (): Promise<void> => {
  if (!isTracking) {
    return;
  }

  await BackgroundGeolocation.stop();
  isTracking = false;
  console.log('GPS tracking stopped');
};

/**
 * Get current position
 */
export const getCurrentPosition = async (): Promise<GPSPosition | null> => {
  try {
    const location = await BackgroundGeolocation.getCurrentPosition({
      timeout: 30,
      maximumAge: 5000,
      desiredAccuracy: 10,
      samples: 3,
    });
    return toGPSPosition(location);
  } catch (error) {
    console.error('Failed to get current position:', error);
    return null;
  }
};

/**
 * Check if tracking is active
 */
export const isTrackingActive = (): boolean => isTracking;

/**
 * Set tracking interval based on battery level
 */
export const setTrackingInterval = async (intervalMs: number): Promise<void> => {
  await BackgroundGeolocation.setConfig({
    locationUpdateInterval: intervalMs,
  });
};

/**
 * Enable battery optimization mode
 */
export const enableBatteryOptimization = async (): Promise<void> => {
  await BackgroundGeolocation.setConfig({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM,
    distanceFilter: 50,
    locationUpdateInterval: AppConfig.GPS_INTERVAL_LOW_BATTERY,
  });
};

/**
 * Disable battery optimization mode (high accuracy)
 */
export const disableBatteryOptimization = async (): Promise<void> => {
  await BackgroundGeolocation.setConfig({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 10,
    locationUpdateInterval: AppConfig.GPS_INTERVAL_ACTIVE,
  });
};

/**
 * Subscribe to position updates
 */
export const onPositionUpdate = (callback: (position: GPSPosition) => void): () => void => {
  positionCallbacks.push(callback);
  return () => {
    positionCallbacks = positionCallbacks.filter((cb) => cb !== callback);
  };
};

/**
 * Subscribe to errors
 */
export const onError = (callback: (error: string) => void): () => void => {
  errorCallbacks.push(callback);
  return () => {
    errorCallbacks = errorCallbacks.filter((cb) => cb !== callback);
  };
};

/**
 * Send location to server
 */
const sendLocationToServer = async (position: GPSPosition): Promise<void> => {
  try {
    await api.post('/locations', {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      timestamp: position.timestamp,
    });
    position.synced = true;
  } catch (error) {
    console.warn('Failed to send location to server:', error);
    // Location will be stored locally and synced later
  }
};

/**
 * Get pending locations that haven't been synced
 */
export const getPendingLocations = async (): Promise<GPSPosition[]> => {
  try {
    const locations = await BackgroundGeolocation.getLocations();
    return locations.map(toGPSPosition);
  } catch (error) {
    console.error('Failed to get pending locations:', error);
    return [];
  }
};

/**
 * Sync all pending locations
 */
export const syncPendingLocations = async (): Promise<number> => {
  try {
    const result = await BackgroundGeolocation.sync();
    return result.length;
  } catch (error) {
    console.error('Failed to sync locations:', error);
    return 0;
  }
};

/**
 * Clear all stored locations
 */
export const clearStoredLocations = async (): Promise<void> => {
  await BackgroundGeolocation.destroyLocations();
};

export default {
  initializeGPS,
  startTracking,
  stopTracking,
  getCurrentPosition,
  isTrackingActive,
  setTrackingInterval,
  enableBatteryOptimization,
  disableBatteryOptimization,
  onPositionUpdate,
  onError,
  getPendingLocations,
  syncPendingLocations,
  clearStoredLocations,
};

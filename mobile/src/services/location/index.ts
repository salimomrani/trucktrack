/**
 * Location Services Exports
 */

export {
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
} from './gpsService';

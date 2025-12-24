/**
 * GPS Tracking Hook
 * React hook for GPS tracking state and controls
 */

import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as gpsService from '@services/location/gpsService';
import { useStatusStore } from '@store/statusStore';
import { useSettingsStore } from '@store/settingsStore';
import type { GPSPosition } from '@types/entities';

export interface UseGPSTrackingResult {
  isTracking: boolean;
  currentPosition: GPSPosition | null;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  refreshPosition: () => Promise<void>;
}

export const useGPSTracking = (): UseGPSTrackingResult => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isGpsActive, setGpsActive } = useStatusStore();
  const { highAccuracyMode, batteryOptimization, gpsIntervalMs } = useSettingsStore();

  // Initialize GPS on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await gpsService.initializeGPS();

        // Subscribe to position updates
        const unsubPosition = gpsService.onPositionUpdate((position) => {
          setCurrentPosition(position);
          setError(null);
        });

        // Subscribe to errors
        const unsubError = gpsService.onError((err) => {
          setError(err);
        });

        return () => {
          unsubPosition();
          unsubError();
        };
      } catch (err: any) {
        setError(err.message || 'Failed to initialize GPS');
      }
    };

    initialize();
  }, []);

  // Sync tracking state with status store
  useEffect(() => {
    if (isGpsActive && !isTracking) {
      handleStartTracking();
    } else if (!isGpsActive && isTracking) {
      handleStopTracking();
    }
  }, [isGpsActive]);

  // Update GPS settings when preferences change
  useEffect(() => {
    const updateSettings = async () => {
      if (isTracking) {
        if (highAccuracyMode) {
          await gpsService.disableBatteryOptimization();
        } else if (batteryOptimization) {
          await gpsService.enableBatteryOptimization();
        }

        await gpsService.setTrackingInterval(gpsIntervalMs);
      }
    };

    updateSettings();
  }, [highAccuracyMode, batteryOptimization, gpsIntervalMs, isTracking]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isTracking) {
        // App came to foreground - refresh position
        refreshPosition();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isTracking]);

  const handleStartTracking = useCallback(async () => {
    try {
      setError(null);
      await gpsService.startTracking();
      setIsTracking(true);
      setGpsActive(true);

      // Get initial position
      const position = await gpsService.getCurrentPosition();
      if (position) {
        setCurrentPosition(position);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start tracking');
      setIsTracking(false);
      setGpsActive(false);
    }
  }, [setGpsActive]);

  const handleStopTracking = useCallback(async () => {
    try {
      await gpsService.stopTracking();
      setIsTracking(false);
      setGpsActive(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop tracking');
    }
  }, [setGpsActive]);

  const refreshPosition = useCallback(async () => {
    try {
      const position = await gpsService.getCurrentPosition();
      if (position) {
        setCurrentPosition(position);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get position');
    }
  }, []);

  return {
    isTracking,
    currentPosition,
    error,
    startTracking: handleStartTracking,
    stopTracking: handleStopTracking,
    refreshPosition,
  };
};

export default useGPSTracking;

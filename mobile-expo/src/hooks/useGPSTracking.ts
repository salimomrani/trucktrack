import { useEffect, useRef, useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { GPSService, GPSPosition } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface GPSTrackingState {
  isTracking: boolean;
  lastPosition: Location.LocationObject | null;
  lastSentAt: Date | null;
  error: string | null;
  positionsSent: number;
}

// Send GPS every 10 seconds when tracking is active
const TRACKING_INTERVAL = 10000;

// Buffer positions when offline
const MAX_BUFFER_SIZE = 100;

export function useGPSTracking(truckId: string | undefined) {
  const { status } = useAuthStore();
  const [state, setState] = useState<GPSTrackingState>({
    isTracking: false,
    lastPosition: null,
    lastSentAt: null,
    error: null,
    positionsSent: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionBufferRef = useRef<GPSPosition[]>([]);

  // Should track when status is AVAILABLE or IN_DELIVERY
  const shouldTrack = status === 'AVAILABLE' || status === 'IN_DELIVERY';

  const sendPosition = useCallback(async (location: Location.LocationObject) => {
    if (!truckId) return;

    const position: GPSPosition = {
      truckId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading ? Math.round(location.coords.heading) : undefined,
      accuracy: location.coords.accuracy || undefined,
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };

    try {
      await GPSService.sendPosition(position);
      setState(prev => ({
        ...prev,
        lastSentAt: new Date(),
        positionsSent: prev.positionsSent + 1,
        error: null,
      }));

      // If we have buffered positions, try to send them
      if (positionBufferRef.current.length > 0) {
        try {
          await GPSService.sendPositionBatch(positionBufferRef.current);
          positionBufferRef.current = [];
        } catch {
          // Keep buffer for next try
        }
      }
    } catch (error) {
      console.log('Failed to send GPS position:', error);

      // Buffer position for later
      if (positionBufferRef.current.length < MAX_BUFFER_SIZE) {
        positionBufferRef.current.push(position);
      }

      setState(prev => ({
        ...prev,
        error: 'Failed to send position',
      }));
    }
  }, [truckId]);

  const trackPosition = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setState(prev => ({
        ...prev,
        lastPosition: location,
      }));

      await sendPosition(location);
    } catch (error) {
      console.log('Failed to get location:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to get location',
      }));
    }
  }, [sendPosition]);

  // Start/stop tracking based on status
  useEffect(() => {
    if (shouldTrack && truckId) {
      // Start tracking
      setState(prev => ({ ...prev, isTracking: true, error: null }));

      // Get initial position
      trackPosition();

      // Set up interval
      intervalRef.current = setInterval(trackPosition, TRACKING_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState(prev => ({ ...prev, isTracking: false }));
      };
    } else {
      // Stop tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, [shouldTrack, truckId, trackPosition]);

  return state;
}

export default useGPSTracking;

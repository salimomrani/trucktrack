/**
 * Settings Store
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@constants/config';

export interface SettingsState {
  // GPS Settings
  gpsIntervalMs: number;
  highAccuracyMode: boolean;
  batteryOptimization: boolean;

  // Notification Settings
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;

  // Offline Settings
  offlineModeEnabled: boolean;
  autoSyncWhenOnline: boolean;
  maxOfflinePositions: number;

  // Display Settings
  darkMode: boolean;
  language: 'en' | 'fr';
  distanceUnit: 'km' | 'mi';

  // Actions
  setGpsInterval: (intervalMs: number) => void;
  setHighAccuracyMode: (enabled: boolean) => void;
  setBatteryOptimization: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setOfflineModeEnabled: (enabled: boolean) => void;
  setAutoSyncWhenOnline: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setLanguage: (language: 'en' | 'fr') => void;
  setDistanceUnit: (unit: 'km' | 'mi') => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  // GPS defaults
  gpsIntervalMs: Config.GPS_INTERVAL_ACTIVE,
  highAccuracyMode: true,
  batteryOptimization: true,

  // Notification defaults
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,

  // Offline defaults
  offlineModeEnabled: true,
  autoSyncWhenOnline: true,
  maxOfflinePositions: Config.MAX_OFFLINE_POSITIONS,

  // Display defaults
  darkMode: false,
  language: 'en' as const,
  distanceUnit: 'km' as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      // GPS actions
      setGpsInterval: (intervalMs: number) => set({ gpsIntervalMs: intervalMs }),
      setHighAccuracyMode: (enabled: boolean) => set({ highAccuracyMode: enabled }),
      setBatteryOptimization: (enabled: boolean) => set({ batteryOptimization: enabled }),

      // Notification actions
      setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled: boolean) => set({ vibrationEnabled: enabled }),

      // Offline actions
      setOfflineModeEnabled: (enabled: boolean) => set({ offlineModeEnabled: enabled }),
      setAutoSyncWhenOnline: (enabled: boolean) => set({ autoSyncWhenOnline: enabled }),

      // Display actions
      setDarkMode: (enabled: boolean) => set({ darkMode: enabled }),
      setLanguage: (language: 'en' | 'fr') => set({ language }),
      setDistanceUnit: (unit: 'km' | 'mi') => set({ distanceUnit: unit }),

      // Reset
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

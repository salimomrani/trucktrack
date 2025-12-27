import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // Primary
  primary: string;
  primaryLight: string;

  // Status
  success: string;
  warning: string;
  error: string;

  // Borders & Dividers
  border: string;
  divider: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;

  // Status bar
  statusBarStyle: 'light' | 'dark';
}

const lightColors: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',

  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',

  primary: '#1976D2',
  primaryLight: '#1976D220',

  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',

  border: '#eeeeee',
  divider: '#e0e0e0',

  inputBackground: '#ffffff',
  inputBorder: '#eeeeee',
  placeholder: '#999999',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#eeeeee',

  statusBarStyle: 'dark',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',

  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textMuted: '#808080',

  primary: '#64B5F6',
  primaryLight: '#64B5F620',

  success: '#4CAF50',
  warning: '#FFB74D',
  error: '#EF5350',

  border: '#404040',
  divider: '#333333',

  inputBackground: '#2d2d2d',
  inputBorder: '#404040',
  placeholder: '#808080',

  tabBarBackground: '#1e1e1e',
  tabBarBorder: '#333333',

  statusBarStyle: 'light',
};

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      colors: lightColors,
      isDark: false,

      toggleTheme: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light';
        set({
          mode: newMode,
          colors: newMode === 'dark' ? darkColors : lightColors,
          isDark: newMode === 'dark',
        });
      },

      setTheme: (mode: ThemeMode) => {
        set({
          mode,
          colors: mode === 'dark' ? darkColors : lightColors,
          isDark: mode === 'dark',
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore colors based on persisted mode
          const colors = state.mode === 'dark' ? darkColors : lightColors;
          state.colors = colors;
          state.isDark = state.mode === 'dark';
        }
      },
    }
  )
);

// Hook to get theme colors easily
export const useThemeColors = () => useThemeStore((state) => state.colors);
export const useIsDarkMode = () => useThemeStore((state) => state.isDark);

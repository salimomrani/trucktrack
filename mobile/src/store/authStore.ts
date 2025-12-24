/**
 * Authentication Store
 * Manages user session state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DriverSession } from '@types/entities';
import * as authService from '@services/auth/authService';
import type { LoginRequest } from '@types/api';

export interface AuthState {
  // State
  session: DriverSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
  setSession: (session: DriverSession | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Login action
      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const session = await authService.login(credentials);
          set({
            session,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          const message = error?.response?.data?.message || error.message || 'Login failed';
          set({
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      // Logout action
      logout: async (): Promise<void> => {
        set({ isLoading: true });

        try {
          await authService.logout();
        } catch (error) {
          console.warn('Logout error:', error);
        } finally {
          set({
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Restore session on app launch
      restoreSession: async (): Promise<void> => {
        set({ isLoading: true });

        try {
          const session = await authService.restoreSession();
          set({
            session,
            isAuthenticated: session !== null,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.warn('Session restore error:', error);
          set({
            session: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set session directly (for token refresh)
      setSession: (session: DriverSession | null) =>
        set({
          session,
          isAuthenticated: session !== null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist minimal session info
        // Actual tokens are in secure keychain
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

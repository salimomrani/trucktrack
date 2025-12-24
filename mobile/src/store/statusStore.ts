/**
 * Driver Status Store
 * Manages driver status state and GPS tracking state
 */

import { create } from 'zustand';
import type { DriverStatus, DriverStatusType } from '@types/entities';
import * as statusService from '@services/auth/statusService';

export interface StatusState {
  // State
  currentStatus: DriverStatus | null;
  isLoading: boolean;
  error: string | null;
  isGpsActive: boolean;
  lastSyncTime: number | null;

  // Actions
  fetchStatus: () => Promise<void>;
  updateStatus: (status: DriverStatusType) => Promise<boolean>;
  setGpsActive: (active: boolean) => void;
  clearError: () => void;
  setOfflineStatus: (status: DriverStatusType) => void;
}

export const useStatusStore = create<StatusState>()((set, get) => ({
  // Initial state
  currentStatus: null,
  isLoading: false,
  error: null,
  isGpsActive: false,
  lastSyncTime: null,

  // Fetch current status from server
  fetchStatus: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const status = await statusService.getStatus();
      set({
        currentStatus: status,
        isLoading: false,
        lastSyncTime: Date.now(),
      });

      // Auto-enable GPS for active statuses
      if (statusService.requiresGpsTracking(status.status)) {
        set({ isGpsActive: true });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to fetch status';
      set({
        isLoading: false,
        error: message,
      });
    }
  },

  // Update driver status
  updateStatus: async (status: DriverStatusType): Promise<boolean> => {
    const { currentStatus } = get();

    // Validate transition
    if (currentStatus && !statusService.isValidTransition(currentStatus.status, status)) {
      set({ error: 'Invalid status transition' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const updatedStatus = await statusService.updateStatus(status);
      set({
        currentStatus: updatedStatus,
        isLoading: false,
        lastSyncTime: Date.now(),
        // Update GPS tracking based on new status
        isGpsActive: statusService.requiresGpsTracking(status),
      });
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to update status';
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  // Set GPS tracking state
  setGpsActive: (active: boolean) => set({ isGpsActive: active }),

  // Clear error
  clearError: () => set({ error: null }),

  // Set status when offline (will sync later)
  setOfflineStatus: (status: DriverStatusType) => {
    const { currentStatus } = get();
    if (currentStatus) {
      set({
        currentStatus: {
          ...currentStatus,
          status,
          pendingSync: true,
        },
      });
    }
  },
}));

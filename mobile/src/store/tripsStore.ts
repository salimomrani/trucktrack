/**
 * Trips Store
 * Manages assigned trips and delivery state
 */

import { create } from 'zustand';
import type { Trip, TripStatus } from '@types/entities';
import { api } from '@services/api/client';

export interface TripsState {
  // State
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;

  // Actions
  fetchTrips: () => Promise<void>;
  fetchTripById: (tripId: string) => Promise<Trip | null>;
  setActiveTrip: (trip: Trip | null) => void;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<boolean>;
  refreshTrips: () => Promise<void>;
  clearError: () => void;
}

export const useTripsStore = create<TripsState>()((set, get) => ({
  // Initial state
  trips: [],
  activeTrip: null,
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // Fetch all assigned trips
  fetchTrips: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ content: Trip[] }>('/drivers/me/trips');
      const trips = response.content || [];

      // Find active trip (IN_PROGRESS status)
      const activeTrip = trips.find((t) => t.status === 'IN_PROGRESS') || null;

      set({
        trips,
        activeTrip,
        isLoading: false,
        lastSyncTime: Date.now(),
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to fetch trips';
      set({
        isLoading: false,
        error: message,
      });
    }
  },

  // Fetch single trip by ID
  fetchTripById: async (tripId: string): Promise<Trip | null> => {
    try {
      const trip = await api.get<Trip>(`/trips/${tripId}`);
      return trip;
    } catch (error: any) {
      console.error('Failed to fetch trip:', error);
      return null;
    }
  },

  // Set active trip
  setActiveTrip: (trip: Trip | null) => set({ activeTrip: trip }),

  // Update trip status
  updateTripStatus: async (tripId: string, status: TripStatus): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const updatedTrip = await api.put<Trip>(`/trips/${tripId}/status`, { status });

      // Update in trips list
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? updatedTrip : t)),
        activeTrip: state.activeTrip?.id === tripId ? updatedTrip : state.activeTrip,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update trip status';
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  // Refresh trips (pull to refresh)
  refreshTrips: async (): Promise<void> => {
    await get().fetchTrips();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

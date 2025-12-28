/**
 * Proof of Delivery Store using Zustand
 * Feature: 015-proof-of-delivery
 *
 * Manages POD state including current capture session,
 * sync status, and offline queue.
 */

import { create } from 'zustand';
import {
  PendingProof,
  SyncStatus,
  getPendingProofs,
  getSyncStatus,
  addSyncListener,
  syncPendingProofs,
  createProofWithOfflineSupport,
  startNetworkListener,
  stopNetworkListener,
  clearOfflineData,
} from '../services/offlineStorage';
import { ProofOfDeliveryService, ProofResponse, CreateProofRequest, ProofStatus } from '../services/api';

// Types for the capture session
export interface CapturePhoto {
  uri: string;
  base64: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
}

export interface CaptureSession {
  tripId: string;
  signature: string | null;
  signerName: string;
  photos: CapturePhoto[];
  latitude: number | null;
  longitude: number | null;
  gpsAccuracy: number | null;
  status: ProofStatus;
  refusalReason: string;
}

interface PodState {
  // Current capture session
  captureSession: CaptureSession | null;
  isCapturing: boolean;
  isSaving: boolean;
  saveError: string | null;

  // Offline queue
  pendingProofs: PendingProof[];
  syncStatus: SyncStatus;

  // Cached proofs for display
  tripProofs: Map<string, ProofResponse>;

  // Actions - Session management
  startCapture: (tripId: string) => void;
  cancelCapture: () => void;

  // Actions - Signature
  setSignature: (signature: string) => void;
  clearSignature: () => void;

  // Actions - Photos
  addPhoto: (photo: CapturePhoto) => void;
  removePhoto: (index: number) => void;

  // Actions - Metadata
  setSignerName: (name: string) => void;
  setLocation: (lat: number, lng: number, accuracy: number) => void;
  setStatus: (status: ProofStatus) => void;
  setRefusalReason: (reason: string) => void;

  // Actions - Submission
  submitProof: (signatureOverride?: string) => Promise<{ success: boolean; isOffline: boolean; error?: string }>;

  // Actions - Sync
  refreshPendingProofs: () => Promise<void>;
  triggerSync: () => Promise<{ synced: number; failed: number }>;

  // Actions - Fetch
  fetchProofForTrip: (tripId: string) => Promise<ProofResponse | null>;

  // Actions - Lifecycle
  initialize: () => void;
  cleanup: () => void;
}

const initialSyncStatus: SyncStatus = {
  lastSyncAt: null,
  pendingCount: 0,
  isSyncing: false,
};

export const usePodStore = create<PodState>((set, get) => ({
  // Initial state
  captureSession: null,
  isCapturing: false,
  isSaving: false,
  saveError: null,
  pendingProofs: [],
  syncStatus: initialSyncStatus,
  tripProofs: new Map(),

  // Session management
  startCapture: (tripId: string) => {
    set({
      captureSession: {
        tripId,
        signature: null,
        signerName: '',
        photos: [],
        latitude: null,
        longitude: null,
        gpsAccuracy: null,
        status: 'SIGNED',
        refusalReason: '',
      },
      isCapturing: true,
      saveError: null,
    });
  },

  cancelCapture: () => {
    set({
      captureSession: null,
      isCapturing: false,
      saveError: null,
    });
  },

  // Signature
  setSignature: (signature: string) => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: { ...session, signature },
      });
    }
  },

  clearSignature: () => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: { ...session, signature: null },
      });
    }
  },

  // Photos
  addPhoto: (photo: CapturePhoto) => {
    const session = get().captureSession;
    if (session && session.photos.length < 3) {
      set({
        captureSession: {
          ...session,
          photos: [...session.photos, photo],
        },
      });
    }
  },

  removePhoto: (index: number) => {
    const session = get().captureSession;
    if (session) {
      const photos = [...session.photos];
      photos.splice(index, 1);
      set({
        captureSession: { ...session, photos },
      });
    }
  },

  // Metadata
  setSignerName: (name: string) => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: { ...session, signerName: name },
      });
    }
  },

  setLocation: (lat: number, lng: number, accuracy: number) => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: {
          ...session,
          latitude: lat,
          longitude: lng,
          gpsAccuracy: accuracy,
        },
      });
    }
  },

  setStatus: (status: ProofStatus) => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: { ...session, status },
      });
    }
  },

  setRefusalReason: (reason: string) => {
    const session = get().captureSession;
    if (session) {
      set({
        captureSession: { ...session, refusalReason: reason },
      });
    }
  },

  // Submission
  submitProof: async (signatureOverride?: string) => {
    const session = get().captureSession;
    if (!session) {
      return { success: false, isOffline: false, error: 'No active capture session' };
    }

    // Use override signature if provided, otherwise use session signature
    const signature = signatureOverride || session.signature;

    // Validation
    if (!signature) {
      return { success: false, isOffline: false, error: 'Signature is required' };
    }
    if (session.latitude === null || session.longitude === null) {
      return { success: false, isOffline: false, error: 'Location is required' };
    }
    if (session.status === 'REFUSED' && !session.refusalReason.trim()) {
      return { success: false, isOffline: false, error: 'Refusal reason is required' };
    }

    set({ isSaving: true, saveError: null });

    try {
      // Build request
      const request: CreateProofRequest = {
        status: session.status,
        signatureImage: signature,
        signerName: session.signerName || undefined,
        refusalReason: session.status === 'REFUSED' ? session.refusalReason : undefined,
        latitude: session.latitude,
        longitude: session.longitude,
        gpsAccuracy: session.gpsAccuracy || 10,
        capturedAt: new Date().toISOString(),
        photos: session.photos.map((photo, index) => ({
          photoImage: photo.base64,
          latitude: photo.latitude,
          longitude: photo.longitude,
          capturedAt: photo.capturedAt,
        })),
      };

      // Submit with offline support
      const result = await createProofWithOfflineSupport(session.tripId, request);

      if (result.success) {
        // Cache the proof if we got one back
        if (result.proof) {
          const tripProofs = new Map(get().tripProofs);
          tripProofs.set(session.tripId, result.proof);
          set({ tripProofs });
        }

        // Clear session
        set({
          captureSession: null,
          isCapturing: false,
          isSaving: false,
        });

        // Refresh pending count
        await get().refreshPendingProofs();

        return { success: true, isOffline: result.isOffline };
      }

      return { success: false, isOffline: false, error: 'Failed to save proof' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ isSaving: false, saveError: errorMessage });
      return { success: false, isOffline: false, error: errorMessage };
    }
  },

  // Sync
  refreshPendingProofs: async () => {
    const [proofs, status] = await Promise.all([
      getPendingProofs(),
      getSyncStatus(),
    ]);
    set({ pendingProofs: proofs, syncStatus: status });
  },

  triggerSync: async () => {
    const result = await syncPendingProofs();
    await get().refreshPendingProofs();
    return result;
  },

  // Fetch
  fetchProofForTrip: async (tripId: string) => {
    // Check cache first
    const cached = get().tripProofs.get(tripId);
    if (cached) {
      return cached;
    }

    try {
      const proof = await ProofOfDeliveryService.getProofByTripId(tripId);
      if (proof) {
        const tripProofs = new Map(get().tripProofs);
        tripProofs.set(tripId, proof);
        set({ tripProofs });
      }
      return proof;
    } catch (error) {
      console.log('Error fetching proof for trip:', tripId, error);
      return null;
    }
  },

  // Lifecycle
  initialize: () => {
    // Start network listener for auto-sync
    startNetworkListener();

    // Subscribe to sync status changes
    addSyncListener((status) => {
      set({ syncStatus: status });
    });

    // Load initial data
    get().refreshPendingProofs();
  },

  cleanup: () => {
    stopNetworkListener();
  },
}));

export default usePodStore;

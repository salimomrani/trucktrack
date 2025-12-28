/**
 * Offline Storage Service for Proof of Delivery
 * Feature: 015-proof-of-delivery
 *
 * Handles local persistence of POD data when offline
 * and syncs with backend when connection is restored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { ProofOfDeliveryService, CreateProofRequest, ProofResponse } from './api';

// Storage keys
const PENDING_PROOFS_KEY = 'pod_pending_proofs';
const SYNC_STATUS_KEY = 'pod_sync_status';

// Types
export interface PendingProof {
  id: string; // Local UUID
  tripId: string;
  request: CreateProofRequest;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  lastError?: string;
}

// Sync listeners
type SyncListener = (status: SyncStatus) => void;
const syncListeners: Set<SyncListener> = new Set();

/**
 * Generate a local UUID for pending proofs
 */
function generateLocalId(): string {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all pending proofs from local storage
 */
export async function getPendingProofs(): Promise<PendingProof[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_PROOFS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading pending proofs:', error);
    return [];
  }
}

/**
 * Save a proof for later sync (when offline)
 */
export async function savePendingProof(
  tripId: string,
  request: CreateProofRequest
): Promise<PendingProof> {
  const pendingProof: PendingProof = {
    id: generateLocalId(),
    tripId,
    request,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  const proofs = await getPendingProofs();
  proofs.push(pendingProof);
  await AsyncStorage.setItem(PENDING_PROOFS_KEY, JSON.stringify(proofs));

  await updateSyncStatus({ pendingCount: proofs.length });
  notifyListeners();

  return pendingProof;
}

/**
 * Remove a pending proof after successful sync
 */
export async function removePendingProof(localId: string): Promise<void> {
  const proofs = await getPendingProofs();
  const filtered = proofs.filter(p => p.id !== localId);
  await AsyncStorage.setItem(PENDING_PROOFS_KEY, JSON.stringify(filtered));

  await updateSyncStatus({ pendingCount: filtered.length });
  notifyListeners();
}

/**
 * Update retry count and error for a failed proof
 */
export async function updatePendingProofError(
  localId: string,
  error: string
): Promise<void> {
  const proofs = await getPendingProofs();
  const index = proofs.findIndex(p => p.id === localId);

  if (index !== -1) {
    proofs[index].retryCount += 1;
    proofs[index].lastError = error;
    await AsyncStorage.setItem(PENDING_PROOFS_KEY, JSON.stringify(proofs));
  }
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const data = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading sync status:', error);
  }

  return {
    lastSyncAt: null,
    pendingCount: 0,
    isSyncing: false,
  };
}

/**
 * Update sync status
 */
async function updateSyncStatus(partial: Partial<SyncStatus>): Promise<void> {
  const current = await getSyncStatus();
  const updated = { ...current, ...partial };
  await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
}

/**
 * Notify all sync listeners of status change
 */
function notifyListeners(): void {
  getSyncStatus().then(status => {
    syncListeners.forEach(listener => listener(status));
  });
}

/**
 * Subscribe to sync status changes
 */
export function addSyncListener(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Sync a single pending proof
 */
async function syncProof(proof: PendingProof): Promise<boolean> {
  try {
    await ProofOfDeliveryService.createProof(proof.tripId, proof.request);
    await removePendingProof(proof.id);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updatePendingProofError(proof.id, errorMessage);
    return false;
  }
}

/**
 * Sync all pending proofs
 * Called when connection is restored
 */
export async function syncPendingProofs(): Promise<{
  synced: number;
  failed: number;
}> {
  const online = await isOnline();
  if (!online) {
    return { synced: 0, failed: 0 };
  }

  await updateSyncStatus({ isSyncing: true, lastError: undefined });
  notifyListeners();

  const proofs = await getPendingProofs();
  let synced = 0;
  let failed = 0;

  // Max 3 retries per proof
  const MAX_RETRIES = 3;
  const proofsToSync = proofs.filter(p => p.retryCount < MAX_RETRIES);

  for (const proof of proofsToSync) {
    const success = await syncProof(proof);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  await updateSyncStatus({
    isSyncing: false,
    lastSyncAt: new Date().toISOString(),
    lastError: failed > 0 ? `${failed} proof(s) failed to sync` : undefined,
  });
  notifyListeners();

  return { synced, failed };
}

/**
 * Create a proof with offline support
 * Tries to send immediately if online, otherwise saves for later sync
 */
export async function createProofWithOfflineSupport(
  tripId: string,
  request: CreateProofRequest
): Promise<{
  success: boolean;
  proof?: ProofResponse;
  pendingId?: string;
  isOffline: boolean;
}> {
  const online = await isOnline();

  if (online) {
    try {
      const proof = await ProofOfDeliveryService.createProof(tripId, request);
      return { success: true, proof, isOffline: false };
    } catch (error) {
      // Network error during request - save for later
      console.log('Failed to create proof online, saving for offline sync:', error);
      const pending = await savePendingProof(tripId, request);
      return { success: true, pendingId: pending.id, isOffline: true };
    }
  } else {
    // Offline - save for later sync
    const pending = await savePendingProof(tripId, request);
    return { success: true, pendingId: pending.id, isOffline: true };
  }
}

// Network state listener for auto-sync
let unsubscribeNetInfo: (() => void) | null = null;

/**
 * Start listening for network changes and auto-sync when online
 */
export function startNetworkListener(): void {
  if (unsubscribeNetInfo) return;

  unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable) {
      // Connection restored - trigger sync
      syncPendingProofs().then(result => {
        if (result.synced > 0) {
          console.log(`Auto-synced ${result.synced} pending proof(s)`);
        }
      });
    }
  });
}

/**
 * Stop listening for network changes
 */
export function stopNetworkListener(): void {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

/**
 * Clear all offline data (for logout)
 */
export async function clearOfflineData(): Promise<void> {
  await AsyncStorage.multiRemove([PENDING_PROOFS_KEY, SYNC_STATUS_KEY]);
  notifyListeners();
}

export default {
  getPendingProofs,
  savePendingProof,
  removePendingProof,
  getSyncStatus,
  addSyncListener,
  isOnline,
  syncPendingProofs,
  createProofWithOfflineSupport,
  startNetworkListener,
  stopNetworkListener,
  clearOfflineData,
};

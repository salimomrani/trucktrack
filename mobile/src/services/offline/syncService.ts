/**
 * Offline Sync Service
 * Manages data synchronization between local storage and server
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@services/api/client';
import { syncPendingLocations } from '@services/location/gpsService';
import type { GPSPosition } from '@types/entities';

// Storage keys
const KEYS = {
  PENDING_STATUS_UPDATES: 'pending_status_updates',
  PENDING_MESSAGES: 'pending_messages',
  CACHED_TRIPS: 'cached_trips',
  LAST_SYNC: 'last_sync_time',
};

// Types
interface PendingStatusUpdate {
  id: string;
  status: string;
  timestamp: number;
}

interface PendingMessage {
  id: string;
  content: string;
  tripId?: string;
  timestamp: number;
}

// State
let isOnline = true;
let isSyncing = false;
let syncCallbacks: ((success: boolean) => void)[] = [];

/**
 * Initialize network monitoring
 */
export const initializeNetworkMonitoring = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected ?? false;

    console.log('Network state changed:', isOnline ? 'online' : 'offline');

    // Auto-sync when coming back online
    if (wasOffline && isOnline) {
      syncAll();
    }
  });

  return unsubscribe;
};

/**
 * Check if device is online
 */
export const checkOnlineStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  isOnline = state.isConnected ?? false;
  return isOnline;
};

/**
 * Store pending status update
 */
export const queueStatusUpdate = async (status: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(KEYS.PENDING_STATUS_UPDATES);
    const updates: PendingStatusUpdate[] = stored ? JSON.parse(stored) : [];

    updates.push({
      id: `status_${Date.now()}`,
      status,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(KEYS.PENDING_STATUS_UPDATES, JSON.stringify(updates));
    console.log('Queued status update for sync');
  } catch (error) {
    console.error('Failed to queue status update:', error);
  }
};

/**
 * Store pending message
 */
export const queueMessage = async (content: string, tripId?: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(KEYS.PENDING_MESSAGES);
    const messages: PendingMessage[] = stored ? JSON.parse(stored) : [];

    messages.push({
      id: `msg_${Date.now()}`,
      content,
      tripId,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(KEYS.PENDING_MESSAGES, JSON.stringify(messages));
    console.log('Queued message for sync');
  } catch (error) {
    console.error('Failed to queue message:', error);
  }
};

/**
 * Sync pending status updates
 */
const syncStatusUpdates = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(KEYS.PENDING_STATUS_UPDATES);
    if (!stored) return 0;

    const updates: PendingStatusUpdate[] = JSON.parse(stored);
    if (updates.length === 0) return 0;

    // Only sync the latest status (others are obsolete)
    const latest = updates[updates.length - 1];

    await api.put('/drivers/me/status', { status: latest.status });

    // Clear all pending updates
    await AsyncStorage.removeItem(KEYS.PENDING_STATUS_UPDATES);
    console.log('Synced status update');

    return 1;
  } catch (error) {
    console.error('Failed to sync status updates:', error);
    return 0;
  }
};

/**
 * Sync pending messages
 */
const syncMessages = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(KEYS.PENDING_MESSAGES);
    if (!stored) return 0;

    const messages: PendingMessage[] = JSON.parse(stored);
    if (messages.length === 0) return 0;

    let syncedCount = 0;
    const remaining: PendingMessage[] = [];

    for (const msg of messages) {
      try {
        await api.post('/drivers/me/messages', {
          content: msg.content,
          tripId: msg.tripId,
        });
        syncedCount++;
      } catch (error) {
        // Keep message for retry
        remaining.push(msg);
      }
    }

    // Update stored messages
    if (remaining.length > 0) {
      await AsyncStorage.setItem(KEYS.PENDING_MESSAGES, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(KEYS.PENDING_MESSAGES);
    }

    console.log(`Synced ${syncedCount} messages`);
    return syncedCount;
  } catch (error) {
    console.error('Failed to sync messages:', error);
    return 0;
  }
};

/**
 * Sync all pending data
 */
export const syncAll = async (): Promise<{ success: boolean; syncedItems: number }> => {
  if (isSyncing) {
    console.log('Sync already in progress');
    return { success: false, syncedItems: 0 };
  }

  if (!isOnline) {
    console.log('Cannot sync: offline');
    return { success: false, syncedItems: 0 };
  }

  isSyncing = true;
  let totalSynced = 0;
  let success = true;

  try {
    // Sync locations
    const locationsSynced = await syncPendingLocations();
    totalSynced += locationsSynced;

    // Sync status updates
    const statusSynced = await syncStatusUpdates();
    totalSynced += statusSynced;

    // Sync messages
    const messagesSynced = await syncMessages();
    totalSynced += messagesSynced;

    // Update last sync time
    await AsyncStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());

    console.log(`Sync complete: ${totalSynced} items synced`);
  } catch (error) {
    console.error('Sync failed:', error);
    success = false;
  } finally {
    isSyncing = false;
    syncCallbacks.forEach((cb) => cb(success));
  }

  return { success, syncedItems: totalSynced };
};

/**
 * Get last sync time
 */
export const getLastSyncTime = async (): Promise<number | null> => {
  const stored = await AsyncStorage.getItem(KEYS.LAST_SYNC);
  return stored ? parseInt(stored, 10) : null;
};

/**
 * Get pending items count
 */
export const getPendingItemsCount = async (): Promise<number> => {
  let count = 0;

  try {
    const statusUpdates = await AsyncStorage.getItem(KEYS.PENDING_STATUS_UPDATES);
    if (statusUpdates) {
      count += JSON.parse(statusUpdates).length;
    }

    const messages = await AsyncStorage.getItem(KEYS.PENDING_MESSAGES);
    if (messages) {
      count += JSON.parse(messages).length;
    }
  } catch (error) {
    console.error('Failed to get pending items count:', error);
  }

  return count;
};

/**
 * Subscribe to sync events
 */
export const onSyncComplete = (callback: (success: boolean) => void): (() => void) => {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter((cb) => cb !== callback);
  };
};

/**
 * Check if sync is in progress
 */
export const isSyncInProgress = (): boolean => isSyncing;

/**
 * Check if online
 */
export const isDeviceOnline = (): boolean => isOnline;

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    KEYS.PENDING_STATUS_UPDATES,
    KEYS.PENDING_MESSAGES,
    KEYS.CACHED_TRIPS,
    KEYS.LAST_SYNC,
  ]);
};

export default {
  initializeNetworkMonitoring,
  checkOnlineStatus,
  queueStatusUpdate,
  queueMessage,
  syncAll,
  getLastSyncTime,
  getPendingItemsCount,
  onSyncComplete,
  isSyncInProgress,
  isDeviceOnline,
  clearCache,
};

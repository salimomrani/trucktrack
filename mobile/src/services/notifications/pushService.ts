/**
 * Push Notification Service
 * Firebase Cloud Messaging integration
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { useMessagesStore } from '@store/messagesStore';
import type { Message } from '@types/entities';

// Notification types
export type NotificationType = 'message' | 'trip_assigned' | 'trip_update' | 'alert';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Callbacks
let notificationCallbacks: ((payload: NotificationPayload) => void)[] = [];

/**
 * Request notification permissions
 */
export const requestPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted');
  }

  return enabled;
};

/**
 * Get FCM token for device registration
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Register device token with server
 */
export const registerDeviceToken = async (token: string): Promise<void> => {
  try {
    // This would be implemented to call your backend API
    console.log('Registering device token:', token);
    // await api.post('/devices/register', { token, platform: Platform.OS });
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
};

/**
 * Create notification channel (Android)
 */
export const createNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'trucktrack-default',
      name: 'TruckTrack Notifications',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'trucktrack-messages',
      name: 'Messages',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'trucktrack-trips',
      name: 'Trip Updates',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
  }
};

/**
 * Display local notification
 */
export const displayNotification = async (payload: NotificationPayload): Promise<void> => {
  const channelId =
    payload.type === 'message'
      ? 'trucktrack-messages'
      : payload.type.startsWith('trip')
        ? 'trucktrack-trips'
        : 'trucktrack-default';

  await notifee.displayNotification({
    title: payload.title,
    body: payload.body,
    data: payload.data,
    android: {
      channelId,
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
      },
    },
    ios: {
      sound: 'default',
    },
  });
};

/**
 * Handle incoming FCM message
 */
const handleRemoteMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  console.log('Received FCM message:', remoteMessage);

  const payload: NotificationPayload = {
    type: (remoteMessage.data?.type as NotificationType) || 'alert',
    title: remoteMessage.notification?.title || 'TruckTrack',
    body: remoteMessage.notification?.body || '',
    data: remoteMessage.data as Record<string, string>,
  };

  // Notify callbacks
  notificationCallbacks.forEach((cb) => cb(payload));

  // Display notification if app is in background
  if (remoteMessage.notification) {
    await displayNotification(payload);
  }

  // Handle message type specific logic
  if (payload.type === 'message' && payload.data?.messageId) {
    // Add to messages store
    const newMessage: Message = {
      id: payload.data.messageId,
      content: payload.body,
      direction: 'INCOMING',
      isRead: false,
      createdAt: new Date().toISOString(),
      tripId: payload.data.tripId,
    };
    useMessagesStore.getState().addMessage(newMessage);
  }
};

/**
 * Initialize push notification service
 */
export const initializePushNotifications = async (): Promise<void> => {
  // Request permission
  const hasPermission = await requestPermission();
  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return;
  }

  // Create channels
  await createNotificationChannel();

  // Get and register token
  const token = await getFCMToken();
  if (token) {
    await registerDeviceToken(token);
  }

  // Listen for token refresh
  messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM Token refreshed');
    await registerDeviceToken(newToken);
  });

  // Foreground message handler
  messaging().onMessage(handleRemoteMessage);

  // Background message handler (must be registered outside React)
  messaging().setBackgroundMessageHandler(handleRemoteMessage);

  // Handle notification tap when app is in background
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Background notification pressed:', detail.notification);
      // Handle navigation based on notification data
    }
  });

  // Handle notification tap when app is in foreground
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Foreground notification pressed:', detail.notification);
      // Handle navigation based on notification data
    }
  });
};

/**
 * Subscribe to notification events
 */
export const onNotification = (
  callback: (payload: NotificationPayload) => void,
): (() => void) => {
  notificationCallbacks.push(callback);
  return () => {
    notificationCallbacks = notificationCallbacks.filter((cb) => cb !== callback);
  };
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  await notifee.cancelAllNotifications();
};

/**
 * Get notification badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return notifee.getBadgeCount();
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  await notifee.setBadgeCount(count);
};

export default {
  requestPermission,
  getFCMToken,
  registerDeviceToken,
  initializePushNotifications,
  displayNotification,
  onNotification,
  clearAllNotifications,
  getBadgeCount,
  setBadgeCount,
};

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NotificationService } from './api';

/**
 * Push notification service for trip assignments.
 * T040: Implement push notification registration
 * Feature: 010-trip-management (US3: Push Notifications)
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token.
 * @returns The Expo push token or null if registration fails
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID, // Set in app.json or env
    });
    token = tokenData.data;

    console.log('Expo push token:', token);

    // Register the token with the backend
    await NotificationService.registerPushToken(token);
    console.log('Push token registered with backend');

  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }

  // Android-specific channel configuration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trips', {
      name: 'Trip Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1976D2',
      sound: 'default',
    });
  }

  return token;
}

/**
 * Unregister from push notifications (on logout).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await NotificationService.unregisterPushToken();
    console.log('Push token unregistered from backend');
  } catch (error) {
    console.error('Error unregistering push token:', error);
  }
}

/**
 * Add a listener for received notifications.
 * @param callback Function to call when a notification is received
 * @returns Subscription that can be removed
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (when user taps notification).
 * @param callback Function to call when user interacts with notification
 * @returns Subscription that can be removed
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification data from a response.
 * @param response The notification response
 * @returns The data payload or null
 */
export function getNotificationData(
  response: Notifications.NotificationResponse
): { tripId?: string; type?: string } | null {
  const data = response.notification.request.content.data;
  if (data && typeof data === 'object') {
    return data as { tripId?: string; type?: string };
  }
  return null;
}

/**
 * Get the last notification response (for deep linking on app launch).
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

export default {
  registerForPushNotifications,
  unregisterPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getNotificationData,
  getLastNotificationResponse,
};

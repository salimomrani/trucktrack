/**
 * Notifications Services Exports
 */

export {
  requestPermission,
  getFCMToken,
  registerDeviceToken,
  initializePushNotifications,
  displayNotification,
  onNotification,
  clearAllNotifications,
  getBadgeCount,
  setBadgeCount,
} from './pushService';

export type { NotificationType, NotificationPayload } from './pushService';

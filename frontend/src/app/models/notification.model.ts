/**
 * Notification model matching backend Notification entity
 * T156: Create Notification model
 */

export type NotificationType = 'OFFLINE' | 'IDLE' | 'SPEED_LIMIT' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT';
export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Notification {
  id: string;
  userId: string;
  alertRuleId: string;
  truckId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  latitude?: number;
  longitude?: number;
  triggeredAt: string;
  sentAt: string;
  readAt?: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;      // true if this is the last page
  first: boolean;     // true if this is the first page
  empty: boolean;     // true if content is empty
}

export interface NotificationStats {
  unread: number;
  critical: number;
  warning: number;
  info: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  markedCount: number;
}

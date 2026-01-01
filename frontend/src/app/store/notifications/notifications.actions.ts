import { createAction, props } from '@ngrx/store';
import { Notification, NotificationPage } from '../../models/notification.model';

// Load Unread Notifications
export const loadUnreadNotifications = createAction(
  '[Notifications] Load Unread Notifications'
);

export const loadUnreadNotificationsSuccess = createAction(
  '[Notifications] Load Unread Notifications Success',
  props<{ notifications: Notification[] }>()
);

export const loadUnreadNotificationsFailure = createAction(
  '[Notifications] Load Unread Notifications Failure',
  props<{ error: string }>()
);

// Load Unread Count
export const loadUnreadCount = createAction(
  '[Notifications] Load Unread Count'
);

export const loadUnreadCountSuccess = createAction(
  '[Notifications] Load Unread Count Success',
  props<{ count: number }>()
);

export const loadUnreadCountFailure = createAction(
  '[Notifications] Load Unread Count Failure',
  props<{ error: string }>()
);

// Mark Single Notification as Read
export const markAsRead = createAction(
  '[Notifications] Mark As Read',
  props<{ notificationId: string }>()
);

export const markAsReadSuccess = createAction(
  '[Notifications] Mark As Read Success',
  props<{ notification: Notification }>()
);

export const markAsReadFailure = createAction(
  '[Notifications] Mark As Read Failure',
  props<{ notificationId: string; error: string }>()
);

// Mark All Notifications as Read
export const markAllAsRead = createAction(
  '[Notifications] Mark All As Read'
);

export const markAllAsReadSuccess = createAction(
  '[Notifications] Mark All As Read Success',
  props<{ markedCount: number }>()
);

export const markAllAsReadFailure = createAction(
  '[Notifications] Mark All As Read Failure',
  props<{ error: string }>()
);

// WebSocket Connection
export const connectWebSocket = createAction(
  '[Notifications] Connect WebSocket'
);

export const disconnectWebSocket = createAction(
  '[Notifications] Disconnect WebSocket'
);

export const wsConnected = createAction(
  '[Notifications] WebSocket Connected'
);

export const wsDisconnected = createAction(
  '[Notifications] WebSocket Disconnected'
);

export const wsError = createAction(
  '[Notifications] WebSocket Error',
  props<{ error: string }>()
);

// Real-time Notification Received
export const newNotificationReceived = createAction(
  '[Notifications] New Notification Received',
  props<{ notification: Notification }>()
);

// Clear Notifications on Logout
export const clearNotifications = createAction(
  '[Notifications] Clear Notifications'
);

// Direct count adjustments (used when component handles API call directly)
export const decrementUnreadCount = createAction(
  '[Notifications] Decrement Unread Count'
);

export const resetUnreadCount = createAction(
  '[Notifications] Reset Unread Count'
);

// ============================================
// Paged Notifications (for Alerts page)
// ============================================

// Load first page of notifications
export const loadNotificationsPaged = createAction(
  '[Notifications] Load Notifications Paged',
  props<{ page: number; size: number }>()
);

export const loadNotificationsPagedSuccess = createAction(
  '[Notifications] Load Notifications Paged Success',
  props<{ page: NotificationPage }>()
);

export const loadNotificationsPagedFailure = createAction(
  '[Notifications] Load Notifications Paged Failure',
  props<{ error: string }>()
);

// Load more notifications (infinite scroll)
export const loadMoreNotifications = createAction(
  '[Notifications] Load More Notifications',
  props<{ page: number; size: number }>()
);

export const loadMoreNotificationsSuccess = createAction(
  '[Notifications] Load More Notifications Success',
  props<{ page: NotificationPage }>()
);

export const loadMoreNotificationsFailure = createAction(
  '[Notifications] Load More Notifications Failure',
  props<{ error: string }>()
);

// Reset pagination state
export const resetPagination = createAction(
  '[Notifications] Reset Pagination'
);

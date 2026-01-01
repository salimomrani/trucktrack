import { createReducer, on } from '@ngrx/store';
import * as NotificationsActions from './notifications.actions';
import { initialNotificationsState, notificationAdapter } from './notifications.state';

export const notificationsReducer = createReducer(
  initialNotificationsState,

  // Load Unread Notifications
  on(NotificationsActions.loadUnreadNotifications, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(NotificationsActions.loadUnreadNotificationsSuccess, (state, { notifications }) =>
    notificationAdapter.setAll(notifications, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(NotificationsActions.loadUnreadNotificationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Unread Count
  on(NotificationsActions.loadUnreadCountSuccess, (state, { count }) => ({
    ...state,
    unreadCount: count
  })),

  on(NotificationsActions.loadUnreadCountFailure, (state, { error }) => ({
    ...state,
    error
  })),

  // Mark Single As Read
  on(NotificationsActions.markAsRead, (state, { notificationId }) => ({
    ...state,
    markingAsReadId: notificationId
  })),

  on(NotificationsActions.markAsReadSuccess, (state, { notification }) =>
    notificationAdapter.updateOne(
      { id: notification.id, changes: { isRead: true, readAt: notification.readAt } },
      {
        ...state,
        unreadCount: Math.max(0, state.unreadCount - 1),
        markingAsReadId: null
      }
    )
  ),

  on(NotificationsActions.markAsReadFailure, (state, { error }) => ({
    ...state,
    markingAsReadId: null,
    error
  })),

  // Mark All As Read
  on(NotificationsActions.markAllAsRead, (state) => ({
    ...state,
    markingAllAsRead: true
  })),

  on(NotificationsActions.markAllAsReadSuccess, (state) => {
    // Update all notifications to read
    const updates = state.ids.map(id => ({
      id: id as string,
      changes: { isRead: true }
    }));
    return notificationAdapter.updateMany(updates, {
      ...state,
      unreadCount: 0,
      markingAllAsRead: false
    });
  }),

  on(NotificationsActions.markAllAsReadFailure, (state, { error }) => ({
    ...state,
    markingAllAsRead: false,
    error
  })),

  // WebSocket Connection
  on(NotificationsActions.wsConnected, (state) => ({
    ...state,
    wsConnected: true
  })),

  on(NotificationsActions.wsDisconnected, (state) => ({
    ...state,
    wsConnected: false
  })),

  on(NotificationsActions.wsError, (state, { error }) => ({
    ...state,
    wsConnected: false,
    error
  })),

  // New Notification from WebSocket
  on(NotificationsActions.newNotificationReceived, (state, { notification }) =>
    notificationAdapter.addOne(notification, {
      ...state,
      unreadCount: state.unreadCount + 1
    })
  ),

  // Clear Notifications (on logout)
  on(NotificationsActions.clearNotifications, () => initialNotificationsState),

  // Direct count adjustments
  on(NotificationsActions.decrementUnreadCount, (state) => ({
    ...state,
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),

  on(NotificationsActions.resetUnreadCount, (state) => ({
    ...state,
    unreadCount: 0
  }))
);

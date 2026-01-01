import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState, notificationAdapter } from './notifications.state';

// Feature selector
export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');

// Entity adapter selectors
const { selectAll, selectEntities, selectIds, selectTotal } = notificationAdapter.getSelectors();

// Select all notifications (sorted by triggeredAt desc)
export const selectAllNotifications = createSelector(
  selectNotificationsState,
  selectAll
);

// Select notification entities (as dictionary)
export const selectNotificationEntities = createSelector(
  selectNotificationsState,
  selectEntities
);

// Select notification IDs
export const selectNotificationIds = createSelector(
  selectNotificationsState,
  selectIds
);

// Select total notification count
export const selectTotalNotifications = createSelector(
  selectNotificationsState,
  selectTotal
);

// Select unread count (badge count)
export const selectUnreadCount = createSelector(
  selectNotificationsState,
  (state) => state.unreadCount
);

// Select loading state
export const selectNotificationsLoading = createSelector(
  selectNotificationsState,
  (state) => state.loading
);

// Select error
export const selectNotificationsError = createSelector(
  selectNotificationsState,
  (state) => state.error
);

// Select WebSocket connected state
export const selectWsConnected = createSelector(
  selectNotificationsState,
  (state) => state.wsConnected
);

// Select marking as read ID (for spinner)
export const selectMarkingAsReadId = createSelector(
  selectNotificationsState,
  (state) => state.markingAsReadId
);

// Select marking all as read state
export const selectMarkingAllAsRead = createSelector(
  selectNotificationsState,
  (state) => state.markingAllAsRead
);

// Select unread notifications only
export const selectUnreadNotifications = createSelector(
  selectAllNotifications,
  (notifications) => notifications.filter(n => !n.isRead)
);

// Select notification by ID (parameterized selector)
export const selectNotificationById = (notificationId: string) =>
  createSelector(
    selectNotificationEntities,
    (entities) => entities[notificationId]
  );

// Select has unread notifications
export const selectHasUnreadNotifications = createSelector(
  selectUnreadCount,
  (count) => count > 0
);

// Format badge count (99+ for large numbers)
export const selectFormattedBadgeCount = createSelector(
  selectUnreadCount,
  (count) => count > 99 ? '99+' : count.toString()
);

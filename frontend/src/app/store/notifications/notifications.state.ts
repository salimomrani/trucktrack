import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Notification } from '../../models/notification.model';

/**
 * Entity adapter for normalized notification storage
 */
export const notificationAdapter: EntityAdapter<Notification> = createEntityAdapter<Notification>({
  selectId: (notification) => notification.id,
  sortComparer: (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
});

/**
 * Notifications state interface extending EntityState
 */
export interface NotificationsState extends EntityState<Notification> {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  markingAsReadId: string | null;
  markingAllAsRead: boolean;
}

/**
 * Initial notifications state
 */
export const initialNotificationsState: NotificationsState = notificationAdapter.getInitialState({
  unreadCount: 0,
  loading: false,
  error: null,
  wsConnected: false,
  markingAsReadId: null,
  markingAllAsRead: false
});

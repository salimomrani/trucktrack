import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, Subject } from 'rxjs';
import { map, catchError, switchMap, tap, takeUntil, filter } from 'rxjs/operators';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';
import * as NotificationsActions from './notifications.actions';
import * as AuthActions from '../auth/auth.actions';
import { Notification } from '../../models/notification.model';

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);

  // WebSocket management
  private wsClient: Client | null = null;
  private wsSubscription: StompSubscription | null = null;
  private readonly wsDestroy$ = new Subject<void>();

  // Load Unread Notifications
  loadUnreadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadUnreadNotifications),
      switchMap(() =>
        this.notificationService.getUnreadNotifications().pipe(
          map((notifications) => NotificationsActions.loadUnreadNotificationsSuccess({ notifications })),
          catchError((error) =>
            of(NotificationsActions.loadUnreadNotificationsFailure({ error: error.message || 'Failed to load notifications' }))
          )
        )
      )
    )
  );

  // Load Unread Count
  loadUnreadCount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadUnreadCount),
      switchMap(() =>
        this.notificationService.getUnreadCount().pipe(
          map((response) => NotificationsActions.loadUnreadCountSuccess({ count: response.count })),
          catchError((error) =>
            of(NotificationsActions.loadUnreadCountFailure({ error: error.message || 'Failed to load unread count' }))
          )
        )
      )
    )
  );

  // Mark Single Notification As Read
  markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAsRead),
      switchMap(({ notificationId }) =>
        this.notificationService.markAsRead(notificationId).pipe(
          map((notification) => NotificationsActions.markAsReadSuccess({ notification })),
          catchError((error) =>
            of(NotificationsActions.markAsReadFailure({
              notificationId,
              error: error.message || 'Failed to mark as read'
            }))
          )
        )
      )
    )
  );

  // Mark All Notifications As Read
  markAllAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAllAsRead),
      switchMap(() =>
        this.notificationService.markAllAsRead().pipe(
          map((response) => NotificationsActions.markAllAsReadSuccess({ markedCount: response.markedCount })),
          catchError((error) =>
            of(NotificationsActions.markAllAsReadFailure({ error: error.message || 'Failed to mark all as read' }))
          )
        )
      )
    )
  );

  // Connect WebSocket
  connectWebSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.connectWebSocket),
      tap(() => this.initWebSocket()),
      switchMap(() => of()) // No action dispatched here, wsConnected is dispatched in callback
    ),
    { dispatch: false }
  );

  // Disconnect WebSocket
  disconnectWebSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.disconnectWebSocket),
      tap(() => this.closeWebSocket())
    ),
    { dispatch: false }
  );

  // Load unread count when WebSocket connects
  loadCountOnWsConnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.wsConnected),
      map(() => NotificationsActions.loadUnreadCount())
    )
  );

  // Clear notifications on logout
  clearOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.closeWebSocket()),
      map(() => NotificationsActions.clearNotifications())
    )
  );

  /**
   * Initialize WebSocket connection
   */
  private initWebSocket(): void {
    if (this.wsClient?.connected) {
      return;
    }

    // Get WebSocket URL for notifications (port 8082)
    const wsUrl = environment.apiUrl.replace('http', 'ws').replace(':8000', ':8082') + '/ws-notifications';

    this.wsClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (environment.logging?.enableConsoleLogging) {
          // Debug logging if enabled
        }
      }
    });

    this.wsClient.onConnect = () => {
      this.store.dispatch(NotificationsActions.wsConnected());
      this.subscribeToNotifications();
    };

    this.wsClient.onDisconnect = () => {
      this.store.dispatch(NotificationsActions.wsDisconnected());
    };

    this.wsClient.onStompError = (frame) => {
      console.error('Notification WebSocket error', frame);
      this.store.dispatch(NotificationsActions.wsError({ error: frame.headers['message'] || 'WebSocket error' }));
    };

    this.wsClient.activate();
  }

  /**
   * Subscribe to broadcast notifications
   */
  private subscribeToNotifications(): void {
    if (!this.wsClient?.connected) {
      return;
    }

    this.wsSubscription = this.wsClient.subscribe('/topic/notifications', (message: IMessage) => {
      const notification: Notification = JSON.parse(message.body);
      this.store.dispatch(NotificationsActions.newNotificationReceived({ notification }));
    });
  }

  /**
   * Close WebSocket connection
   */
  private closeWebSocket(): void {
    this.wsDestroy$.next();

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }

    if (this.wsClient) {
      this.wsClient.deactivate();
      this.wsClient = null;
    }
  }
}

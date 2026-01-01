import { Injectable, inject, OnDestroy } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, of, Subject, fromEvent, merge, EMPTY } from 'rxjs';
import {
  map,
  catchError,
  switchMap,
  tap,
  takeUntil,
  filter,
  mergeMap,
  finalize,
  share,
  exhaustMap
} from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';
import * as NotificationsActions from './notifications.actions';
import * as AuthActions from '../auth/auth.actions';
import { Notification } from '../../models/notification.model';

@Injectable()
export class NotificationsEffects implements OnDestroy {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();
  private wsClient: Client | null = null;

  // Observable wrapper for WebSocket messages
  private readonly wsMessages$ = new Subject<Notification>();
  private readonly wsStatus$ = new Subject<'connected' | 'disconnected' | 'error'>();

  // ============================================
  // HTTP Effects - Using pure pipe operators
  // ============================================

  readonly loadUnreadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadUnreadNotifications),
      exhaustMap(() =>
        this.notificationService.getUnreadNotifications().pipe(
          map(notifications => NotificationsActions.loadUnreadNotificationsSuccess({ notifications })),
          catchError(error => of(NotificationsActions.loadUnreadNotificationsFailure({
            error: error?.message || 'Failed to load notifications'
          })))
        )
      )
    )
  );

  readonly loadUnreadCount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadUnreadCount),
      exhaustMap(() =>
        this.notificationService.getUnreadCount().pipe(
          map(({ count }) => NotificationsActions.loadUnreadCountSuccess({ count })),
          catchError(error => of(NotificationsActions.loadUnreadCountFailure({
            error: error?.message || 'Failed to load unread count'
          })))
        )
      )
    )
  );

  readonly markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAsRead),
      mergeMap(({ notificationId }) =>
        this.notificationService.markAsRead(notificationId).pipe(
          map(notification => NotificationsActions.markAsReadSuccess({ notification })),
          catchError(error => of(NotificationsActions.markAsReadFailure({
            notificationId,
            error: error?.message || 'Failed to mark as read'
          })))
        )
      )
    )
  );

  readonly markAllAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAllAsRead),
      exhaustMap(() =>
        this.notificationService.markAllAsRead().pipe(
          map(({ markedCount }) => NotificationsActions.markAllAsReadSuccess({ markedCount })),
          catchError(error => of(NotificationsActions.markAllAsReadFailure({
            error: error?.message || 'Failed to mark all as read'
          })))
        )
      )
    )
  );

  // ============================================
  // WebSocket Effects - Using observables
  // ============================================

  readonly connectWebSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.connectWebSocket),
      filter(() => !this.wsClient?.connected),
      tap(() => this.createWebSocketConnection()),
      switchMap(() => EMPTY)
    ),
    { dispatch: false }
  );

  readonly disconnectWebSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.disconnectWebSocket),
      tap(() => this.deactivateWebSocket()),
      switchMap(() => EMPTY)
    ),
    { dispatch: false }
  );

  // Handle WebSocket status changes via observable
  readonly wsStatusChanges$ = createEffect(() =>
    this.wsStatus$.pipe(
      takeUntil(this.destroy$),
      map(status => {
        switch (status) {
          case 'connected':
            return NotificationsActions.wsConnected();
          case 'disconnected':
            return NotificationsActions.wsDisconnected();
          case 'error':
            return NotificationsActions.wsError({ error: 'WebSocket connection error' });
        }
      })
    )
  );

  // Handle incoming WebSocket messages via observable
  readonly wsIncomingMessages$ = createEffect(() =>
    this.wsMessages$.pipe(
      takeUntil(this.destroy$),
      map(notification => NotificationsActions.newNotificationReceived({ notification }))
    )
  );

  // Load unread count when WebSocket connects
  readonly loadCountOnConnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.wsConnected),
      map(() => NotificationsActions.loadUnreadCount())
    )
  );

  // Clear notifications and disconnect on logout
  readonly handleLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.deactivateWebSocket()),
      map(() => NotificationsActions.clearNotifications())
    )
  );

  // ============================================
  // WebSocket Connection Management
  // ============================================

  private createWebSocketConnection(): void {
    const wsUrl = environment.apiUrl
      .replace('http', 'ws')
      .replace(':8000', ':8082') + '/ws-notifications';

    this.wsClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    // Wire up STOMP callbacks to observables
    this.wsClient.onConnect = () => {
      this.wsStatus$.next('connected');
      this.wsClient?.subscribe('/topic/notifications', (message: IMessage) => {
        const notification: Notification = JSON.parse(message.body);
        this.wsMessages$.next(notification);
      });
    };

    this.wsClient.onDisconnect = () => this.wsStatus$.next('disconnected');
    this.wsClient.onStompError = () => this.wsStatus$.next('error');

    this.wsClient.activate();
  }

  private deactivateWebSocket(): void {
    this.wsClient?.deactivate();
    this.wsClient = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsMessages$.complete();
    this.wsStatus$.complete();
    this.deactivateWebSocket();
  }
}

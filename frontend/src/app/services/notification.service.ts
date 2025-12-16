import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import {
  Notification,
  NotificationPage,
  NotificationStats,
  UnreadCountResponse,
  MarkAllReadResponse
} from '../models/notification.model';

/**
 * Service for notification HTTP operations and WebSocket real-time updates
 * T158: Create NotificationService (HTTP client)
 * T166: Implement WebSocket subscription for real-time notifications
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notification/v1/notifications`;

  // WebSocket client for notifications
  private wsClient: Client | null = null;
  private wsSubscription: StompSubscription | null = null;

  // Real-time notification signals
  private newNotificationSubject = new Subject<Notification>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  // Connection status
  public wsConnected = signal(false);

  // Unread count (updated in real-time)
  public unreadCount = signal(0);

  /**
   * Get notifications for current user (paginated)
   */
  getNotifications(page: number = 0, size: number = 20): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<NotificationPage>(this.baseUrl, { params });
  }

  /**
   * Get unread notifications for current user
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/unread`);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread/count`);
  }

  /**
   * Get notification stats for current user
   */
  getNotificationStats(): Observable<NotificationStats> {
    return this.http.get<NotificationStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${id}`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${id}/read`, null);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<MarkAllReadResponse> {
    return this.http.post<MarkAllReadResponse>(`${this.baseUrl}/mark-all-read`, null);
  }

  /**
   * Get recent notifications (last 24 hours)
   */
  getRecentNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/recent`);
  }

  /**
   * Get notifications for a specific truck
   */
  getNotificationsForTruck(truckId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/truck/${truckId}`);
  }

  // ============================================
  // T166: WebSocket Real-time Notifications
  // ============================================

  /**
   * Connect to notification WebSocket
   */
  connectWebSocket(): void {
    if (this.wsClient?.connected) {
      console.log('Notification WebSocket already connected');
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
          console.log('Notification WS: ' + str);
        }
      }
    });

    this.wsClient.onConnect = () => {
      console.log('Notification WebSocket connected');
      this.wsConnected.set(true);
      this.subscribeToNotifications();
      this.loadUnreadCount();
    };

    this.wsClient.onDisconnect = () => {
      console.log('Notification WebSocket disconnected');
      this.wsConnected.set(false);
    };

    this.wsClient.onStompError = (frame) => {
      console.error('Notification WebSocket error', frame);
      this.wsConnected.set(false);
    };

    this.wsClient.activate();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnectWebSocket(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    if (this.wsClient) {
      this.wsClient.deactivate();
      this.wsConnected.set(false);
    }
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
      console.log('Received real-time notification:', notification);
      this.newNotificationSubject.next(notification);
      this.unreadCount.update(count => count + 1);
    });

    console.log('Subscribed to /topic/notifications');
  }

  /**
   * Load initial unread count
   */
  private loadUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.count);
      },
      error: (err) => {
        console.error('Failed to load unread count:', err);
      }
    });
  }

  /**
   * Decrement unread count (when notification is read)
   */
  decrementUnreadCount(): void {
    this.unreadCount.update(count => Math.max(0, count - 1));
  }

  /**
   * Reset unread count to zero
   */
  resetUnreadCount(): void {
    this.unreadCount.set(0);
  }
}

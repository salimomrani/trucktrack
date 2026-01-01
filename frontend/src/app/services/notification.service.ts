import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Notification,
  NotificationPage,
  NotificationStats,
  UnreadCountResponse,
  MarkAllReadResponse
} from '../models/notification.model';

/**
 * Service for notification HTTP operations
 * WebSocket and state management moved to NgRx store (store/notifications)
 * T158: Create NotificationService (HTTP client)
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notification/v1/notifications`;

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
   * Get recent notifications (last 24 hours) - with limit
   */
  getRecentNotifications(limit: number = 100): Observable<Notification[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Notification[]>(`${this.baseUrl}/recent`, { params });
  }

  /**
   * Get recent notifications - PAGINATED for infinite scroll
   */
  getRecentNotificationsPaged(page: number = 0, size: number = 20): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<NotificationPage>(`${this.baseUrl}/recent/paged`, { params });
  }

  /**
   * Get notifications for a specific truck
   */
  getNotificationsForTruck(truckId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/truck/${truckId}`);
  }

  // ============================================
  // Feature 016: Notification Preferences
  // ============================================

  private readonly preferencesUrl = `${environment.apiUrl}/notification/api/notifications/preferences`;
  private readonly pushTokenUrl = `${environment.apiUrl}/notification/api/notifications/push-tokens`;
  private readonly historyUrl = `${environment.apiUrl}/notification/api/notifications/history`;

  /**
   * Get current user's notification preferences
   */
  getPreferences(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(this.preferencesUrl);
  }

  /**
   * Update user notification preferences
   */
  updatePreferences(preferences: UpdatePreferenceRequest[]): Observable<NotificationPreference[]> {
    return this.http.put<NotificationPreference[]>(this.preferencesUrl, preferences);
  }

  /**
   * Get notification history
   */
  getNotificationHistory(page: number = 0, size: number = 20): Observable<NotificationHistoryPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<NotificationHistoryPage>(this.historyUrl, { params });
  }

  /**
   * Mark history notification as read
   */
  markHistoryAsRead(notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.historyUrl}/${notificationId}/read`, null);
  }

  /**
   * Get registered push tokens
   */
  getPushTokens(): Observable<PushToken[]> {
    return this.http.get<PushToken[]>(this.pushTokenUrl);
  }

  /**
   * Register a new push token
   */
  registerPushToken(token: string, deviceType: string, deviceName?: string): Observable<PushToken> {
    return this.http.post<PushToken>(this.pushTokenUrl, {
      token,
      deviceType,
      deviceName
    });
  }

  /**
   * Unregister a push token
   */
  unregisterPushToken(tokenId: string): Observable<void> {
    return this.http.delete<void>(`${this.pushTokenUrl}/${tokenId}`);
  }
}

// Types for notification preferences
export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface UpdatePreferenceRequest {
  eventType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface PushToken {
  id: string;
  deviceType: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface NotificationHistoryPage {
  content: NotificationHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface NotificationHistoryItem {
  id: string;
  notificationType: string;
  channel: string;
  subject: string;
  contentPreview: string;
  status: string;
  sentAt: string;
  readAt: string;
}

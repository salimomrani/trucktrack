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
 * T158: Create NotificationService (HTTP client + WebSocket for notifications)
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
}

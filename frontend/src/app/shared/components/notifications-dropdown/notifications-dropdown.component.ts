import {
  Component,
  inject,
  signal,
  output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';
import * as NotificationsActions from '../../../store/notifications/notifications.actions';
import { Notification, NotificationSeverity, NotificationType } from '../../../models/notification.model';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Notifications Dropdown Component
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * Displays recent notifications in a dropdown panel with mark as read functionality.
 *
 * @example
 * <app-notifications-dropdown
 *   [unreadCount]="unreadCount()"
 *   (closed)="closeDropdown()"
 * />
 */
@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, EmptyStateComponent, SkeletonComponent],
  templateUrl: './notifications-dropdown.component.html',
  styleUrl: './notifications-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
  private readonly facade = inject(StoreFacade);
  private readonly actions$ = inject(Actions);
  private readonly elementRef = inject(ElementRef);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  /** Event emitted when dropdown should close */
  readonly closed = output<void>();

  /** Loading state from store */
  readonly loading = this.facade.notificationsLoading;

  /** Error message from store */
  readonly error = this.facade.notificationsError;

  /** Notifications from store */
  readonly notifications = this.facade.notifications;

  /** Unread count from store */
  readonly unreadCount = this.facade.unreadCount;

  /** Track which notification is being marked as read */
  readonly markingAsRead = this.facade.markingAsReadId;

  /** Track if marking all as read */
  readonly markingAllAsRead = this.facade.markingAllAsRead;

  /** Flag to skip the initial click that opened the dropdown */
  private initialized = false;

  ngOnInit(): void {
    // Load notifications via store action
    this.facade.loadUnreadNotifications();

    // Delay enabling click-outside detection to prevent immediate close
    setTimeout(() => {
      this.initialized = true;
    }, 100);

    // Subscribe to new real-time notifications from store actions
    this.actions$
      .pipe(
        ofType(NotificationsActions.newNotificationReceived),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Skip if not yet initialized (prevents immediate close on opening click)
    if (!this.initialized) return;

    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closed.emit();
    }
  }

  /**
   * Close on escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closed.emit();
  }

  /**
   * Load unread notifications via store
   */
  loadNotifications(): void {
    this.facade.loadUnreadNotifications();
  }

  /**
   * Handle notification click - mark as read and close
   */
  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.facade.markNotificationAsRead(notification.id);
    }
    this.closed.emit();
  }

  /**
   * Mark a single notification as read (button click)
   */
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.isRead || this.markingAsRead()) return;

    this.facade.markNotificationAsRead(notification.id);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    if (this.markingAllAsRead() || this.unreadCount() === 0) return;

    this.facade.markAllNotificationsAsRead();
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'OFFLINE': return 'cloud_off';
      case 'IDLE': return 'pause_circle';
      case 'SPEED_LIMIT': return 'speed';
      case 'GEOFENCE_ENTER': return 'login';
      case 'GEOFENCE_EXIT': return 'logout';
      default: return 'notifications';
    }
  }

  /**
   * Get color classes for severity
   */
  getSeverityClasses(severity: NotificationSeverity): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400';
      case 'WARNING':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400';
      case 'INFO':
      default:
        return 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400';
    }
  }

  /**
   * Format timestamp to relative time
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return this.translate.instant('NOTIFICATIONS.JUST_NOW');
    if (diffMins < 60) return this.translate.instant('NOTIFICATIONS.MINUTES_AGO', { count: diffMins });
    if (diffHours < 24) return this.translate.instant('NOTIFICATIONS.HOURS_AGO', { count: diffHours });
    if (diffDays < 7) return this.translate.instant('NOTIFICATIONS.DAYS_AGO', { count: diffDays });
    return date.toLocaleDateString();
  }

  /**
   * Track function for notifications
   */
  trackByNotification(index: number, notification: Notification): string {
    return notification.id;
  }
}

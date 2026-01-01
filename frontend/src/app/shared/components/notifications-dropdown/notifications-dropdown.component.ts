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
import { NotificationService } from '../../../services/notification.service';
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
  imports: [CommonModule, RouterModule, EmptyStateComponent, SkeletonComponent],
  templateUrl: './notifications-dropdown.component.html',
  styleUrl: './notifications-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  /** Event emitted when dropdown should close */
  readonly closed = output<void>();

  /** Loading state */
  readonly loading = signal(true);

  /** Error message */
  readonly error = signal<string | null>(null);

  /** Recent notifications */
  readonly notifications = signal<Notification[]>([]);

  /** Unread count from service */
  readonly unreadCount = this.notificationService.unreadCount;

  /** Track which notification is being marked as read */
  readonly markingAsRead = signal<string | null>(null);

  /** Track if marking all as read */
  readonly markingAllAsRead = signal(false);

  /** Flag to skip the initial click that opened the dropdown */
  private initialized = false;

  ngOnInit(): void {
    this.loadNotifications();

    // Delay enabling click-outside detection to prevent immediate close
    setTimeout(() => {
      this.initialized = true;
    }, 100);

    // Subscribe to new real-time notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        // Add new notification to the top of the list
        this.notifications.update(list => [notification, ...list.slice(0, 9)]);
      });
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
   * Load unread notifications
   */
  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notificationService.getUnreadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
          this.error.set('Failed to load notifications');
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle notification click - mark as read and close
   */
  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      // Don't use takeUntil here - the API call must complete even after component closes
      this.notificationService.markAsRead(notification.id)
        .subscribe({
          next: () => {
            this.notificationService.decrementUnreadCount();
          }
        });
    }
    this.closed.emit();
  }

  /**
   * Mark a single notification as read (button click)
   */
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.isRead || this.markingAsRead()) return;

    this.markingAsRead.set(notification.id);

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local list
          this.notifications.update(list =>
            list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
          );
          this.notificationService.decrementUnreadCount();
          this.markingAsRead.set(null);
        },
        error: (err) => {
          console.error('Failed to mark as read:', err);
          this.markingAsRead.set(null);
        }
      });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    if (this.markingAllAsRead() || this.unreadCount() === 0) return;

    this.markingAllAsRead.set(true);

    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update all local notifications to read
          this.notifications.update(list =>
            list.map(n => ({ ...n, isRead: true }))
          );
          this.notificationService.resetUnreadCount();
          this.markingAllAsRead.set(false);
        },
        error: (err) => {
          console.error('Failed to mark all as read:', err);
          this.markingAllAsRead.set(false);
        }
      });
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Track function for notifications
   */
  trackByNotification(index: number, notification: Notification): string {
    return notification.id;
  }
}

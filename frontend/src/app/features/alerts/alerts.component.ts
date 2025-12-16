import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StoreFacade } from '../../store/store.facade';
import { NotificationService } from '../../services/notification.service';
import { AlertRuleService } from '../../services/alert-rule.service';
import { Notification, NotificationSeverity, NotificationType, NotificationStats } from '../../models/notification.model';
import { AlertRule } from '../../models/alert-rule.model';

interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
}

/**
 * AlertsComponent - View for managing alert rules and notifications
 * Angular 17+ with signals, OnPush, Material UI
 * T159-T169: Alert and notification management
 */
@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit {
  private readonly facade = inject(StoreFacade);
  private readonly notificationService = inject(NotificationService);
  private readonly alertRuleService = inject(AlertRuleService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  trucks = this.facade.trucks;
  isLoading = signal(false);
  notifications = signal<Notification[]>([]);
  alertRules = signal<AlertRule[]>([]);
  selectedSeverity = signal<NotificationSeverity | null>(null);
  selectedType = signal<NotificationType | null>(null);
  showRead = signal(false);

  // Computed signals
  stats = computed((): AlertStats => {
    const allNotifications = this.notifications();
    return {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.isRead).length,
      critical: allNotifications.filter(n => n.severity === 'CRITICAL').length,
      warning: allNotifications.filter(n => n.severity === 'WARNING').length,
      info: allNotifications.filter(n => n.severity === 'INFO').length
    };
  });

  filteredNotifications = computed(() => {
    let filtered = this.notifications();
    const severity = this.selectedSeverity();
    const type = this.selectedType();
    const showRead = this.showRead();

    if (!showRead) {
      filtered = filtered.filter(n => !n.isRead);
    }

    if (severity) {
      filtered = filtered.filter(n => n.severity === severity);
    }

    if (type) {
      filtered = filtered.filter(n => n.notificationType === type);
    }

    return filtered.sort((a, b) =>
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  });

  ngOnInit(): void {
    this.facade.loadTrucks();
    this.loadNotifications();
    this.loadAlertRules();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getRecentNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load notifications:', error);
          this.isLoading.set(false);
          this.showError('Failed to load notifications');
          // Fallback to mock data for demo purposes
          this.generateMockNotifications();
        }
      });
  }

  loadAlertRules(): void {
    this.alertRuleService.getMyAlertRules()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rules) => {
          this.alertRules.set(rules);
        },
        error: (error) => {
          console.error('Failed to load alert rules:', error);
        }
      });
  }

  filterBySeverity(severity: NotificationSeverity | null): void {
    this.selectedSeverity.set(severity);
  }

  filterByType(type: NotificationType | null): void {
    this.selectedType.set(type);
  }

  toggleShowRead(): void {
    this.showRead.set(!this.showRead());
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const notifications = this.notifications();
          const index = notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            notifications[index] = updated;
            this.notifications.set([...notifications]);
          }
        },
        error: (error) => {
          console.error('Failed to mark as read:', error);
          // Fallback: update locally
          const notifications = this.notifications();
          const index = notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            notifications[index] = { ...notifications[index], isRead: true, readAt: new Date().toISOString() };
            this.notifications.set([...notifications]);
          }
        }
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const notifications = this.notifications().map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }));
          this.notifications.set(notifications);
          this.showSuccess(`Marked ${response.markedCount} notifications as read`);
        },
        error: (error) => {
          console.error('Failed to mark all as read:', error);
          // Fallback: update locally
          const notifications = this.notifications().map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }));
          this.notifications.set(notifications);
        }
      });
  }

  viewOnMap(notification: Notification): void {
    if (notification.latitude && notification.longitude) {
      this.router.navigate(['/map'], {
        queryParams: {
          lat: notification.latitude,
          lng: notification.longitude,
          truckId: notification.truckId,
          zoom: 15
        }
      });
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'info';
      default: return 'info';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'SPEED_LIMIT': return 'speed';
      case 'GEOFENCE_ENTER':
      case 'GEOFENCE_EXIT': return 'location_on';
      case 'IDLE': return 'pause_circle';
      case 'OFFLINE': return 'cloud_off';
      default: return 'notifications';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'severity-critical';
      case 'WARNING': return 'severity-warning';
      case 'INFO': return 'severity-info';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private generateMockNotifications(): void {
    const now = new Date();
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: 'user-1',
        alertRuleId: 'rule-1',
        truckId: 'TRUCK-001',
        notificationType: 'SPEED_LIMIT',
        title: 'Speed Limit Exceeded',
        message: 'Truck TRUCK-001 exceeded speed limit (95 km/h in 80 km/h zone)',
        severity: 'CRITICAL',
        isRead: false,
        latitude: 37.7749,
        longitude: -122.4194,
        triggeredAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        userId: 'user-1',
        alertRuleId: 'rule-2',
        truckId: 'TRUCK-002',
        notificationType: 'GEOFENCE_EXIT',
        title: 'Geofence Violation',
        message: 'Truck TRUCK-002 left authorized zone',
        severity: 'WARNING',
        isRead: false,
        latitude: 37.7849,
        longitude: -122.4094,
        triggeredAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        userId: 'user-1',
        alertRuleId: 'rule-3',
        truckId: 'TRUCK-003',
        notificationType: 'IDLE',
        title: 'Extended Idle Time',
        message: 'Truck TRUCK-003 has been idle for 2 hours',
        severity: 'INFO',
        isRead: true,
        triggeredAt: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
        readAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        userId: 'user-1',
        alertRuleId: 'rule-4',
        truckId: 'TRUCK-004',
        notificationType: 'OFFLINE',
        title: 'Truck Offline',
        message: 'Truck TRUCK-004 has been offline for 15 minutes',
        severity: 'WARNING',
        isRead: false,
        latitude: 37.7649,
        longitude: -122.4294,
        triggeredAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
      }
    ];

    this.notifications.set(mockNotifications);
    this.isLoading.set(false);
  }
}

import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed, DestroyRef, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StoreFacade } from '../../store/store.facade';
import { NotificationService } from '../../services/notification.service';
import { AlertRuleService } from '../../services/alert-rule.service';
import { GeofenceService } from '../../services/geofence.service';
import { Notification, NotificationSeverity, NotificationType, NotificationStats } from '../../models/notification.model';
import { AlertRule, AlertRuleType, CreateAlertRuleRequest } from '../../models/alert-rule.model';
import { Geofence } from '../../models/geofence.model';

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
    imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule
],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './alerts.component.html',
    styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('notificationList') notificationListRef!: ElementRef<HTMLElement>;
  private scrollObserver: IntersectionObserver | null = null;
  private readonly facade = inject(StoreFacade);
  private readonly notificationService = inject(NotificationService);
  private readonly alertRuleService = inject(AlertRuleService);
  private readonly geofenceService = inject(GeofenceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  // State signals
  trucks = this.facade.trucks;
  isLoading = signal(false);
  notifications = signal<Notification[]>([]);
  alertRules = signal<AlertRule[]>([]);
  geofences = signal<Geofence[]>([]);
  selectedSeverity = signal<NotificationSeverity | null>(null);
  selectedType = signal<NotificationType | null>(null);
  showRead = signal(false);
  isCreatingRule = signal(false);
  showRuleForm = signal(false);

  // Pagination state for infinite scroll
  currentPage = signal(0);
  pageSize = 30;
  hasMorePages = signal(true);
  isLoadingMore = signal(false);
  totalNotifications = signal(0);

  // Alert rule types for dropdown
  readonly ruleTypes: { value: AlertRuleType; label: string; icon: string }[] = [
    { value: 'SPEED_LIMIT', label: 'Speed Limit', icon: 'speed' },
    { value: 'GEOFENCE_ENTER', label: 'Geofence Enter', icon: 'login' },
    { value: 'GEOFENCE_EXIT', label: 'Geofence Exit', icon: 'logout' },
    { value: 'IDLE', label: 'Idle Time', icon: 'pause_circle' },
    { value: 'OFFLINE', label: 'Offline', icon: 'cloud_off' }
  ];

  // Alert rule form (T162)
  alertRuleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    ruleType: ['SPEED_LIMIT' as AlertRuleType, Validators.required],
    thresholdValue: [80, [Validators.min(0)]],
    geofenceId: [''],
    isEnabled: [true]
  });

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
    this.loadGeofences();
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  /**
   * Setup IntersectionObserver for infinite scroll
   */
  private setupInfiniteScroll(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const sentinel = document.getElementById('scroll-sentinel');
      if (sentinel) {
        this.scrollObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && this.hasMorePages() && !this.isLoadingMore() && !this.isLoading()) {
              this.loadMoreNotifications();
            }
          },
          { rootMargin: '100px' }
        );
        this.scrollObserver.observe(sentinel);
      }
    }, 100);
  }

  /**
   * Load initial notifications (first page)
   */
  loadNotifications(): void {
    this.isLoading.set(true);
    this.currentPage.set(0);
    this.hasMorePages.set(true);

    this.notificationService.getRecentNotificationsPaged(0, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.notifications.set(page.content);
          this.totalNotifications.set(page.totalElements);
          this.hasMorePages.set(!page.last);
          this.currentPage.set(0);
          this.isLoading.set(false);

          // Re-setup observer after content loads
          this.setupInfiniteScroll();
        },
        error: (error) => {
          console.error('Failed to load notifications:', error);
          this.isLoading.set(false);
          this.showError('Failed to load notifications');
          this.generateMockNotifications();
        }
      });
  }

  /**
   * Load more notifications (infinite scroll)
   */
  loadMoreNotifications(): void {
    if (!this.hasMorePages() || this.isLoadingMore()) {
      return;
    }

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;

    this.notificationService.getRecentNotificationsPaged(nextPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          // Append new notifications to existing list
          this.notifications.update(current => [...current, ...page.content]);
          this.currentPage.set(nextPage);
          this.hasMorePages.set(!page.last);
          this.isLoadingMore.set(false);
        },
        error: (error) => {
          console.error('Failed to load more notifications:', error);
          this.isLoadingMore.set(false);
          this.showError('Failed to load more notifications');
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

  loadGeofences(): void {
    this.geofenceService.getAllGeofences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (geofences) => {
          this.geofences.set(geofences);
        },
        error: (error) => {
          console.error('Failed to load geofences:', error);
        }
      });
  }

  // T162: Toggle alert rule form visibility
  toggleRuleForm(): void {
    this.showRuleForm.set(!this.showRuleForm());
    if (!this.showRuleForm()) {
      this.resetForm();
    }
  }

  // T162: Create new alert rule
  createAlertRule(): void {
    if (this.alertRuleForm.invalid) {
      this.alertRuleForm.markAllAsTouched();
      return;
    }

    this.isCreatingRule.set(true);
    const formValue = this.alertRuleForm.value;

    const request: CreateAlertRuleRequest = {
      name: formValue.name,
      description: formValue.description || undefined,
      ruleType: formValue.ruleType,
      thresholdValue: this.requiresThreshold(formValue.ruleType) ? formValue.thresholdValue : undefined,
      geofenceId: this.requiresGeofence(formValue.ruleType) ? formValue.geofenceId : undefined,
      isEnabled: formValue.isEnabled,
      notificationChannels: ['IN_APP']
    };

    this.alertRuleService.createAlertRule(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rule) => {
          this.alertRules.update(rules => [...rules, rule]);
          this.showSuccess(`Alert rule "${rule.name}" created successfully`);
          this.resetForm();
          this.showRuleForm.set(false);
          this.isCreatingRule.set(false);
        },
        error: (error) => {
          console.error('Failed to create alert rule:', error);
          this.showError('Failed to create alert rule');
          this.isCreatingRule.set(false);
        }
      });
  }

  // Toggle alert rule enabled/disabled
  toggleRuleEnabled(rule: AlertRule): void {
    this.alertRuleService.setEnabled(rule.id, !rule.isEnabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedRule) => {
          this.alertRules.update(rules =>
            rules.map(r => r.id === updatedRule.id ? updatedRule : r)
          );
          this.showSuccess(`Rule "${rule.name}" ${updatedRule.isEnabled ? 'enabled' : 'disabled'}`);
        },
        error: (error) => {
          console.error('Failed to toggle rule:', error);
          this.showError('Failed to update alert rule');
        }
      });
  }

  // Delete alert rule
  deleteAlertRule(rule: AlertRule): void {
    if (!confirm(`Are you sure you want to delete the alert rule "${rule.name}"?`)) {
      return;
    }

    this.alertRuleService.deleteAlertRule(rule.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertRules.update(rules => rules.filter(r => r.id !== rule.id));
          this.showSuccess(`Alert rule "${rule.name}" deleted`);
        },
        error: (error) => {
          console.error('Failed to delete rule:', error);
          this.showError('Failed to delete alert rule');
        }
      });
  }

  // Check if rule type requires threshold value
  requiresThreshold(ruleType: AlertRuleType): boolean {
    return ['SPEED_LIMIT', 'IDLE', 'OFFLINE'].includes(ruleType);
  }

  // Check if rule type requires geofence
  requiresGeofence(ruleType: AlertRuleType): boolean {
    return ['GEOFENCE_ENTER', 'GEOFENCE_EXIT'].includes(ruleType);
  }

  // Get threshold label based on rule type
  getThresholdLabel(ruleType: AlertRuleType): string {
    switch (ruleType) {
      case 'SPEED_LIMIT': return 'Speed Limit (km/h)';
      case 'IDLE': return 'Idle Time (minutes)';
      case 'OFFLINE': return 'Offline Duration (minutes)';
      default: return 'Threshold Value';
    }
  }

  // Get rule type icon
  getRuleTypeIcon(ruleType: AlertRuleType): string {
    return this.ruleTypes.find(t => t.value === ruleType)?.icon || 'notifications';
  }

  private resetForm(): void {
    this.alertRuleForm.reset({
      name: '',
      description: '',
      ruleType: 'SPEED_LIMIT',
      thresholdValue: 80,
      geofenceId: '',
      isEnabled: true
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
    if (notification.isRead) return; // Already read

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
          // Update unread count in header badge
          this.notificationService.decrementUnreadCount();
        },
        error: (error) => {
          console.error('Failed to mark as read:', error);
          // Fallback: update locally
          const notifications = this.notifications();
          const index = notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            notifications[index] = { ...notifications[index], isRead: true, readAt: new Date().toISOString() };
            this.notifications.set([...notifications]);
            // Still update badge count on fallback
            this.notificationService.decrementUnreadCount();
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
          // Reset unread count to 0 in header badge
          this.notificationService.resetUnreadCount();
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
          // Still reset badge count on fallback
          this.notificationService.resetUnreadCount();
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

  /**
   * T171: Generate ARIA label for notification
   */
  getNotificationAriaLabel(notification: Notification): string {
    const readStatus = notification.isRead ? 'Read' : 'Unread';
    const date = this.formatDate(notification.triggeredAt);
    return `${readStatus} ${notification.severity} notification: ${notification.title}. ${notification.message}. Triggered at ${date}. Press Enter to view on map, or M to mark as read.`;
  }

  /**
   * T171: Handle keyboard navigation for notification items
   * - Enter/Space: View on map if location available
   * - M: Mark as read
   * - Arrow keys: Navigate between notifications
   */
  onNotificationKeydown(event: KeyboardEvent, notification: Notification): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (notification.latitude && notification.longitude) {
          this.viewOnMap(notification);
        }
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        if (!notification.isRead) {
          this.markAsRead(notification);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextNotification(event.target as HTMLElement);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousNotification(event.target as HTMLElement);
        break;
    }
  }

  /**
   * Focus next notification in list
   */
  private focusNextNotification(currentElement: HTMLElement): void {
    const nextElement = currentElement.nextElementSibling as HTMLElement;
    if (nextElement && nextElement.classList.contains('alert-card')) {
      nextElement.focus();
    }
  }

  /**
   * Focus previous notification in list
   */
  private focusPreviousNotification(currentElement: HTMLElement): void {
    const prevElement = currentElement.previousElementSibling as HTMLElement;
    if (prevElement && prevElement.classList.contains('alert-card')) {
      prevElement.focus();
    }
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

import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed, DestroyRef, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StoreFacade } from '../../store/store.facade';
import { NotificationService } from '../../services/notification.service';
import { AlertRuleService } from '../../services/alert-rule.service';
import { GeofenceService } from '../../services/geofence.service';
import { Notification, NotificationSeverity, NotificationType, NotificationStats } from '../../models/notification.model';
import { AlertRule, AlertRuleType, CreateAlertRuleRequest } from '../../models/alert-rule.model';
import { Geofence } from '../../models/geofence.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

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
      EmptyStateComponent
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
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  // State signals from NgRx store
  trucks = this.facade.trucks;
  isLoading = this.facade.notificationsLoading;
  notifications = this.facade.notifications;
  alertRules = signal<AlertRule[]>([]);
  geofences = signal<Geofence[]>([]);
  selectedSeverity = signal<NotificationSeverity | null>(null);
  selectedType = signal<NotificationType | null>(null);
  showRead = signal(false);
  isCreatingRule = signal(false);
  showRuleForm = signal(false);

  // Pagination state from NgRx store
  readonly currentPage = this.facade.currentPage;
  readonly pageSize = 30;
  readonly hasMorePages = this.facade.hasMorePages;
  readonly isLoadingMore = this.facade.loadingMore;
  readonly totalNotifications = this.facade.totalElements;

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
   * Load initial notifications (first page) via NgRx store
   */
  loadNotifications(): void {
    this.facade.loadNotificationsPaged(0, this.pageSize);
    // Re-setup observer after a short delay for content to load
    setTimeout(() => this.setupInfiniteScroll(), 200);
  }

  /**
   * Load more notifications (infinite scroll) via NgRx store
   */
  loadMoreNotifications(): void {
    if (!this.hasMorePages() || this.isLoadingMore()) {
      return;
    }
    const nextPage = this.currentPage() + 1;
    this.facade.loadMoreNotifications(nextPage, this.pageSize);
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
    // Use NgRx store - effect handles API call and state update
    this.facade.markNotificationAsRead(notification.id);
  }

  markAllAsRead(): void {
    // Use NgRx store - effect handles API call and state update
    this.facade.markAllNotificationsAsRead();
    this.showSuccess('Marking all notifications as read');
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
    this.toast.error(message);
  }

  private showSuccess(message: string): void {
    this.toast.success(message);
  }
}

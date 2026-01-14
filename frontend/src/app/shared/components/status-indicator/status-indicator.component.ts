import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';

/**
 * StatusIndicatorComponent
 *
 * Displays a visual indicator of backend services health status.
 * Shows a colored dot (green/orange/red) with a popup showing individual service statuses.
 */
@Component({
  selector: 'app-status-indicator',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './status-indicator.component.html',
  styleUrls: ['./status-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusIndicatorComponent implements OnInit, OnDestroy {
  private readonly facade = inject(StoreFacade);

  /** Whether the popup is visible */
  readonly showPopup = signal(false);

  /** Timeout for hiding popup (allows mouse to move from button to popup) */
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  /** View model from store */
  readonly viewModel = this.facade.statusIndicatorViewModel;

  /** Overall health status */
  readonly status = this.facade.healthStatus;

  /** Whether monitoring is active */
  readonly monitoringActive = this.facade.healthMonitoringActive;

  /** Loading state */
  readonly loading = this.facade.healthLoading;

  /** Computed CSS class for the status indicator */
  readonly statusClass = computed(() => {
    const status = this.status();
    switch (status) {
      case 'UP':
        return 'status-up';
      case 'DEGRADED':
        return 'status-degraded';
      case 'DOWN':
        return 'status-down';
      default:
        return 'status-unknown';
    }
  });

  /** Computed tooltip text */
  readonly tooltipKey = computed(() => {
    const status = this.status();
    switch (status) {
      case 'UP':
        return 'HEALTH.STATUS_UP';
      case 'DEGRADED':
        return 'HEALTH.STATUS_DEGRADED';
      case 'DOWN':
        return 'HEALTH.STATUS_DOWN';
      default:
        return 'HEALTH.STATUS_UNKNOWN';
    }
  });

  ngOnInit(): void {
    // Start health monitoring when component initializes
    this.facade.startHealthMonitoring();
  }

  ngOnDestroy(): void {
    // Stop health monitoring when component is destroyed
    this.facade.stopHealthMonitoring();
    // Clear any pending timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  /** Show the popup on hover/click */
  onShowPopup(): void {
    // Cancel any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showPopup.set(true);
  }

  /** Hide the popup with a small delay */
  onHidePopup(): void {
    // Add delay to allow mouse to move from button to popup
    this.hideTimeout = setTimeout(() => {
      this.showPopup.set(false);
      this.hideTimeout = null;
    }, 150);
  }

  /** Toggle popup visibility (for mobile) */
  onTogglePopup(): void {
    this.showPopup.update(v => !v);
  }

  /** Trigger a manual health check */
  onRefresh(): void {
    this.facade.checkHealth();
  }

  /** Format response time for display */
  formatResponseTime(ms: number | null): string {
    if (ms === null) return '-';
    return `${ms}ms`;
  }

  /** Get relative time since last check */
  getTimeSinceLastCheck(): string {
    const vm = this.viewModel();
    if (!vm?.lastChecked) return '';

    const now = new Date();
    const checked = new Date(vm.lastChecked);
    const diffMs = now.getTime() - checked.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    return `${Math.floor(diffSec / 3600)}h`;
  }
}

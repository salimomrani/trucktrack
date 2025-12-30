import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TruckStatus } from '../../../models/truck.model';
import { StoreFacade } from '../../../store/store.facade';

/**
 * FilterPanelComponent - Filter trucks by status
 * T104: Create FilterPanelComponent with Tailwind checkbox group for status filters
 * Features:
 * - Filter by ACTIVE, IDLE, OFFLINE status
 * - Clear all filters button
 * - Show count per status
 * - Keyboard accessible (Space to toggle)
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanelComponent {
  private readonly facade = inject(StoreFacade);

  // All trucks from store
  readonly trucks = this.facade.trucks;

  // Selected status filters (all selected by default = show all trucks)
  readonly activeFilter = signal(true);
  readonly idleFilter = signal(true);
  readonly offlineFilter = signal(true);

  // Computed: selected statuses array
  readonly selectedStatuses = computed(() => {
    const statuses: TruckStatus[] = [];
    if (this.activeFilter()) statuses.push(TruckStatus.ACTIVE);
    if (this.idleFilter()) statuses.push(TruckStatus.IDLE);
    if (this.offlineFilter()) statuses.push(TruckStatus.OFFLINE);
    return statuses;
  });

  // Computed: count per status
  readonly activeCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.ACTIVE).length
  );
  readonly idleCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.IDLE).length
  );
  readonly offlineCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.OFFLINE).length
  );

  // Computed: check if any filter is applied (not all selected)
  readonly hasActiveFilters = computed(() => {
    return !(this.activeFilter() && this.idleFilter() && this.offlineFilter());
  });

  // Computed: filtered trucks count
  readonly filteredCount = computed(() => {
    const statuses = this.selectedStatuses();
    return this.trucks().filter(t => statuses.includes(t.status)).length;
  });

  /**
   * Toggle ACTIVE status filter
   */
  toggleActive(): void {
    this.activeFilter.update(v => !v);
    this.applyFilters();
  }

  /**
   * Toggle IDLE status filter
   */
  toggleIdle(): void {
    this.idleFilter.update(v => !v);
    this.applyFilters();
  }

  /**
   * Toggle OFFLINE status filter
   */
  toggleOffline(): void {
    this.offlineFilter.update(v => !v);
    this.applyFilters();
  }

  /**
   * Clear all filters (show all trucks)
   * T109: Implement "Clear Filter" button
   */
  clearFilters(): void {
    this.activeFilter.set(true);
    this.idleFilter.set(true);
    this.offlineFilter.set(true);
    this.applyFilters();
  }

  /**
   * Apply filters to store
   * T106: Emit selectedStatuses to store
   */
  private applyFilters(): void {
    this.facade.setStatusFilters(this.selectedStatuses());
  }

  /**
   * Handle keyboard navigation
   * T113: Ensure keyboard navigation works (Space to toggle checkbox)
   */
  onKeydown(event: KeyboardEvent, status: 'active' | 'idle' | 'offline'): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      switch (status) {
        case 'active':
          this.toggleActive();
          break;
        case 'idle':
          this.toggleIdle();
          break;
        case 'offline':
          this.toggleOffline();
          break;
      }
    }
  }
}

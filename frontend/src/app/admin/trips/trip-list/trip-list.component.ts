import { Component, OnInit, OnDestroy, inject, signal, DestroyRef, ChangeDetectionStrategy, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { DataTableComponent, ColumnDef, PageInfo } from '../../shared/data-table/data-table.component';
import { TripResponse, TripStatus, TRIP_STATUSES, TRIP_STATUS_COLORS } from '../trip.model';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { StoreFacade } from '../../../store/store.facade';

/**
 * Trip list component with search, filter, pagination, and auto-refresh.
 * T045-T048: Create TripListComponent with filters and auto-refresh
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 *
 * Refactored to use NgRx store for state management via StoreFacade.
 */
@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    BreadcrumbComponent
  ],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly facade = inject(StoreFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.openDropdownId.set(null);
    }
  }

  toggleDropdown(tripId: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.update(current => current === tripId ? null : tripId);
  }

  // State from store (using view model selector)
  readonly viewModel = this.facade.tripsListViewModel;

  // Derived signals from view model
  readonly trips = computed(() => this.viewModel()?.trips ?? []);
  readonly totalElements = computed(() => this.viewModel()?.pagination?.totalElements ?? 0);
  readonly loading = computed(() => this.viewModel()?.loading ?? false);
  readonly stats = computed(() => this.viewModel()?.stats ?? {});
  readonly pageIndex = computed(() => this.viewModel()?.pagination?.page ?? 0);
  readonly pageSize = computed(() => this.viewModel()?.pagination?.size ?? 25);
  readonly hasFilters = computed(() => {
    const filters = this.viewModel()?.filters;
    if (!filters) return false;
    return filters.status !== null ||
      (filters.search !== null && filters.search !== '') ||
      filters.driverId !== null ||
      filters.truckId !== null ||
      filters.startDate !== null ||
      filters.endDate !== null;
  });

  // Local filter state (for form binding - synced to store on change)
  searchTerm = '';
  selectedStatus: TripStatus | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Auto-refresh
  autoRefreshEnabled = true;
  private autoRefreshSubscription: Subscription | null = null;
  private readonly AUTO_REFRESH_INTERVAL = 10000; // 10 seconds

  // Column definitions
  columns: ColumnDef[] = [
    { key: 'origin', header: 'Origin', sortable: true },
    { key: 'destination', header: 'Destination', sortable: true },
    { key: 'status', header: 'Status', type: 'badge', sortable: true, badgeColors: TRIP_STATUS_COLORS },
    { key: 'assignedDriverName', header: 'Driver', sortable: false },
    { key: 'assignedTruckName', header: 'Truck', sortable: false },
    { key: 'scheduledAt', header: 'Scheduled', type: 'date', sortable: true },
    { key: 'createdAt', header: 'Created', type: 'date', sortable: true }
  ];

  statuses = TRIP_STATUSES;

  ngOnInit() {
    // Initialize local filter state from store
    const vm = this.viewModel();
    if (vm?.filters) {
      this.searchTerm = vm.filters.search || '';
      this.selectedStatus = vm.filters.status;
      this.startDate = vm.filters.startDate ? new Date(vm.filters.startDate) : null;
      this.endDate = vm.filters.endDate ? new Date(vm.filters.endDate) : null;
    }

    // Load initial data
    this.facade.loadTrips({ page: 0, size: 25 });
    this.facade.loadTripStats();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  /**
   * Refresh trips list (used by refresh button)
   */
  loadTrips() {
    this.facade.loadTrips({});
    this.facade.loadTripStats();
  }

  onSearch() {
    this.facade.setTripsSearchQuery(this.searchTerm);
  }

  onFilterChange() {
    // Status filter changed via dropdown
    this.facade.setTripsStatusFilter(this.selectedStatus);
  }

  onStatusChipClick(status: TripStatus | null) {
    this.selectedStatus = this.selectedStatus === status ? null : status;
    this.facade.setTripsStatusFilter(this.selectedStatus);
  }

  onPageChange(pageInfo: PageInfo) {
    this.facade.loadTrips({ page: pageInfo.page, size: pageInfo.size });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.facade.clearTripsFilters();
  }

  onDateRangeChange() {
    this.facade.setTripsDateFilter(
      this.startDate?.toISOString() ?? null,
      this.endDate?.toISOString() ?? null
    );
  }

  onStartDateChange(dateStr: string) {
    this.startDate = dateStr ? new Date(dateStr) : null;
    this.onDateRangeChange();
  }

  onEndDateChange(dateStr: string) {
    this.endDate = dateStr ? new Date(dateStr) : null;
    this.onDateRangeChange();
  }

  createTrip() {
    this.router.navigate(['/admin/trips/new']);
  }

  viewTrip(trip: TripResponse) {
    this.router.navigate(['/admin/trips', trip.id]);
  }

  onRowClick(trip: TripResponse) {
    this.viewTrip(trip);
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
      this.toast.info('Auto-refresh enabled (every 10s)');
    } else {
      this.stopAutoRefresh();
      this.toast.info('Auto-refresh disabled');
    }
  }

  private startAutoRefresh() {
    if (this.autoRefreshSubscription) {
      return;
    }
    this.autoRefreshSubscription = interval(this.AUTO_REFRESH_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.autoRefreshEnabled) {
          // Reload with current filters (store holds the state)
          this.facade.loadTrips({});
          this.facade.loadTripStats();
        }
      });
  }

  private stopAutoRefresh() {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
  }

  confirmCancel(trip: TripResponse) {
    this.confirmDialog.open({
      title: 'Cancel Trip',
      message: `Are you sure you want to cancel the trip from "${trip.origin}" to "${trip.destination}"?`,
      confirmText: 'Cancel Trip',
      confirmColor: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.facade.cancelTrip(trip.id);
      }
    });
  }

  getStatusCount(status: TripStatus): number {
    return this.stats()[status] || 0;
  }

  isActiveStatus(status: TripStatus): boolean {
    return status === 'ASSIGNED' || status === 'IN_PROGRESS';
  }
}

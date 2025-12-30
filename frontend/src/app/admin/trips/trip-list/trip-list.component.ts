import { Component, OnInit, OnDestroy, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { interval, Subscription } from 'rxjs';
import { DataTableComponent, ColumnDef, PageInfo } from '../../shared/data-table/data-table.component';
import { TripService } from '../trip.service';
import { TripResponse, TripStatus, TRIP_STATUSES, TRIP_STATUS_COLORS } from '../trip.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Trip list component with search, filter, pagination, and auto-refresh.
 * T045-T048: Create TripListComponent with filters and auto-refresh
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 */
@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DataTableComponent,
    BreadcrumbComponent
  ],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // State
  trips = signal<TripResponse[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  stats = signal<{ [key: string]: number }>({});

  // Filters
  searchTerm = '';
  selectedStatus: TripStatus | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 25;

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
    this.loadTrips();
    this.loadStats();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  loadTrips() {
    this.loading.set(true);
    this.tripService.getTrips(
      this.pageIndex,
      this.pageSize,
      this.searchTerm || undefined,
      this.selectedStatus || undefined,
      undefined, // driverId
      undefined, // truckId
      this.startDate?.toISOString(),
      this.endDate?.toISOString()
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.trips.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trips:', err);
        this.snackBar.open('Failed to load trips', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    this.tripService.getTripStats().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadTrips();
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadTrips();
  }

  onStatusChipClick(status: TripStatus | null) {
    this.selectedStatus = this.selectedStatus === status ? null : status;
    this.pageIndex = 0;
    this.loadTrips();
  }

  onPageChange(pageInfo: PageInfo) {
    this.pageIndex = pageInfo.page;
    this.pageSize = pageInfo.size;
    this.loadTrips();
  }

  hasFilters(): boolean {
    return !!this.searchTerm || !!this.selectedStatus || !!this.startDate || !!this.endDate;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.pageIndex = 0;
    this.loadTrips();
  }

  onDateRangeChange() {
    this.pageIndex = 0;
    this.loadTrips();
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
      this.snackBar.open('Auto-refresh enabled (every 10s)', 'Close', { duration: 2000 });
    } else {
      this.stopAutoRefresh();
      this.snackBar.open('Auto-refresh disabled', 'Close', { duration: 2000 });
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
          this.loadTrips();
          this.loadStats();
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Trip',
        message: `Are you sure you want to cancel the trip from "${trip.origin}" to "${trip.destination}"?`,
        confirmText: 'Cancel Trip',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) {
        this.cancelTrip(trip);
      }
    });
  }

  private cancelTrip(trip: TripResponse) {
    this.tripService.cancelTrip(trip.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Trip cancelled', 'Close', { duration: 3000 });
        this.loadTrips();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to cancel trip:', err);
        this.snackBar.open(err.error?.message || 'Failed to cancel trip', 'Close', { duration: 3000 });
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

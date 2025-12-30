import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, ColumnDef, PageInfo } from '../../shared/data-table/data-table.component';
import { TruckAdminService } from '../truck-admin.service';
import { TruckAdminResponse, TruckStatus, TRUCK_STATUSES, TRUCK_STATUS_COLORS } from '../truck.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { StoreFacade } from '../../../store/store.facade';
import { ToastService } from '../../../shared/components/toast/toast.service';

/**
 * Truck list component with search, filter, and pagination.
 * T070-T071: Create TruckListComponent with DataTable
 * T074: Add out-of-service/activate buttons with confirmation
 * Feature: 002-admin-panel
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
    selector: 'app-truck-list',
    imports: [
    FormsModule,
    MatDialogModule,
    DataTableComponent,
    BreadcrumbComponent
],
    templateUrl: './truck-list.component.html',
    styleUrls: ['./truck-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruckListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly truckService = inject(TruckAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(StoreFacade);

  // State
  trucks = signal<TruckAdminResponse[]>([]);
  totalElements = signal(0);
  loading = signal(false);

  // Filters
  searchTerm = '';
  selectedStatus: TruckStatus | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 25;

  // Column definitions
  columns: ColumnDef[] = [
    { key: 'truckId', header: 'Truck ID', sortable: true },
    { key: 'licensePlate', header: 'License Plate', sortable: true },
    { key: 'vehicleType', header: 'Type', sortable: true },
    { key: 'driverName', header: 'Driver', sortable: true },
    { key: 'status', header: 'Status', type: 'badge', sortable: true, badgeColors: TRUCK_STATUS_COLORS },
    { key: 'primaryGroupName', header: 'Primary Group', sortable: false },
    { key: 'lastUpdate', header: 'Last Update', type: 'date', sortable: true },
    { key: 'createdAt', header: 'Created', type: 'date', sortable: true }
  ];

  statuses = TRUCK_STATUSES;

  ngOnInit() {
    this.loadTrucks();
  }

  loadTrucks() {
    // T023: Trigger cache check for stale-while-revalidate pattern
    this.facade.checkTrucksCache();

    this.loading.set(true);
    this.truckService.getTrucks(
      this.pageIndex,
      this.pageSize,
      this.searchTerm || undefined,
      this.selectedStatus || undefined
    ).subscribe({
      next: (response) => {
        this.trucks.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trucks:', err);
        this.toast.error('Failed to load trucks');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadTrucks();
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadTrucks();
  }

  onPageChange(pageInfo: PageInfo) {
    this.pageIndex = pageInfo.page;
    this.pageSize = pageInfo.size;
    this.loadTrucks();
  }

  hasFilters(): boolean {
    return !!this.searchTerm || !!this.selectedStatus;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.pageIndex = 0;
    this.loadTrucks();
  }

  createTruck() {
    this.router.navigate(['/admin/trucks/new']);
  }

  editTruck(truck: TruckAdminResponse) {
    this.router.navigate(['/admin/trucks', truck.id]);
  }

  onRowClick(truck: TruckAdminResponse) {
    this.editTruck(truck);
  }

  confirmOutOfService(truck: TruckAdminResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Mark Out of Service',
        message: `Are you sure you want to mark truck ${truck.truckId} as out of service? It will no longer be tracked.`,
        confirmText: 'Confirm',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.markOutOfService(truck);
      }
    });
  }

  confirmActivate(truck: TruckAdminResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activate Truck',
        message: `Are you sure you want to activate truck ${truck.truckId}?`,
        confirmText: 'Activate',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.activateTruck(truck);
      }
    });
  }

  private markOutOfService(truck: TruckAdminResponse) {
    this.truckService.markOutOfService(truck.id).subscribe({
      next: () => {
        this.toast.success(`Truck ${truck.truckId} marked as out of service`);
        // T023: Invalidate cache after CRUD operation
        this.facade.invalidateTrucksCache();
        this.loadTrucks();
      },
      error: (err) => {
        console.error('Failed to mark truck out of service:', err);
        this.toast.error(err.error?.message || 'Failed to update truck');
      }
    });
  }

  private activateTruck(truck: TruckAdminResponse) {
    this.truckService.activateTruck(truck.id).subscribe({
      next: () => {
        this.toast.success(`Truck ${truck.truckId} activated`);
        // T023: Invalidate cache after CRUD operation
        this.facade.invalidateTrucksCache();
        this.loadTrucks();
      },
      error: (err) => {
        console.error('Failed to activate truck:', err);
        this.toast.error(err.error?.message || 'Failed to activate truck');
      }
    });
  }
}

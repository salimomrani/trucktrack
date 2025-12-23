import { Component, OnInit, inject, signal } from '@angular/core';

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
import { DataTableComponent, ColumnDef, PageInfo } from '../../shared/data-table/data-table.component';
import { TruckAdminService } from '../truck-admin.service';
import { TruckAdminResponse, TruckStatus, TRUCK_STATUSES, TRUCK_STATUS_COLORS } from '../truck.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Truck list component with search, filter, and pagination.
 * T070-T071: Create TruckListComponent with DataTable
 * T074: Add out-of-service/activate buttons with confirmation
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-truck-list',
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
    DataTableComponent,
    BreadcrumbComponent
],
    templateUrl: './truck-list.component.html',
    styleUrls: ['./truck-list.component.scss']
})
export class TruckListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly truckService = inject(TruckAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Failed to load trucks', 'Close', { duration: 3000 });
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
        this.snackBar.open(`Truck ${truck.truckId} marked as out of service`, 'Close', { duration: 3000 });
        this.loadTrucks();
      },
      error: (err) => {
        console.error('Failed to mark truck out of service:', err);
        this.snackBar.open(err.error?.message || 'Failed to update truck', 'Close', { duration: 3000 });
      }
    });
  }

  private activateTruck(truck: TruckAdminResponse) {
    this.truckService.activateTruck(truck.id).subscribe({
      next: () => {
        this.snackBar.open(`Truck ${truck.truckId} activated`, 'Close', { duration: 3000 });
        this.loadTrucks();
      },
      error: (err) => {
        console.error('Failed to activate truck:', err);
        this.snackBar.open(err.error?.message || 'Failed to activate truck', 'Close', { duration: 3000 });
      }
    });
  }
}

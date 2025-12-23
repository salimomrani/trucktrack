import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule,
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
  template: `
    <div class="truck-list-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="[{ label: 'Trucks', icon: 'local_shipping' }]"></app-breadcrumb>

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>Truck Management</h1>
          <p class="subtitle">Manage fleet vehicles and their status</p>
        </div>
        <button mat-raised-button color="primary" (click)="createTruck()">
          <mat-icon>add</mat-icon>
          Add Truck
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput
                   placeholder="Search by truck ID, license plate, driver..."
                   [(ngModel)]="searchTerm"
                   (input)="onSearch()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="selectedStatus" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option *ngFor="let status of statuses" [value]="status.value">
                {{ status.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="clearFilters()" *ngIf="hasFilters()">
            <mat-icon>clear</mat-icon>
            Clear
          </button>
        </div>
      </mat-card>

      <!-- Trucks Table -->
      <mat-card class="table-card">
        <app-data-table
          [columns]="columns"
          [data]="trucks()"
          [totalElements]="totalElements()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [isLoading]="loading()"
          [searchable]="false"
          [showActions]="false"
          [rowClickable]="true"
          (pageChange)="onPageChange($event)"
          (onRowClick)="onRowClick($event)">
        </app-data-table>

        <!-- Actions column rendered separately -->
        <ng-template #actionsTemplate let-truck>
          <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="editTruck(truck)">
              <mat-icon>edit</mat-icon>
              <span>Edit</span>
            </button>
            <button mat-menu-item
                    *ngIf="truck.status !== 'OUT_OF_SERVICE'"
                    (click)="confirmOutOfService(truck)">
              <mat-icon color="warn">block</mat-icon>
              <span>Mark Out of Service</span>
            </button>
            <button mat-menu-item
                    *ngIf="truck.status === 'OUT_OF_SERVICE'"
                    (click)="confirmActivate(truck)">
              <mat-icon color="primary">check_circle</mat-icon>
              <span>Activate</span>
            </button>
          </mat-menu>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`
    .truck-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #757575;
    }

    .filters-card {
      margin-bottom: 16px;
      padding: 16px 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      width: 180px;
    }

    .table-card {
      padding: 0;
    }
  `]
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

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TruckAdminService } from '../truck-admin.service';
import { TruckAdminResponse, CreateTruckRequest, UpdateTruckRequest, VEHICLE_TYPES, TRUCK_STATUSES } from '../truck.model';
import { AuditLogComponent } from '../../shared/audit-log/audit-log.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Truck form component for create and edit.
 * T072-T073: TruckFormComponent with group assignment
 * Feature: 002-admin-panel
 */
@Component({
  selector: 'app-truck-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    AuditLogComponent,
    BreadcrumbComponent
  ],
  template: `
    <div class="truck-form-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="breadcrumbItems()"></app-breadcrumb>

      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h1>{{ isEditMode() ? 'Edit Truck' : 'Add Truck' }}</h1>
          <p class="subtitle" *ngIf="isEditMode()">{{ truck()?.truckId }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Form -->
      <div class="form-content" *ngIf="!loading()">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Truck Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width" *ngIf="!isEditMode()">
                <mat-label>Truck ID</mat-label>
                <input matInput formControlName="truckId" placeholder="TRUCK-001">
                <mat-icon matSuffix>local_shipping</mat-icon>
                <mat-hint>Unique identifier for the truck</mat-hint>
                <mat-error *ngIf="form.get('truckId')?.hasError('required')">
                  Truck ID is required
                </mat-error>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>License Plate</mat-label>
                  <input matInput formControlName="licensePlate" placeholder="ABC-1234">
                  <mat-error *ngIf="form.get('licensePlate')?.hasError('maxlength')">
                    License plate must not exceed 100 characters
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Vehicle Type</mat-label>
                  <mat-select formControlName="vehicleType">
                    <mat-option *ngFor="let type of vehicleTypes" [value]="type">
                      {{ type }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="form.get('vehicleType')?.hasError('required')">
                    Vehicle type is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Driver Name</mat-label>
                  <input matInput formControlName="driverName" placeholder="John Doe">
                  <mat-icon matSuffix>person</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Driver Phone</mat-label>
                  <input matInput formControlName="driverPhone" placeholder="+1 555-123-4567">
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width" *ngIf="!isEditMode()">
                <mat-label>Primary Group</mat-label>
                <mat-select formControlName="primaryGroupId">
                  <mat-option value="">Select a group</mat-option>
                  <!-- Groups would be loaded from API -->
                </mat-select>
                <mat-hint>The main group this truck belongs to</mat-hint>
                <mat-error *ngIf="form.get('primaryGroupId')?.hasError('required')">
                  Primary group is required
                </mat-error>
              </mat-form-field>

              <mat-divider></mat-divider>

              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()">Cancel</button>
                <button mat-raised-button color="primary" type="submit"
                        [disabled]="form.invalid || saving()">
                  <mat-spinner diameter="20" *ngIf="saving()"></mat-spinner>
                  <span *ngIf="!saving()">{{ isEditMode() ? 'Save Changes' : 'Add Truck' }}</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Status Card (Edit Mode Only) -->
        <mat-card class="status-card" *ngIf="isEditMode() && truck()">
          <mat-card-header>
            <mat-card-title>Truck Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-info">
              <div class="status-row">
                <span class="label">Status:</span>
                <mat-chip [class]="'status-' + truck()?.status?.toLowerCase()">
                  {{ truck()?.statusDisplay }}
                </mat-chip>
              </div>
              <div class="status-row">
                <span class="label">Last Update:</span>
                <span>{{ truck()?.lastUpdate ? (truck()?.lastUpdate | date:'medium') : 'Never' }}</span>
              </div>
              <div class="status-row">
                <span class="label">Location:</span>
                <span *ngIf="truck()?.currentLatitude && truck()?.currentLongitude">
                  {{ truck()?.currentLatitude | number:'1.4-4' }}, {{ truck()?.currentLongitude | number:'1.4-4' }}
                </span>
                <span *ngIf="!truck()?.currentLatitude">No location data</span>
              </div>
              <div class="status-row">
                <span class="label">Speed:</span>
                <span>{{ truck()?.currentSpeed ? (truck()?.currentSpeed + ' km/h') : 'N/A' }}</span>
              </div>
              <div class="status-row">
                <span class="label">Primary Group:</span>
                <span>{{ truck()?.primaryGroupName || 'None' }}</span>
              </div>
              <div class="status-row">
                <span class="label">Created:</span>
                <span>{{ truck()?.createdAt | date:'medium' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Audit Log (Edit Mode Only) -->
        <mat-card class="audit-card" *ngIf="isEditMode() && truckId()">
          <app-audit-log
            entityType="TRUCK"
            [entityId]="truckId()!">
          </app-audit-log>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .truck-form-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-text h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #757575;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-card, .status-card, .audit-card {
      padding: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    .status-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-row .label {
      width: 120px;
      font-weight: 500;
      color: #757575;
    }

    mat-chip.status-active {
      background-color: #4caf50 !important;
      color: white !important;
    }

    mat-chip.status-idle {
      background-color: #ff9800 !important;
      color: white !important;
    }

    mat-chip.status-offline {
      background-color: #9e9e9e !important;
      color: white !important;
    }

    mat-chip.status-maintenance {
      background-color: #2196f3 !important;
      color: white !important;
    }

    mat-chip.status-out_of_service {
      background-color: #f44336 !important;
      color: white !important;
    }

    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class TruckFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly truckService = inject(TruckAdminService);
  private readonly snackBar = inject(MatSnackBar);

  // State
  truckId = signal<string | null>(null);
  truck = signal<TruckAdminResponse | null>(null);
  loading = signal(false);
  saving = signal(false);

  isEditMode = signal(false);
  vehicleTypes = VEHICLE_TYPES;
  statuses = TRUCK_STATUSES;

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Trucks', link: '/admin/trucks', icon: 'local_shipping' },
    { label: this.isEditMode() ? 'Edit' : 'New Truck' }
  ]);

  form: FormGroup = this.fb.group({
    truckId: ['', [Validators.required, Validators.maxLength(50)]],
    licensePlate: ['', [Validators.maxLength(100)]],
    vehicleType: ['', [Validators.required]],
    driverName: ['', [Validators.maxLength(100)]],
    driverPhone: ['', [Validators.maxLength(50)]],
    primaryGroupId: ['', [Validators.required]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.truckId.set(id);
      this.isEditMode.set(true);
      this.loadTruck(id);

      // Remove truck ID and primary group fields in edit mode
      this.form.get('truckId')?.clearValidators();
      this.form.get('truckId')?.updateValueAndValidity();
      this.form.get('primaryGroupId')?.clearValidators();
      this.form.get('primaryGroupId')?.updateValueAndValidity();
    }
  }

  loadTruck(id: string) {
    this.loading.set(true);
    this.truckService.getTruckById(id).subscribe({
      next: (truck) => {
        this.truck.set(truck);
        this.form.patchValue({
          licensePlate: truck.licensePlate || '',
          vehicleType: truck.vehicleType,
          driverName: truck.driverName || '',
          driverPhone: truck.driverPhone || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load truck:', err);
        this.snackBar.open('Failed to load truck', 'Close', { duration: 3000 });
        this.loading.set(false);
        this.router.navigate(['/admin/trucks']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateTruck();
    } else {
      this.createTruck();
    }
  }

  private createTruck() {
    const request: CreateTruckRequest = {
      truckId: this.form.value.truckId,
      licensePlate: this.form.value.licensePlate || undefined,
      vehicleType: this.form.value.vehicleType,
      driverName: this.form.value.driverName || undefined,
      driverPhone: this.form.value.driverPhone || undefined,
      primaryGroupId: this.form.value.primaryGroupId
    };

    this.truckService.createTruck(request).subscribe({
      next: (truck) => {
        this.snackBar.open(`Truck ${truck.truckId} created successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/trucks']);
      },
      error: (err) => {
        console.error('Failed to create truck:', err);
        this.snackBar.open(err.error?.message || 'Failed to create truck', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  private updateTruck() {
    const request: UpdateTruckRequest = {};

    if (this.form.value.licensePlate !== this.truck()?.licensePlate) {
      request.licensePlate = this.form.value.licensePlate;
    }
    if (this.form.value.vehicleType !== this.truck()?.vehicleType) {
      request.vehicleType = this.form.value.vehicleType;
    }
    if (this.form.value.driverName !== this.truck()?.driverName) {
      request.driverName = this.form.value.driverName;
    }
    if (this.form.value.driverPhone !== this.truck()?.driverPhone) {
      request.driverPhone = this.form.value.driverPhone;
    }

    this.truckService.updateTruck(this.truckId()!, request).subscribe({
      next: (truck) => {
        this.snackBar.open(`Truck ${truck.truckId} updated successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/trucks']);
      },
      error: (err) => {
        console.error('Failed to update truck:', err);
        this.snackBar.open(err.error?.message || 'Failed to update truck', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/trucks']);
  }
}

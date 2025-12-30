import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { TruckAdminResponse, CreateTruckRequest, UpdateTruckRequest, VEHICLE_TYPES, TRUCK_STATUSES, DriverOption } from '../truck.model';
import { AuditLogComponent } from '../../shared/audit-log/audit-log.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Truck form component for create and edit.
 * T072-T073: TruckFormComponent with group assignment
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-truck-form',
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
    templateUrl: './truck-form.component.html',
    styleUrls: ['./truck-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
  drivers = signal<DriverOption[]>([]);

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
    driverId: [null],
    primaryGroupId: ['', [Validators.required]]
  });

  ngOnInit() {
    // Load available drivers
    this.loadDrivers();

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

  loadDrivers() {
    this.truckService.getAvailableDrivers().subscribe({
      next: (drivers) => {
        this.drivers.set(drivers);
      },
      error: (err) => {
        console.error('Failed to load drivers:', err);
      }
    });
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
          driverPhone: truck.driverPhone || '',
          driverId: truck.driverId || null
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
    if (this.form.value.driverId !== this.truck()?.driverId) {
      request.driverId = this.form.value.driverId;
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

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { TripService } from '../trip.service';
import { TripResponse, TripStatusHistoryResponse, TRIP_STATUS_COLORS, TRIP_STATUSES, CreateTripRequest, AssignTripRequest, UpdateTripRequest } from '../trip.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { TruckAdminService } from '../../trucks/truck-admin.service';
import { TruckAdminResponse, DriverOption } from '../../trucks/truck.model';

/**
 * Trip detail component with assignment and status timeline.
 * T049: Create TripDetailComponent
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 */
@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    BreadcrumbComponent
  ],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.scss']
})
export class TripDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly truckService = inject(TruckAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State
  trip = signal<TripResponse | null>(null);
  history = signal<TripStatusHistoryResponse[]>([]);
  trucks = signal<TruckAdminResponse[]>([]);
  drivers = signal<DriverOption[]>([]);
  loading = signal(true);
  saving = signal(false);
  isEditMode = signal(false);
  showAssignPanel = signal(false);
  showReassignPanel = signal(false);

  // Forms
  editForm!: FormGroup;
  assignForm!: FormGroup;
  reassignForm!: FormGroup;

  tripId: string | null = null;
  statusColors = TRIP_STATUS_COLORS;
  statuses = TRIP_STATUSES;

  ngOnInit() {
    this.initForms();
    this.tripId = this.route.snapshot.paramMap.get('id');

    if (this.tripId && this.tripId !== 'new') {
      this.loadTrip();
      this.loadHistory();
      this.loadTrucksAndDrivers();
    } else {
      // New trip mode
      this.isEditMode.set(true);
      this.loading.set(false);
      this.loadTrucksAndDrivers();
    }
  }

  private initForms() {
    this.editForm = this.fb.group({
      origin: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', [Validators.required, Validators.minLength(3)]],
      scheduledAt: [''],
      notes: ['']
    });

    this.assignForm = this.fb.group({
      truckId: ['', Validators.required],
      driverId: ['', Validators.required]
    });

    this.reassignForm = this.fb.group({
      truckId: ['', Validators.required],
      driverId: ['', Validators.required]
    });
  }

  loadTrip() {
    if (!this.tripId) return;

    this.loading.set(true);
    this.tripService.getTripById(this.tripId).subscribe({
      next: (trip) => {
        this.trip.set(trip);
        this.patchEditForm(trip);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trip:', err);
        this.snackBar.open('Failed to load trip', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/trips']);
      }
    });
  }

  loadHistory() {
    if (!this.tripId) return;

    this.tripService.getTripHistory(this.tripId).subscribe({
      next: (history) => {
        this.history.set(history);
      },
      error: (err) => {
        console.error('Failed to load trip history:', err);
      }
    });
  }

  loadTrucksAndDrivers() {
    // Load available trucks
    this.truckService.getTrucks(0, 100, undefined, 'ACTIVE').subscribe({
      next: (response) => {
        this.trucks.set(response.content);
      }
    });

    // Load available drivers
    this.truckService.getAvailableDrivers().subscribe({
      next: (drivers) => {
        this.drivers.set(drivers);
      }
    });
  }

  private patchEditForm(trip: TripResponse) {
    this.editForm.patchValue({
      origin: trip.origin,
      destination: trip.destination,
      scheduledAt: trip.scheduledAt ? this.formatDateForInput(trip.scheduledAt) : '',
      notes: trip.notes || ''
    });
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  toggleEditMode() {
    this.isEditMode.update(v => !v);
    if (!this.isEditMode() && this.trip()) {
      this.patchEditForm(this.trip()!);
    }
  }

  toggleAssignPanel() {
    this.showAssignPanel.update(v => !v);
    if (!this.showAssignPanel()) {
      this.assignForm.reset();
    }
  }

  toggleReassignPanel() {
    this.showReassignPanel.update(v => !v);
    if (this.showReassignPanel() && this.trip()) {
      // Pre-fill with current assignment
      this.reassignForm.patchValue({
        truckId: this.trip()?.assignedTruckId || '',
        driverId: this.trip()?.assignedDriverId || ''
      });
    } else {
      this.reassignForm.reset();
    }
  }

  saveTrip() {
    if (this.editForm.invalid) return;

    this.saving.set(true);
    const formValue = this.editForm.value;

    if (this.tripId && this.tripId !== 'new') {
      // Update existing trip
      const updateRequest: UpdateTripRequest = {
        origin: formValue.origin,
        destination: formValue.destination,
        scheduledAt: formValue.scheduledAt || undefined,
        notes: formValue.notes || undefined
      };
      this.tripService.updateTrip(this.tripId, updateRequest).subscribe({
        next: (trip) => {
          this.trip.set(trip);
          this.isEditMode.set(false);
          this.saving.set(false);
          this.snackBar.open('Trip updated', 'Close', { duration: 3000 });
          this.loadHistory();
        },
        error: (err) => {
          console.error('Failed to update trip:', err);
          this.snackBar.open(err.error?.message || 'Failed to update trip', 'Close', { duration: 3000 });
          this.saving.set(false);
        }
      });
    } else {
      // Create new trip
      const createRequest: CreateTripRequest = {
        origin: formValue.origin,
        destination: formValue.destination,
        scheduledAt: formValue.scheduledAt || undefined,
        notes: formValue.notes || undefined
      };
      this.tripService.createTrip(createRequest).subscribe({
        next: (trip) => {
          this.snackBar.open('Trip created', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/trips', trip.id]);
        },
        error: (err) => {
          console.error('Failed to create trip:', err);
          this.snackBar.open(err.error?.message || 'Failed to create trip', 'Close', { duration: 3000 });
          this.saving.set(false);
        }
      });
    }
  }

  assignTrip() {
    if (this.assignForm.invalid || !this.tripId) return;

    this.saving.set(true);
    const request: AssignTripRequest = {
      truckId: this.assignForm.value.truckId,
      driverId: this.assignForm.value.driverId
    };

    this.tripService.assignTrip(this.tripId, request).subscribe({
      next: (trip) => {
        this.trip.set(trip);
        this.showAssignPanel.set(false);
        this.assignForm.reset();
        this.saving.set(false);
        this.snackBar.open('Trip assigned successfully', 'Close', { duration: 3000 });
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to assign trip:', err);
        this.snackBar.open(err.error?.message || 'Failed to assign trip', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  /**
   * Reassign the trip to a different truck and driver.
   * T067: Add Reassign Trip dialog
   */
  reassignTrip() {
    if (this.reassignForm.invalid || !this.tripId) return;

    this.saving.set(true);
    const request: AssignTripRequest = {
      truckId: this.reassignForm.value.truckId,
      driverId: this.reassignForm.value.driverId
    };

    this.tripService.reassignTrip(this.tripId, request).subscribe({
      next: (trip) => {
        this.trip.set(trip);
        this.showReassignPanel.set(false);
        this.reassignForm.reset();
        this.saving.set(false);
        this.snackBar.open('Trip reassigned successfully', 'Close', { duration: 3000 });
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to reassign trip:', err);
        this.snackBar.open(err.error?.message || 'Failed to reassign trip', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  confirmCancel() {
    const trip = this.trip();
    if (!trip) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Trip',
        message: `Are you sure you want to cancel this trip from "${trip.origin}" to "${trip.destination}"?`,
        confirmText: 'Cancel Trip',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.cancelTrip();
      }
    });
  }

  private cancelTrip() {
    if (!this.tripId) return;

    this.tripService.cancelTrip(this.tripId).subscribe({
      next: (trip) => {
        this.trip.set(trip);
        this.snackBar.open('Trip cancelled', 'Close', { duration: 3000 });
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to cancel trip:', err);
        this.snackBar.open(err.error?.message || 'Failed to cancel trip', 'Close', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/trips']);
  }

  getStatusColor(status: string): string {
    return this.statusColors[status as keyof typeof this.statusColors] || '#9e9e9e';
  }

  getStatusIcon(status: string): string {
    const statusInfo = this.statuses.find(s => s.value === status);
    return statusInfo?.icon || 'help_outline';
  }

  canAssign(): boolean {
    const trip = this.trip();
    return trip?.status === 'PENDING';
  }

  canReassign(): boolean {
    const trip = this.trip();
    return trip?.status === 'ASSIGNED' || trip?.status === 'IN_PROGRESS';
  }

  canCancel(): boolean {
    const trip = this.trip();
    return trip?.status === 'PENDING' || trip?.status === 'ASSIGNED';
  }

  canEdit(): boolean {
    const trip = this.trip();
    return trip?.status !== 'COMPLETED' && trip?.status !== 'CANCELLED';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
}

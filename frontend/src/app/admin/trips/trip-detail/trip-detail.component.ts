import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TripService } from '../trip.service';
import { TripResponse, TripStatusHistoryResponse, TRIP_STATUS_COLORS, TRIP_STATUSES, CreateTripRequest, AssignTripRequest, UpdateTripRequest } from '../trip.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { TruckAdminService } from '../../trucks/truck-admin.service';
import { TruckAdminResponse } from '../../trucks/truck.model';
import { LocationPickerComponent, LocationValue } from '../../shared/location-picker/location-picker.component';
import { StoreFacade } from '../../../store/store.facade';

/**
 * Trip detail component with assignment and status timeline.
 * T049: Create TripDetailComponent
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule, // Keep for forms until full migration
    MatInputModule,     // Keep for forms until full migration
    MatSelectModule,    // Keep for forms until full migration
    MatDialogModule,    // Keep for dialogs until Phase 8
    MatSnackBarModule,  // Keep for notifications until Phase 9
    BreadcrumbComponent,
    LocationPickerComponent
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
  private readonly facade = inject(StoreFacade);

  // State
  trip = signal<TripResponse | null>(null);
  history = signal<TripStatusHistoryResponse[]>([]);
  trucks = signal<TruckAdminResponse[]>([]);
  /** Drivers with their assigned trucks (only drivers who have a truck assigned) */
  assignableDrivers = signal<{ driverId: string; driverName: string; truckId: string; truckName: string; truckStatus: string }[]>([]);
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
      origin: [null as LocationValue | null, Validators.required],
      destination: [null as LocationValue | null, Validators.required],
      scheduledAt: [''],
      notes: ['']
    });

    // Only driverId is required - truckId is auto-filled from driver's assigned truck
    this.assignForm = this.fb.group({
      driverId: ['', Validators.required]
    });

    this.reassignForm = this.fb.group({
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
    // T022: Trigger cache check for trucks to leverage stale-while-revalidate
    this.facade.checkTrucksCache();

    // Load trucks and build assignable drivers list
    // Note: Using TruckAdminService for detailed truck info needed for assignment
    this.truckService.getTrucks(0, 100, undefined, undefined).subscribe({
      next: (response) => {
        // Filter to online trucks (ACTIVE or IDLE)
        const onlineTrucks = response.content.filter(
          (t: TruckAdminResponse) => t.status === 'ACTIVE' || t.status === 'IDLE'
        );
        this.trucks.set(onlineTrucks);

        // Build assignable drivers list from trucks that have a driver assigned
        const driversWithTrucks = onlineTrucks
          .filter((t: TruckAdminResponse) => t.driverId && t.driverName)
          .map((t: TruckAdminResponse) => ({
            driverId: t.driverId!,
            driverName: t.driverName!,
            truckId: t.id,
            truckName: `${t.licensePlate || t.truckId} - ${t.vehicleType}`,
            truckStatus: t.status
          }));
        this.assignableDrivers.set(driversWithTrucks);
      }
    });
  }

  private patchEditForm(trip: TripResponse) {
    // Create LocationValue objects from trip data
    const originLocation: LocationValue | null = trip.originLat && trip.originLng
      ? { address: trip.origin, lat: trip.originLat, lng: trip.originLng }
      : { address: trip.origin, lat: 0, lng: 0 }; // Fallback for old trips without coords

    const destinationLocation: LocationValue | null = trip.destinationLat && trip.destinationLng
      ? { address: trip.destination, lat: trip.destinationLat, lng: trip.destinationLng }
      : { address: trip.destination, lat: 0, lng: 0 }; // Fallback for old trips without coords

    this.editForm.patchValue({
      origin: originLocation,
      destination: destinationLocation,
      scheduledAt: trip.scheduledAt ? this.formatDateForInput(trip.scheduledAt) : '',
      notes: trip.notes || ''
    });
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  /**
   * Convert datetime-local input value to ISO-8601 string with timezone.
   * Input: "2025-12-27T00:00" -> Output: "2025-12-27T00:00:00Z"
   */
  private formatDateForApi(dateTimeLocal: string | null | undefined): string | undefined {
    if (!dateTimeLocal) return undefined;
    // datetime-local format: YYYY-MM-DDTHH:mm
    // Add seconds and Z for UTC timezone
    return dateTimeLocal + ':00Z';
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
      // Pre-fill with current driver
      this.reassignForm.patchValue({
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
    const originLocation = formValue.origin as LocationValue;
    const destinationLocation = formValue.destination as LocationValue;

    if (this.tripId && this.tripId !== 'new') {
      // Update existing trip
      const updateRequest: UpdateTripRequest = {
        origin: originLocation?.address,
        originLat: originLocation?.lat,
        originLng: originLocation?.lng,
        destination: destinationLocation?.address,
        destinationLat: destinationLocation?.lat,
        destinationLng: destinationLocation?.lng,
        scheduledAt: this.formatDateForApi(formValue.scheduledAt),
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
        origin: originLocation?.address,
        originLat: originLocation?.lat,
        originLng: originLocation?.lng,
        destination: destinationLocation?.address,
        destinationLat: destinationLocation?.lat,
        destinationLng: destinationLocation?.lng,
        scheduledAt: this.formatDateForApi(formValue.scheduledAt),
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

    const selectedDriverId = this.assignForm.value.driverId;
    const selectedDriver = this.assignableDrivers().find(d => d.driverId === selectedDriverId);

    if (!selectedDriver) {
      this.snackBar.open('Driver not found', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const request: AssignTripRequest = {
      truckId: selectedDriver.truckId,
      driverId: selectedDriver.driverId
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

    const selectedDriverId = this.reassignForm.value.driverId;
    const selectedDriver = this.assignableDrivers().find(d => d.driverId === selectedDriverId);

    if (!selectedDriver) {
      this.snackBar.open('Driver not found', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const request: AssignTripRequest = {
      truckId: selectedDriver.truckId,
      driverId: selectedDriver.driverId
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

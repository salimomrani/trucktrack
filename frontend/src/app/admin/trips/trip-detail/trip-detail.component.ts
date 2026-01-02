import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripService } from '../trip.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { TripResponse, TripStatusHistoryResponse, TRIP_STATUS_COLORS, TRIP_STATUSES, CreateTripRequest, AssignTripRequest, UpdateTripRequest } from '../trip.model';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { TruckAdminService } from '../../trucks/truck-admin.service';
import { TruckAdminResponse } from '../../trucks/truck.model';
import { LocationPickerComponent, LocationValue } from '../../shared/location-picker/location-picker.component';
import { StoreFacade } from '../../../store/store.facade';

/**
 * Trip detail component with assignment and status timeline.
 * T049: Create TripDetailComponent
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 * Migrated to NgRx store for state management via StoreFacade.
 */
@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(StoreFacade);

  // State from store (using view model selector)
  readonly viewModel = this.facade.tripDetailViewModel;

  // Local loading state for new trip mode
  private isNewTrip = signal(false);

  // Derived signals from view model
  readonly trip = computed(() => this.viewModel()?.trip ?? null);
  readonly history = computed(() => this.viewModel()?.history ?? []);
  // For new trips, don't show loading spinner - we're not loading anything from the store
  readonly loading = computed(() => this.isNewTrip() ? false : (this.viewModel()?.loading ?? true));
  readonly saving = computed(() => this.viewModel()?.saving ?? false);

  // Local UI state
  trucks = signal<TruckAdminResponse[]>([]);
  /** Drivers with their assigned trucks (only drivers who have a truck assigned) */
  assignableDrivers = signal<{ driverId: string; driverName: string; truckId: string; truckName: string; truckStatus: string }[]>([]);
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

  // Track pending operations for panel management
  private pendingAssign = false;
  private pendingReassign = false;
  private pendingCancel = false;

  constructor() {
    // Watch for operation completion to close panels
    effect(() => {
      const currentSaving = this.saving();
      const currentTrip = this.trip();

      // If saving just completed and we have a pending operation
      if (!currentSaving && currentTrip) {
        if (this.pendingAssign && currentTrip.status === 'ASSIGNED') {
          this.showAssignPanel.set(false);
          this.assignForm.reset();
          this.pendingAssign = false;
        }
        if (this.pendingReassign && currentTrip.assignedDriverId) {
          this.showReassignPanel.set(false);
          this.reassignForm.reset();
          this.pendingReassign = false;
        }
        if (this.pendingCancel && currentTrip.status === 'CANCELLED') {
          this.pendingCancel = false;
        }
      }
    });

    // Watch trip changes to update form
    effect(() => {
      const currentTrip = this.trip();
      if (currentTrip && !this.isEditMode()) {
        this.patchEditForm(currentTrip);
      }
    });
  }

  ngOnInit() {
    this.initForms();
    this.tripId = this.route.snapshot.paramMap.get('id');

    if (this.tripId && this.tripId !== 'new') {
      // Load trip and history via store
      this.facade.loadTrip(this.tripId);
      this.facade.loadTripHistory(this.tripId);
      this.loadTrucksAndDrivers();
    } else {
      // New trip mode - not loading from store
      this.isNewTrip.set(true);
      this.isEditMode.set(true);
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
    if (!this.isEditMode()) {
      const currentTrip = this.trip();
      if (currentTrip) {
        this.patchEditForm(currentTrip);
      }
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
    if (this.showReassignPanel()) {
      const currentTrip = this.trip();
      // Pre-fill with current driver
      this.reassignForm.patchValue({
        driverId: currentTrip?.assignedDriverId || ''
      });
    } else {
      this.reassignForm.reset();
    }
  }

  saveTrip() {
    if (this.editForm.invalid) return;

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
      this.facade.updateTrip(this.tripId, updateRequest);
      this.isEditMode.set(false);
    } else {
      // Create new trip (effect handles navigation on success)
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
      this.facade.createTrip(createRequest);
    }
  }

  assignTrip() {
    if (this.assignForm.invalid || !this.tripId) return;

    const selectedDriverId = this.assignForm.value.driverId;
    const selectedDriver = this.assignableDrivers().find(d => d.driverId === selectedDriverId);

    if (!selectedDriver) {
      this.toast.error('Driver not found');
      return;
    }

    const request: AssignTripRequest = {
      truckId: selectedDriver.truckId,
      driverId: selectedDriver.driverId
    };

    this.pendingAssign = true;
    this.facade.assignTrip(this.tripId, request);
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
      this.toast.error('Driver not found');
      return;
    }

    const request: AssignTripRequest = {
      truckId: selectedDriver.truckId,
      driverId: selectedDriver.driverId
    };

    this.pendingReassign = true;
    this.facade.reassignTrip(this.tripId, request);
  }

  confirmCancel() {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    this.confirmDialog.open({
      title: 'Cancel Trip',
      message: `Are you sure you want to cancel this trip from "${currentTrip.origin}" to "${currentTrip.destination}"?`,
      confirmText: 'Cancel Trip',
      confirmColor: 'warn'
    }).subscribe(confirmed => {
      if (confirmed && this.tripId) {
        this.pendingCancel = true;
        this.facade.cancelTrip(this.tripId);
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
    const currentTrip = this.trip();
    return currentTrip?.status === 'PENDING';
  }

  canReassign(): boolean {
    const currentTrip = this.trip();
    return currentTrip?.status === 'ASSIGNED' || currentTrip?.status === 'IN_PROGRESS';
  }

  canCancel(): boolean {
    const currentTrip = this.trip();
    return currentTrip?.status === 'PENDING' || currentTrip?.status === 'ASSIGNED';
  }

  canEdit(): boolean {
    const currentTrip = this.trip();
    return currentTrip?.status !== 'COMPLETED' && currentTrip?.status !== 'CANCELLED';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
}

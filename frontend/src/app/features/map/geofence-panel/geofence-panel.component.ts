import { Component, OnInit, OnDestroy, input, output, signal, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GeofenceService } from '../../../services/geofence.service';
import { Geofence, GeofenceZoneType } from '../../../models/geofence.model';
import { selectUserRole } from '../../../store/auth/auth.selectors';

/**
 * Geofence Panel Component
 * T154: Frontend geofence drawing UI (Leaflet.draw)
 * Provides UI for creating, editing, and managing geofences on the map
 */
@Component({
    selector: 'app-geofence-panel',
    imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
],
    templateUrl: './geofence-panel.component.html',
    styleUrls: ['./geofence-panel.component.scss']
})
export class GeofencePanelComponent implements OnInit, OnDestroy {
  /** Leaflet map instance (required) */
  readonly map = input.required<L.Map>();

  /** Emit when a geofence is created */
  readonly geofenceCreated = output<Geofence>();

  /** Emit when a geofence is deleted */
  readonly geofenceDeleted = output<string>();

  private readonly geofenceService = inject(GeofenceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly store = inject(Store);

  // User role and permissions
  private readonly userRole = toSignal(this.store.select(selectUserRole));

  /** Can create/update geofences: ADMIN, FLEET_MANAGER, DISPATCHER */
  readonly canCreateGeofence = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'FLEET_MANAGER' || role === 'DISPATCHER';
  });

  /** Can delete geofences: ADMIN, FLEET_MANAGER only */
  readonly canDeleteGeofence = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'FLEET_MANAGER';
  });

  // Drawing controls and layers
  private drawControl!: L.Control.Draw;
  private drawnItems!: L.FeatureGroup;
  private geofenceLayers: Map<string, L.Polygon> = new Map();

  // Component state
  isDrawing = signal(false);
  isPanelOpen = signal(false);
  isLoading = signal(false);
  geofences = signal<Geofence[]>([]);

  // New geofence form
  newGeofence: Partial<Geofence> = {
    name: '',
    description: '',
    zoneType: GeofenceZoneType.CUSTOM,
    isActive: true
  };

  // Temporarily drawn polygon
  private drawnPolygon: L.Polygon | null = null;
  drawnCoordinates: [number, number][] = [];

  // Zone type options
  zoneTypes = [
    { value: GeofenceZoneType.DEPOT, label: 'Depot' },
    { value: GeofenceZoneType.DELIVERY_AREA, label: 'Delivery Area' },
    { value: GeofenceZoneType.RESTRICTED_ZONE, label: 'Restricted Zone' },
    { value: GeofenceZoneType.CUSTOM, label: 'Custom' }
  ];

  ngOnInit(): void {
    this.initDrawControls();
    this.loadGeofences();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize Leaflet.draw controls
   */
  private initDrawControls(): void {
    // Create feature group for drawn items
    this.drawnItems = new L.FeatureGroup();
    this.map().addLayer(this.drawnItems);

    // Configure draw control options
    const drawOptions: L.Control.DrawConstructorOptions = {
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            fillOpacity: 0.2
          }
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        rectangle: {
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            fillOpacity: 0.2
          }
        }
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    };

    this.drawControl = new L.Control.Draw(drawOptions);

    // Listen for draw events
    this.map().on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      this.handleDrawCreated(event);
    });

    this.map().on(L.Draw.Event.DELETED, () => {
      this.drawnPolygon = null;
      this.drawnCoordinates = [];
    });
  }

  /**
   * Handle polygon created event
   */
  private handleDrawCreated(e: L.DrawEvents.Created): void {
    const layer = e.layer as L.Polygon;

    // Clear previous drawn polygon
    if (this.drawnPolygon) {
      this.drawnItems.removeLayer(this.drawnPolygon);
    }

    // Add new polygon to map
    this.drawnItems.addLayer(layer);
    this.drawnPolygon = layer;

    // Extract coordinates (convert to [lon, lat] format for backend)
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    this.drawnCoordinates = latLngs.map(ll => [ll.lng, ll.lat] as [number, number]);

    // Ensure polygon is closed
    if (this.drawnCoordinates.length > 0) {
      const first = this.drawnCoordinates[0];
      const last = this.drawnCoordinates[this.drawnCoordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        this.drawnCoordinates.push([...first]);
      }
    }

    this.isDrawing.set(false);
    this.snackBar.open('Polygon drawn! Fill in the details and save.', 'OK', { duration: 3000 });
  }

  /**
   * Start drawing mode
   */
  startDrawing(): void {
    this.map().addControl(this.drawControl);
    this.isDrawing.set(true);
    this.snackBar.open('Draw a polygon on the map to create a geofence', 'OK', { duration: 5000 });
  }

  /**
   * Cancel drawing mode
   */
  cancelDrawing(): void {
    this.map().removeControl(this.drawControl);
    if (this.drawnPolygon) {
      this.drawnItems.removeLayer(this.drawnPolygon);
      this.drawnPolygon = null;
    }
    this.drawnCoordinates = [];
    this.isDrawing.set(false);
    this.resetForm();
  }

  /**
   * Save the drawn geofence
   */
  saveGeofence(): void {
    if (!this.newGeofence.name || this.drawnCoordinates.length < 4) {
      this.snackBar.open('Please provide a name and draw a valid polygon', 'OK', { duration: 3000 });
      return;
    }

    const geofence: Geofence = {
      name: this.newGeofence.name!,
      description: this.newGeofence.description,
      zoneType: this.newGeofence.zoneType!,
      coordinates: this.drawnCoordinates,
      isActive: true
    };

    this.isLoading.set(true);

    this.geofenceService.createGeofence(geofence).subscribe({
      next: (created) => {
        this.isLoading.set(false);
        this.snackBar.open(`Geofence "${created.name}" created successfully`, 'OK', { duration: 3000 });

        // Add to list and render on map
        this.geofences.update(list => [...list, created]);
        this.renderGeofenceOnMap(created);

        // Cleanup
        this.cancelDrawing();
        this.geofenceCreated.emit(created);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error creating geofence:', err);
        this.snackBar.open('Failed to create geofence', 'Dismiss', { duration: 5000 });
      }
    });
  }

  /**
   * Load all geofences
   */
  loadGeofences(): void {
    this.isLoading.set(true);

    this.geofenceService.getAllGeofences().subscribe({
      next: (geofences) => {
        this.isLoading.set(false);
        this.geofences.set(geofences);
        this.renderAllGeofences();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading geofences:', err);
      }
    });
  }

  /**
   * Render all geofences on map
   */
  private renderAllGeofences(): void {
    // Clear existing layers
    this.geofenceLayers.forEach(layer => {
      this.map().removeLayer(layer);
    });
    this.geofenceLayers.clear();

    // Render each geofence
    this.geofences().forEach(geofence => {
      this.renderGeofenceOnMap(geofence);
    });
  }

  /**
   * Render a single geofence on map
   */
  private renderGeofenceOnMap(geofence: Geofence): void {
    if (!geofence.coordinates || geofence.coordinates.length < 3) {
      return;
    }

    // Convert [lon, lat] to [lat, lon] for Leaflet
    const latLngs: L.LatLngExpression[] = geofence.coordinates.map(
      coord => [coord[1], coord[0]] as L.LatLngTuple
    );

    const color = this.getZoneColor(geofence.zoneType);
    const polygon = L.polygon(latLngs, {
      color: color,
      weight: 2,
      fillOpacity: 0.2,
      fillColor: color
    });

    // Add popup with geofence info
    polygon.bindPopup(`
      <div class="geofence-popup">
        <strong>${geofence.name}</strong>
        <br><span class="zone-type">${geofence.zoneType}</span>
        ${geofence.description ? `<br><small>${geofence.description}</small>` : ''}
      </div>
    `);

    polygon.addTo(this.map());
    this.geofenceLayers.set(geofence.id!, polygon);
  }

  /**
   * Get color based on zone type
   */
  getZoneColor(zoneType: GeofenceZoneType): string {
    switch (zoneType) {
      case GeofenceZoneType.DEPOT:
        return '#4CAF50'; // Green
      case GeofenceZoneType.DELIVERY_AREA:
        return '#2196F3'; // Blue
      case GeofenceZoneType.RESTRICTED_ZONE:
        return '#F44336'; // Red
      case GeofenceZoneType.CUSTOM:
      default:
        return '#9C27B0'; // Purple
    }
  }

  /**
   * Delete a geofence
   */
  deleteGeofence(geofence: Geofence): void {
    if (!geofence.id) return;

    if (!confirm(`Delete geofence "${geofence.name}"?`)) {
      return;
    }

    this.isLoading.set(true);

    this.geofenceService.deleteGeofence(geofence.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open(`Geofence "${geofence.name}" deleted`, 'OK', { duration: 3000 });

        // Remove from list and map
        this.geofences.update(list => list.filter(g => g.id !== geofence.id));
        const layer = this.geofenceLayers.get(geofence.id!);
        if (layer) {
          this.map().removeLayer(layer);
          this.geofenceLayers.delete(geofence.id!);
        }

        this.geofenceDeleted.emit(geofence.id!);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error deleting geofence:', err);
        this.snackBar.open('Failed to delete geofence', 'Dismiss', { duration: 5000 });
      }
    });
  }

  /**
   * Focus map on a geofence
   */
  focusOnGeofence(geofence: Geofence): void {
    const layer = this.geofenceLayers.get(geofence.id!);
    if (layer) {
      this.map().fitBounds(layer.getBounds(), { padding: [50, 50] });
      layer.openPopup();
    }
  }

  /**
   * Toggle visibility of a geofence
   */
  toggleGeofenceVisibility(geofence: Geofence): void {
    const layer = this.geofenceLayers.get(geofence.id!);
    if (layer) {
      if (this.map().hasLayer(layer)) {
        this.map().removeLayer(layer);
      } else {
        layer.addTo(this.map());
      }
    }
  }

  /**
   * Reset the form
   */
  private resetForm(): void {
    this.newGeofence = {
      name: '',
      description: '',
      zoneType: GeofenceZoneType.CUSTOM,
      isActive: true
    };
  }

  /**
   * Toggle panel open/closed
   */
  togglePanel(): void {
    this.isPanelOpen.update(open => !open);
  }

  /**
   * Cleanup on destroy
   */
  private cleanup(): void {
    const mapInstance = this.map();
    if (this.drawControl && mapInstance) {
      try {
        mapInstance.removeControl(this.drawControl);
      } catch {
        // Control may not be on map
      }
    }

    this.geofenceLayers.forEach(layer => {
      mapInstance?.removeLayer(layer);
    });

    if (this.drawnItems && mapInstance) {
      mapInstance.removeLayer(this.drawnItems);
    }
  }
}

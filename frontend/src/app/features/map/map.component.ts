import { Component, OnInit, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { WebSocketService } from '../../core/services/websocket.service';
import { StoreFacade } from '../../store/store.facade';
import { Truck, TruckStatus } from '../../models/truck.model';
import { GPSPositionEvent } from '../../models/gps-position.model';
import { environment } from '../../../environments/environment';
import { SearchBarComponent } from '../../core/components/search-bar/search-bar.component';

/**
 * MapComponent - Main map view for displaying live truck locations
 * T079-T092: Implement MapComponent with Leaflet, real-time updates, markers, clustering
 * Refactored with Angular 17+ best practices: signals, inject(), takeUntilDestroyed(), OnPush
 * Migrated to use NgRx StoreFacade with signals
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule, SearchBarComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit {
  // Inject dependencies using inject()
  private readonly facade = inject(StoreFacade);
  private readonly webSocketService = inject(WebSocketService);
  private readonly snackBar = inject(MatSnackBar);

  // Map and marker state
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private markerClusterGroup!: L.MarkerClusterGroup;
  private isRenderingMarkers = false; // Flag to prevent deselect during re-render

  // Use store signals for state
  trucks = this.facade.trucks;
  isLoading = this.facade.trucksLoading;
  isConnected = signal(false);
  errorMessage = signal('');

  constructor() {
    // Setup WebSocket connection status subscription with automatic cleanup
    this.webSocketService.connectionStatus$
      .pipe(takeUntilDestroyed())
      .subscribe(connected => {
        this.isConnected.set(connected);
        console.log('WebSocket connection status:', connected);
      });

    // Subscribe to position updates with automatic cleanup
    this.webSocketService.positionUpdates$
      .pipe(takeUntilDestroyed())
      .subscribe(position => {
        if (position) {
          this.handlePositionUpdate(position);
        }
      });

    // T092: Subscribe to WebSocket errors
    this.webSocketService.error$
      .pipe(takeUntilDestroyed())
      .subscribe(error => {
        this.showError(`Real-time updates error: ${error}`);
      });

    // T089: Check for stale data every 30 seconds and re-render markers
    interval(30000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.map && this.trucks().length > 0) {
          this.renderTruckMarkers();
          console.log('Periodic stale data check completed');
        }
      });

    // Effect to re-render markers ONLY when truck count changes (not on position updates)
    let previousTruckCount = 0;
    effect(() => {
      const trucks = this.trucks();
      const currentCount = trucks.length;

      // Only re-render if truck count changed or initial load
      if (this.map && (currentCount !== previousTruckCount)) {
        this.renderTruckMarkers();
        previousTruckCount = currentCount;
      }
    });

    // Effect to focus on selected truck
    effect(() => {
      const selectedTruck = this.facade.selectedTruck();
      if (selectedTruck && this.map) {
        this.focusOnTruck(selectedTruck);
      }
    });

    // Effect to cleanup map on component destruction
    effect((onCleanup) => {
      onCleanup(() => {
        this.webSocketService.disconnect();
        if (this.map) {
          this.map.remove();
        }
      });
    });
  }

  ngOnInit(): void {
    this.initMap();
    this.loadTrucks();
    this.connectWebSocket();
  }

  /**
   * Check if truck data is stale (older than 5 minutes)
   * T089: Implement stale data detection
   */
  private isDataStale(lastUpdate: string | Date | null | undefined): boolean {
    if (!lastUpdate) {
      return true;
    }
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    return (now - lastUpdateTime) > fiveMinutesMs;
  }

  /**
   * Show error message using Material Snackbar
   * T092: Implement error handling
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Initialize Leaflet map
   * T080: Implement Leaflet map initialization
   */
  private initMap(): void {
    // Create map centered on default location
    this.map = L.map('map', {
      center: [environment.map.defaultCenter.lat, environment.map.defaultCenter.lng],
      zoom: environment.map.defaultZoom,
      zoomControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Initialize marker cluster group
    // T083: Implement marker clustering
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    this.map.addLayer(this.markerClusterGroup);

    // T103: Click on map background to deselect truck
    this.map.on('click', () => {
      if (this.facade.selectedTruck()) {
        console.log('Map clicked - deselecting truck');
        this.facade.deselectTruck();
      }
    });

    console.log('Map initialized');
  }

  /**
   * Load all trucks from store
   * Dispatch action to load trucks via NgRx effects
   */
  private loadTrucks(): void {
    // Dispatch action to load trucks - effects will handle the async operation
    this.facade.loadTrucks();
    console.log('Dispatched loadTrucks action');
  }

  /**
   * Render truck markers on map
   * T081: Implement truck marker rendering
   * T082: Implement custom truck marker icons
   */
  private renderTruckMarkers(): void {
    // Set flag to prevent deselect during re-render
    this.isRenderingMarkers = true;

    // Save which truck has popup open
    let openPopupTruckId: string | null = null;
    this.markers.forEach((marker, truckId) => {
      if (marker.isPopupOpen()) {
        openPopupTruckId = truckId;
      }
    });

    // Clear existing markers
    this.markerClusterGroup.clearLayers();
    this.markers.clear();

    this.trucks().forEach(truck => {
      if (truck.currentLatitude && truck.currentLongitude) {
        const marker = this.createTruckMarker(truck);
        this.markers.set(truck.id, marker);
        this.markerClusterGroup.addLayer(marker);
      }
    });

    // Reopen popup if it was open before re-render
    if (openPopupTruckId) {
      const marker = this.markers.get(openPopupTruckId);
      if (marker) {
        // Use setTimeout to ensure marker is fully added to map
        setTimeout(() => {
          marker.openPopup();
        }, 50);
      }
    }

    console.log(`Rendered ${this.markers.size} truck markers`);

    // Reset flag after render
    this.isRenderingMarkers = false;
  }

  /**
   * Create marker for a truck
   * T089: Pass truck to getTruckIcon for stale data detection
   */
  private createTruckMarker(truck: Truck): L.Marker {
    const icon = this.getTruckIcon(truck);
    const marker = L.marker(
      [truck.currentLatitude!, truck.currentLongitude!],
      { icon }
    );

    // T085: Implement truck marker click handler (popup with details)
    const popupContent = this.createPopupContent(truck);
    marker.bindPopup(popupContent);

    // T103: Listen to popup close event to deselect truck
    marker.on('popupclose', () => {
      // Don't deselect if we're currently re-rendering markers
      if (this.isRenderingMarkers) {
        return;
      }
      const currentlySelected = this.facade.selectedTruck();
      if (currentlySelected && currentlySelected.id === truck.id) {
        console.log(`Popup closed for truck ${truck.truckId} - deselecting`);
        this.facade.deselectTruck();
      }
    });

    // T084: Implement truck direction indicator (rotate marker based on heading)
    // TODO: Install leaflet-rotatedmarker plugin to enable rotation
    // if (truck.currentHeading !== undefined && truck.currentHeading !== null) {
    //   marker.setRotationAngle(truck.currentHeading);
    // }

    return marker;
  }

  /**
   * Get icon based on truck status
   * T082: Custom truck marker icons color-coded by status
   * T089: Add stale data indicator class
   */
  private getTruckIcon(truck: Truck): L.DivIcon {
    const color = this.getStatusColor(truck.status);
    const isStale = this.isDataStale(truck.lastUpdate);
    const staleClass = isStale ? 'truck-marker-stale' : '';

    const iconHtml = `
      <div class="truck-marker truck-marker-${truck.status.toLowerCase()} ${staleClass}"
           style="background-color: ${color};">
        <i class="material-icons">local_shipping</i>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-truck-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  /**
   * Get color for truck status
   * T095: Ensure color contrast ratio 4.5:1
   */
  private getStatusColor(status: TruckStatus): string {
    switch (status) {
      case TruckStatus.ACTIVE:
        return '#4CAF50'; // Green
      case TruckStatus.IDLE:
        return '#FFC107'; // Yellow/Amber
      case TruckStatus.OFFLINE:
        return '#9E9E9E'; // Gray
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Create popup content with truck details
   */
  private createPopupContent(truck: Truck): string {
    const lastUpdate = truck.lastUpdate
      ? new Date(truck.lastUpdate).toLocaleString()
      : 'Unknown';

    return `
      <div class="truck-popup">
        <h3>${truck.truckId}</h3>
        <p><strong>Status:</strong> <span class="status-${truck.status.toLowerCase()}">${truck.status}</span></p>
        ${truck.driverName ? `<p><strong>Driver:</strong> ${truck.driverName}</p>` : ''}
        ${truck.currentSpeed !== null && truck.currentSpeed !== undefined ? `<p><strong>Speed:</strong> ${truck.currentSpeed.toFixed(1)} km/h</p>` : ''}
        <p><strong>Last Update:</strong> ${lastUpdate}</p>
      </div>
    `;
  }

  /**
   * Connect to WebSocket for real-time updates
   * T086: Implement WebSocket subscription
   */
  private connectWebSocket(): void {
    this.webSocketService.connect();
  }

  /**
   * Handle real-time position update from WebSocket
   * Dispatch GPS position to store and update marker
   * If truck is selected, keep it centered on map
   */
  private handlePositionUpdate(position: GPSPositionEvent): void {
    const truckId = position.truckId;

    // Dispatch GPS position to store
    this.facade.addGpsPosition(position);

    // Update truck position in store (provide defaults for optional fields)
    this.facade.updateTruckPosition(
      truckId,
      position.latitude,
      position.longitude,
      position.speed ?? 0,
      position.heading ?? 0
    );

    // Update marker on map
    const existingMarker = this.markers.get(truckId);
    if (existingMarker) {
      // Update existing marker position with animation
      const newLatLng = L.latLng(position.latitude, position.longitude);
      existingMarker.setLatLng(newLatLng);

      // If this truck is selected, keep map centered on it
      const selectedTruck = this.facade.selectedTruck();
      if (selectedTruck && selectedTruck.id === truckId) {
        // Keep the map centered with a good zoom level (15)
        const currentZoom = this.map.getZoom();
        // Use at least zoom level 13 to ensure truck is visible
        const targetZoom = currentZoom < 13 ? 15 : currentZoom;
        this.map.setView(newLatLng, targetZoom, { animate: true, duration: 0.5 });
        console.log(`Recentered map on selected truck ${truckId} at zoom ${targetZoom}`);
      }

      // Update heading if available
      // TODO: Install leaflet-rotatedmarker plugin to enable rotation
      // if (position.heading !== undefined && position.heading !== null) {
      //   existingMarker.setRotationAngle(position.heading);
      // }

      console.log(`Updated position for truck ${truckId}`);
    } else {
      // New truck appeared - reload trucks list
      console.log(`New truck detected: ${truckId}`);
      this.loadTrucks();
    }
  }

  /**
   * Focus map on selected truck
   * Centers the map and opens the truck's popup
   */
  private focusOnTruck(truck: Truck): void {
    if (!truck.currentLatitude || !truck.currentLongitude) {
      console.warn(`Cannot focus on truck ${truck.id}: no position available`);
      return;
    }

    // Center map on truck with zoom level 15
    this.map.setView(
      [truck.currentLatitude, truck.currentLongitude],
      15,
      { animate: true }
    );

    // Open popup for this truck if marker exists
    // Use setTimeout to ensure marker is rendered and animation completes
    setTimeout(() => {
      const marker = this.markers.get(truck.id);
      if (marker) {
        marker.openPopup();
        console.log(`Focused on truck ${truck.truckId} - popup opened`);
      } else {
        console.warn(`Marker not found for truck ${truck.id} - available markers:`, Array.from(this.markers.keys()));
      }
    }, 400);
  }
}

// TODO: Add Leaflet Marker rotation plugin
// // Extend Leaflet Marker interface for rotation
// declare module 'leaflet' {
//   interface Marker {
//     setRotationAngle(angle: number): this;
//   }
// }

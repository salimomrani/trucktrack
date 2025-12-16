import { Component, OnInit, signal, inject, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { WebSocketService } from '../../core/services/websocket.service';
import { TruckService } from '../../services/truck.service';
import { StoreFacade } from '../../store/store.facade';
import { Truck, TruckStatus } from '../../models/truck.model';
import { GPSPosition, GPSPositionEvent } from '../../models/gps-position.model';
import { environment } from '../../../environments/environment';
import { SearchBarComponent } from '../../core/components/search-bar/search-bar.component';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';

/**
 * MapComponent - Main map view for displaying live truck locations
 * T079-T092: Implement MapComponent with Leaflet, real-time updates, markers, clustering
 * Refactored with Angular 17+ best practices: signals, inject(), takeUntilDestroyed(), OnPush
 * Migrated to use NgRx StoreFacade with signals
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule, MatButtonModule, SearchBarComponent, FilterPanelComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit {
  // Inject dependencies using inject()
  private readonly facade = inject(StoreFacade);
  private readonly webSocketService = inject(WebSocketService);
  private readonly truckService = inject(TruckService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  // Map and marker state
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private markerClusterGroup!: L.MarkerClusterGroup;
  private isRenderingMarkers = false; // Flag to prevent deselect during re-render

  // T128: History polyline state
  private historyPolyline: L.Polyline | null = null;
  private historyMarkers: L.CircleMarker[] = [];

  // Use store signals for state
  trucks = this.facade.trucks;
  // T108: Use filtered trucks for map display
  filteredTrucks = this.facade.filteredTrucks;
  hasActiveFilters = this.facade.hasActiveFilters;
  isLoading = this.facade.trucksLoading;
  isConnected = signal(false);
  errorMessage = signal('');

  // T126: History mode state
  historyMode = signal(false);
  historyTruckId = signal<string | null>(null);
  historyLoading = signal(false);

  // Flag to track if initial auto-focus has been done
  private initialFocusDone = false;
  // Flag to track if we have query params (skip auto-focus in that case)
  private hasQueryParams = false;

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

    // Effect to re-render markers when filtered trucks change
    // T108: Update MapComponent to handle filter changes
    let previousFilteredTruckIds = '';
    effect(() => {
      const filtered = this.filteredTrucks();
      const currentIds = filtered.map(t => t.id).sort().join(',');

      // Re-render if filtered trucks changed (count or composition)
      if (this.map && currentIds !== previousFilteredTruckIds) {
        this.renderTruckMarkers();
        previousFilteredTruckIds = currentIds;
      }
    });

    // Effect to focus on selected truck
    effect(() => {
      const selectedTruck = this.facade.selectedTruck();
      if (selectedTruck && this.map) {
        this.focusOnTruck(selectedTruck);
      }
    });

    // Effect to auto-focus on trucks area when trucks first load
    effect(() => {
      const allTrucks = this.trucks();
      const loading = this.isLoading();

      // Only auto-focus once, when trucks are loaded and we have data
      if (!this.initialFocusDone && !loading && allTrucks.length > 0 && this.map && !this.hasQueryParams) {
        // Small delay to ensure markers are rendered
        setTimeout(() => {
          this.fitMapToTrucks();
          this.initialFocusDone = true;
        }, 100);
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
    this.setupHistoryEventListener();
    this.handleQueryParams();
  }

  /**
   * Handle query params from history page navigation
   * Centers map on coordinates and selects truck if provided
   */
  private handleQueryParams(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const lat = params['lat'];
      const lng = params['lng'];
      const zoom = params['zoom'];
      const truckId = params['truckId'];

      if (lat && lng) {
        // Set flag to skip auto-focus when we have query params
        this.hasQueryParams = true;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const zoomLevel = zoom ? parseInt(zoom, 10) : 15;

        // Center map on coordinates
        this.map.setView([latitude, longitude], zoomLevel);

        // Add a temporary marker to show the exact position
        const marker = L.circleMarker([latitude, longitude], {
          radius: 10,
          fillColor: '#ff4444',
          color: '#cc0000',
          weight: 2,
          fillOpacity: 0.8
        }).addTo(this.map);

        // Add popup with coordinates
        marker.bindPopup(`<b>History Position</b><br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`).openPopup();

        // Remove marker after 10 seconds
        setTimeout(() => {
          this.map.removeLayer(marker);
        }, 10000);

        // Select truck if provided
        if (truckId) {
          this.facade.selectTruck(truckId);
        }

        this.snackBar.open('Centered on history position', 'OK', { duration: 3000 });
      }
    });
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
   * T108: Use filtered trucks for rendering (respects status filters)
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

    // T108: Use filteredTrucks instead of all trucks
    this.filteredTrucks().forEach(truck => {
      if (truck.currentLatitude && truck.currentLongitude) {
        const marker = this.createTruckMarker(truck);
        this.markers.set(truck.id, marker);
        this.markerClusterGroup.addLayer(marker);
      }
    });

    // Reopen popup if it was open before re-render (only if truck still visible)
    if (openPopupTruckId) {
      const marker = this.markers.get(openPopupTruckId);
      if (marker) {
        // Use setTimeout to ensure marker is fully added to map
        setTimeout(() => {
          marker.openPopup();
        }, 50);
      }
    }

    console.log(`Rendered ${this.markers.size} of ${this.trucks().length} truck markers (filtered)`);

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
   * T126: Add "View History" button
   */
  private createPopupContent(truck: Truck): string {
    const lastUpdate = truck.lastUpdate
      ? new Date(truck.lastUpdate).toLocaleString()
      : 'Unknown';

    const statusClass = truck.status.toLowerCase();
    const speedText = truck.currentSpeed !== null && truck.currentSpeed !== undefined
      ? `${truck.currentSpeed.toFixed(1)} km/h`
      : 'N/A';

    return `
      <div class="truck-popup">
        <div class="popup-header">
          <div class="truck-icon status-${statusClass}">
            <span class="material-icons">local_shipping</span>
          </div>
          <div class="truck-info">
            <h3>${truck.truckId}</h3>
            <span class="status-badge status-${statusClass}">${truck.status}</span>
          </div>
        </div>
        <div class="popup-details">
          ${truck.driverName ? `<div class="detail-row"><span class="material-icons">person</span><span>${truck.driverName}</span></div>` : ''}
          <div class="detail-row"><span class="material-icons">speed</span><span>${speedText}</span></div>
          <div class="detail-row"><span class="material-icons">schedule</span><span>${lastUpdate}</span></div>
        </div>
        <div class="popup-actions">
          <button class="view-history-btn" onclick="window.dispatchEvent(new CustomEvent('viewTruckHistory', {detail: '${truck.id}'}))">
            <span class="material-icons">history</span>
            View History
          </button>
        </div>
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

  /**
   * Fit map to show all trucks with positions
   * Prioritizes active trucks for better initial view
   */
  private fitMapToTrucks(): void {
    const allTrucks = this.trucks();

    // Get all trucks with valid positions
    const trucksWithPositions = allTrucks.filter(
      truck => truck.currentLatitude !== null &&
               truck.currentLatitude !== undefined &&
               truck.currentLongitude !== null &&
               truck.currentLongitude !== undefined
    );

    if (trucksWithPositions.length === 0) {
      console.log('No trucks with positions available for auto-focus');
      return;
    }

    // Prioritize active trucks for the view
    const activeTrucks = trucksWithPositions.filter(truck => truck.status === TruckStatus.ACTIVE);
    const trucksToFocus = activeTrucks.length > 0 ? activeTrucks : trucksWithPositions;

    // Create bounds from truck positions
    const bounds = L.latLngBounds(
      trucksToFocus.map(truck => [truck.currentLatitude!, truck.currentLongitude!] as L.LatLngTuple)
    );

    // Fit map to bounds with padding
    this.map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14, // Don't zoom in too close
      animate: true
    });

    console.log(`Auto-focused map on ${trucksToFocus.length} ${activeTrucks.length > 0 ? 'active' : 'total'} trucks`);
  }

  /**
   * Setup history event listener
   * T126: Listen for "View History" button clicks from popup
   */
  private setupHistoryEventListener(): void {
    window.addEventListener('viewTruckHistory', ((event: CustomEvent) => {
      const truckId = event.detail;
      this.viewTruckHistory(truckId);
    }) as EventListener);
  }

  /**
   * View truck history for the last 24 hours
   * T126, T128: Fetch history and render polyline
   */
  viewTruckHistory(truckId: string): void {
    console.log(`Viewing history for truck: ${truckId}`);
    this.historyLoading.set(true);
    this.historyTruckId.set(truckId);

    // Calculate time range (last 24 hours)
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    this.truckService.getTrucksHistory(startTime, endTime, truckId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (positions: GPSPosition[]) => {
          this.historyLoading.set(false);
          if (positions.length > 0) {
            this.renderHistoryPolyline(positions);
            this.historyMode.set(true);
            this.snackBar.open(`Showing ${positions.length} positions for last 24h`, 'OK', { duration: 3000 });
          } else {
            this.snackBar.open('No history data available for this truck', 'OK', { duration: 3000 });
          }
        },
        error: (err: Error) => {
          this.historyLoading.set(false);
          console.error('Error fetching history:', err);
          this.snackBar.open('Failed to load truck history', 'Dismiss', { duration: 5000 });
        }
      });
  }

  /**
   * Render history polyline on map
   * T128: Implement polyline rendering
   * T129: Add hover tooltips
   */
  private renderHistoryPolyline(positions: GPSPosition[]): void {
    // Clear existing history
    this.clearHistoryFromMap();

    // Create polyline from positions
    const latLngs: L.LatLngExpression[] = positions.map(p => [p.latitude, p.longitude]);

    // T128: Create styled polyline
    this.historyPolyline = L.polyline(latLngs, {
      color: '#2196F3',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(this.map);

    // T129: Add markers with tooltips at key points (start, end, and sampled points)
    const markerInterval = Math.max(1, Math.floor(positions.length / 10)); // Show ~10 markers max

    positions.forEach((position, index) => {
      // Show marker at start, end, and every Nth position
      if (index === 0 || index === positions.length - 1 || index % markerInterval === 0) {
        const isStart = index === 0;
        const isEnd = index === positions.length - 1;

        const marker = L.circleMarker([position.latitude, position.longitude], {
          radius: isStart || isEnd ? 8 : 5,
          fillColor: isStart ? '#4CAF50' : (isEnd ? '#F44336' : '#2196F3'),
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map);

        // T129: Add tooltip with timestamp
        const time = new Date(position.timestamp).toLocaleString();
        const label = isStart ? 'Start' : (isEnd ? 'End' : `Point ${index + 1}`);
        marker.bindTooltip(`
          <strong>${label}</strong><br>
          Time: ${time}<br>
          Speed: ${position.speed?.toFixed(1) ?? 'N/A'} km/h
        `, { permanent: false, direction: 'top' });

        this.historyMarkers.push(marker);
      }
    });

    // Fit map to polyline bounds
    this.map.fitBounds(this.historyPolyline.getBounds(), { padding: [50, 50] });

    console.log(`Rendered history polyline with ${positions.length} points`);
  }

  /**
   * Clear history from map
   * T130: Clear history button handler
   */
  clearHistory(): void {
    this.clearHistoryFromMap();
    this.historyMode.set(false);
    this.historyTruckId.set(null);
    console.log('History cleared');
  }

  /**
   * Remove history polyline and markers from map
   */
  private clearHistoryFromMap(): void {
    if (this.historyPolyline) {
      this.map.removeLayer(this.historyPolyline);
      this.historyPolyline = null;
    }

    this.historyMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.historyMarkers = [];
  }

  // DestroyRef for manual subscription cleanup
  private readonly destroyRef = inject(DestroyRef);
}

// TODO: Add Leaflet Marker rotation plugin
// // Extend Leaflet Marker interface for rotation
// declare module 'leaflet' {
//   interface Marker {
//     setRotationAngle(angle: number): this;
//   }
// }

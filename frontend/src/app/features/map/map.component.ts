import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { TruckService } from '../../services/truck.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Truck, TruckStatus } from '../../models/truck.model';
import { GPSPositionEvent } from '../../models/gps-position.model';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * MapComponent - Main map view for displaying live truck locations
 * T079-T092: Implement MapComponent with Leaflet, real-time updates, markers, clustering
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private markerClusterGroup!: L.MarkerClusterGroup;
  private positionSubscription?: Subscription;

  trucks: Truck[] = [];
  isLoading = true;
  isConnected = false;
  errorMessage = '';

  constructor(
    private truckService: TruckService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadTrucks();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    if (this.positionSubscription) {
      this.positionSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();

    if (this.map) {
      this.map.remove();
    }
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

    console.log('Map initialized');
  }

  /**
   * Load all active trucks from API
   */
  private loadTrucks(): void {
    this.isLoading = true;
    this.truckService.getActiveTrucks().subscribe({
      next: (response) => {
        this.trucks = response.content || [];
        this.renderTruckMarkers();
        this.isLoading = false;
        console.log(`Loaded ${this.trucks.length} trucks`);
      },
      error: (error) => {
        console.error('Failed to load trucks', error);
        this.errorMessage = 'Failed to load trucks. Please refresh the page.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Render truck markers on map
   * T081: Implement truck marker rendering
   * T082: Implement custom truck marker icons
   */
  private renderTruckMarkers(): void {
    // Clear existing markers
    this.markerClusterGroup.clearLayers();
    this.markers.clear();

    this.trucks.forEach(truck => {
      if (truck.currentLatitude && truck.currentLongitude) {
        const marker = this.createTruckMarker(truck);
        this.markers.set(truck.id, marker);
        this.markerClusterGroup.addLayer(marker);
      }
    });

    console.log(`Rendered ${this.markers.size} truck markers`);
  }

  /**
   * Create marker for a truck
   */
  private createTruckMarker(truck: Truck): L.Marker {
    const icon = this.getTruckIcon(truck.status);
    const marker = L.marker(
      [truck.currentLatitude!, truck.currentLongitude!],
      { icon }
    );

    // T085: Implement truck marker click handler (popup with details)
    const popupContent = this.createPopupContent(truck);
    marker.bindPopup(popupContent);

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
   */
  private getTruckIcon(status: TruckStatus): L.DivIcon {
    const color = this.getStatusColor(status);
    const iconHtml = `
      <div class="truck-marker truck-marker-${status.toLowerCase()}"
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

    // Subscribe to connection status
    this.webSocketService.connectionStatus$.subscribe(connected => {
      this.isConnected = connected;
      console.log('WebSocket connection status:', connected);
    });

    // Subscribe to position updates
    // T087: Implement real-time marker position update logic
    this.positionSubscription = this.webSocketService.positionUpdates$.subscribe(position => {
      if (position) {
        this.handlePositionUpdate(position);
      }
    });
  }

  /**
   * Handle real-time position update from WebSocket
   */
  private handlePositionUpdate(position: GPSPositionEvent): void {
    const truckId = position.truckId;
    const existingMarker = this.markers.get(truckId);

    if (existingMarker) {
      // Update existing marker position with animation
      const newLatLng = L.latLng(position.latitude, position.longitude);
      existingMarker.setLatLng(newLatLng);

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
}

// TODO: Add Leaflet Marker rotation plugin
// // Extend Leaflet Marker interface for rotation
// declare module 'leaflet' {
//   interface Marker {
//     setRotationAngle(angle: number): this;
//   }
// }

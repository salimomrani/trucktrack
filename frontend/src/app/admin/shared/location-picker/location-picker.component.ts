import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  input,
  forwardRef,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs';
import * as L from 'leaflet';
import { GeocodingService, GeocodingResult } from '../services/geocoding.service';

/**
 * Location value with address and coordinates.
 */
export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Location Picker Component
 *
 * A reusable form control that combines:
 * - Address autocomplete search (Nominatim)
 * - Mini Leaflet map for visual selection
 *
 * Implements ControlValueAccessor for use with Reactive Forms.
 */
@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationPickerComponent),
      multi: true
    }
  ]
})
export class LocationPickerComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {
  private readonly geocodingService = inject(GeocodingService);
  private readonly elementRef = inject(ElementRef);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  // Signal inputs
  readonly label = input<string>('Location');
  readonly placeholder = input<string>('Search address...');
  readonly required = input<boolean>(false);

  // State signals
  searchQuery = signal('');
  suggestions = signal<GeocodingResult[]>([]);
  selectedLocation = signal<LocationValue | null>(null);
  isSearching = signal(false);
  showMap = signal(false);
  isDisabled = signal(false);

  // Leaflet map
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ControlValueAccessor callbacks
  private onChange: (value: LocationValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    // Setup search with debounce
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => query.length >= 3),
      switchMap(query => {
        this.isSearching.set(true);
        return this.geocodingService.searchAddress(query);
      })
    ).subscribe(results => {
      this.suggestions.set(results);
      this.isSearching.set(false);
    });
  }

  ngAfterViewInit() {
    // Map will be initialized when toggled
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyMap();
  }

  // ControlValueAccessor implementation
  writeValue(value: LocationValue | null): void {
    if (value) {
      this.selectedLocation.set(value);
      this.searchQuery.set(value.address);
      // Update map marker if map is visible
      if (this.map && this.marker) {
        this.marker.setLatLng([value.lat, value.lng]);
        this.map.setView([value.lat, value.lng], 15);
      }
    } else {
      this.selectedLocation.set(null);
      this.searchQuery.set('');
    }
  }

  registerOnChange(fn: (value: LocationValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // Event handlers
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (query.length >= 3) {
      this.searchSubject.next(query);
    } else {
      this.suggestions.set([]);
    }
  }

  onInputBlur() {
    this.onTouched();
  }

  selectSuggestion(result: GeocodingResult) {
    const location: LocationValue = {
      address: result.displayName,
      lat: result.lat,
      lng: result.lng
    };

    this.selectedLocation.set(location);
    this.searchQuery.set(result.displayName);
    this.suggestions.set([]);
    this.onChange(location);

    // Update map if visible
    if (this.map) {
      this.updateMapMarker(result.lat, result.lng);
    }
  }

  clearSelection() {
    this.selectedLocation.set(null);
    this.searchQuery.set('');
    this.suggestions.set([]);
    this.onChange(null);

    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }

  toggleMap() {
    this.showMap.update(v => !v);

    if (this.showMap()) {
      // Initialize map after DOM update
      setTimeout(() => this.initMap(), 100);
    } else {
      this.destroyMap();
    }
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement || this.map) return;

    // Default center (Paris, France)
    let center: [number, number] = [48.8566, 2.3522];
    let zoom = 5;

    // Use selected location if available
    const selected = this.selectedLocation();
    if (selected) {
      center = [selected.lat, selected.lng];
      zoom = 15;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center,
      zoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Add marker if location selected
    if (selected) {
      this.createMarker(selected.lat, selected.lng);
    }

    // Click on map to select location
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Fix map size after initialization
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private onMapClick(lat: number, lng: number) {
    this.updateMapMarker(lat, lng);

    // Reverse geocode to get address
    this.geocodingService.reverseGeocode(lat, lng).subscribe(result => {
      const address = result?.displayName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const location: LocationValue = { address, lat, lng };

      this.selectedLocation.set(location);
      this.searchQuery.set(address);
      this.onChange(location);
    });
  }

  private updateMapMarker(lat: number, lng: number) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.createMarker(lat, lng);
    }

    this.map.setView([lat, lng], Math.max(this.map.getZoom(), 13));
  }

  private createMarker(lat: number, lng: number) {
    if (!this.map) return;

    // Custom marker icon
    const icon = L.divIcon({
      html: '<div class="location-marker"><i class="material-icons">place</i></div>',
      className: 'location-marker-container',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.marker = L.marker([lat, lng], {
      icon,
      draggable: true
    }).addTo(this.map);

    // Handle marker drag
    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (pos) {
        this.onMapClick(pos.lat, pos.lng);
      }
    });
  }

  // Format coordinates for display
  formatCoordinates(): string {
    const loc = this.selectedLocation();
    if (!loc) return '';
    return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
  }
}

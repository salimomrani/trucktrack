import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * MapComponent - Main map view for displaying live truck locations
 * This is a placeholder component that will be fully implemented in Phase 3 (User Story 1)
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <h1>Live Truck Map</h1>
      <p>Map component placeholder - will be implemented in Phase 3 (User Story 1)</p>
    </div>
  `,
  styles: [`
    .map-container {
      padding: 24px;
    }
  `]
})
export class MapComponent {
}

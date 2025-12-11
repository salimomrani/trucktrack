import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { StoreFacade } from '../../store/store.facade';

interface TruckHistory {
  truckId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
}

/**
 * HistoryComponent - View for displaying truck movement history
 * Angular 17+ with signals, OnPush, Material UI
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatChipsModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  private readonly facade = inject(StoreFacade);

  // State signals
  trucks = this.facade.trucks;
  isLoading = signal(false);
  selectedTruckId = signal<string | null>(null);
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  // Mock history data (will be replaced with API call)
  historyData = signal<TruckHistory[]>([]);

  // Computed signals
  selectedTruck = computed(() => {
    const id = this.selectedTruckId();
    if (!id) return null;
    return this.trucks().find(t => t.id === id) || null;
  });

  filteredHistory = computed(() => {
    let data = this.historyData();
    const truckId = this.selectedTruckId();
    const start = this.startDate();
    const end = this.endDate();

    if (truckId) {
      data = data.filter(h => h.truckId === truckId);
    }

    if (start) {
      data = data.filter(h => h.timestamp >= start);
    }

    if (end) {
      data = data.filter(h => h.timestamp <= end);
    }

    return data;
  });

  // Table columns
  displayedColumns: string[] = ['timestamp', 'truckId', 'location', 'speed', 'heading', 'status', 'actions'];

  ngOnInit(): void {
    // Load trucks from store
    this.facade.loadTrucks();

    // Generate mock history data
    this.generateMockHistory();
  }

  onTruckSelect(truckId: string): void {
    this.selectedTruckId.set(truckId);
  }

  onDateRangeChange(): void {
    // Trigger recomputation of filtered history
  }

  clearFilters(): void {
    this.selectedTruckId.set(null);
    this.startDate.set(null);
    this.endDate.set(null);
  }

  viewOnMap(history: TruckHistory): void {
    // TODO: Navigate to map with this location centered
    console.log('View on map:', history);
  }

  exportHistory(): void {
    const data = this.filteredHistory();
    console.log('Exporting history data:', data);
    // TODO: Implement CSV export
  }

  private generateMockHistory(): void {
    // Generate mock data for demonstration
    const mockData: TruckHistory[] = [];
    const trucks = this.trucks();

    if (trucks.length === 0) {
      // Generate data for sample trucks
      const sampleTrucks = ['TRUCK-001', 'TRUCK-002', 'TRUCK-003'];
      const now = new Date();

      sampleTrucks.forEach(truckId => {
        for (let i = 0; i < 20; i++) {
          const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 min intervals
          mockData.push({
            truckId,
            timestamp,
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
            speed: Math.random() * 80,
            heading: Math.random() * 360,
            status: Math.random() > 0.8 ? 'stopped' : 'moving'
          });
        }
      });
    }

    this.historyData.set(mockData);
  }

  formatLocation(lat: number, lon: number): string {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  formatSpeed(speed: number): string {
    return `${speed.toFixed(1)} km/h`;
  }

  formatHeading(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${heading.toFixed(0)}° ${directions[index]}`;
  }
}

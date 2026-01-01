import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, computed, ElementRef, viewChild, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreFacade } from '../../store/store.facade';
import { ToastService } from '../../shared/components/toast/toast.service';

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
 * Now uses REAL DATA from the backend API with infinite scroll
 * Angular 17+ with signals, OnPush, Material UI
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  private readonly facade = inject(StoreFacade);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Infinite scroll observer
  private scrollObserver: IntersectionObserver | null = null;
  readonly scrollSentinel = viewChild<ElementRef>('scrollSentinel');

  // Effect to watch for sentinel availability and attach observer
  private sentinelWatcher = effect(() => {
    const sentinel = this.scrollSentinel();
    if (sentinel?.nativeElement && !this.scrollObserver) {
      this.setupScrollObserver();
    }
  });

  // State signals
  trucks = this.facade.trucks;
  historyData = this.facade.historyEntries;
  isLoading = this.facade.historyLoading;
  historyError = this.facade.historyError;

  // Pagination signals
  hasMorePages = this.facade.historyHasMorePages;
  loadingMore = this.facade.historyLoadingMore;
  totalElements = this.facade.historyTotalElements;

  selectedTruckId = signal<string | null>(null);

  // Default: today (start of day to end of day)
  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }

  private getEndOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  startDate = signal<Date>(this.getStartOfToday());
  endDate = signal<Date>(this.getEndOfToday());

  // Preset time ranges
  timeRanges = [
    { label: 'Today', hours: -1 }, // Special value for today
    { label: 'Last Hour', hours: 1 },
    { label: 'Last 6 Hours', hours: 6 },
    { label: 'Last 24 Hours', hours: 24 },
    { label: 'Last 7 Days', hours: 168 },
    { label: 'Custom', hours: 0 }
  ];
  selectedTimeRange = signal<number>(-1); // Default: Today

  // Computed signals
  selectedTruck = computed(() => {
    const id = this.selectedTruckId();
    if (!id) return null;
    return this.trucks().find(t => t.id === id) || null;
  });

  filteredHistory = computed(() => {
    let data = this.historyData();
    const truckId = this.selectedTruckId();

    if (truckId) {
      data = data.filter(h => h.truckId === truckId);
    }

    return data;
  });

  hasData = computed(() => this.historyData().length > 0);

  // Table columns
  displayedColumns: string[] = ['timestamp', 'truckId', 'location', 'speed', 'heading', 'status', 'actions'];

  ngOnInit(): void {
    // Load trucks from store
    this.facade.loadTrucks();
    // Auto-load history for today
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroyScrollObserver();
  }

  /**
   * Setup IntersectionObserver for infinite scroll
   */
  private setupScrollObserver(): void {
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && this.hasMorePages() && !this.loadingMore() && !this.isLoading()) {
          this.loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    // Observe sentinel when it exists
    const sentinel = this.scrollSentinel();
    if (sentinel?.nativeElement) {
      this.scrollObserver.observe(sentinel.nativeElement);
    }
  }

  /**
   * Cleanup IntersectionObserver
   */
  private destroyScrollObserver(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
  }

  /**
   * Load history for selected truck or all trucks (paginated for infinite scroll)
   */
  loadHistory(): void {
    const truckId = this.selectedTruckId();
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) {
      this.toast.warning('Please select a date range');
      return;
    }

    const startTime = start.toISOString();
    const endTime = end.toISOString();

    // Destroy observer so effect can recreate it when new sentinel renders
    this.destroyScrollObserver();

    // Use paginated endpoint for infinite scroll
    this.facade.loadHistoryPaged(startTime, endTime, truckId, 50);
  }

  /**
   * Load more history (infinite scroll)
   */
  loadMore(): void {
    if (this.hasMorePages() && !this.loadingMore()) {
      this.facade.loadMoreHistory();
    }
  }

  onTruckSelect(truckId: string): void {
    this.selectedTruckId.set(truckId || null);
  }

  onTimeRangeChange(hours: number): void {
    this.selectedTimeRange.set(hours);
    if (hours === -1) {
      // Today: start of day to end of day
      this.startDate.set(this.getStartOfToday());
      this.endDate.set(this.getEndOfToday());
    } else if (hours > 0) {
      const end = new Date();
      const start = new Date(Date.now() - hours * 60 * 60 * 1000);
      this.startDate.set(start);
      this.endDate.set(end);
    }
  }

  onDateChange(): void {
    // Mark as custom range
    this.selectedTimeRange.set(0);
  }

  clearFilters(): void {
    this.selectedTruckId.set(null);
    this.selectedTimeRange.set(-1); // Reset to Today
    this.startDate.set(this.getStartOfToday());
    this.endDate.set(this.getEndOfToday());
    this.facade.clearHistory();
  }

  viewOnMap(history: TruckHistory): void {
    // Navigate to map with location centered and truck selected
    this.router.navigate(['/map'], {
      queryParams: {
        lat: history.latitude,
        lng: history.longitude,
        truckId: history.truckId,
        zoom: 15
      }
    });
  }

  exportHistory(): void {
    const data = this.filteredHistory();
    if (data.length === 0) {
      this.toast.warning('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Timestamp', 'Truck ID', 'Latitude', 'Longitude', 'Speed (km/h)', 'Heading', 'Status'];
    const rows = data.map(h => [
      new Date(h.timestamp).toISOString(),
      h.truckId,
      h.latitude.toFixed(6),
      h.longitude.toFixed(6),
      h.speed.toFixed(1),
      h.heading.toFixed(0),
      h.status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truck-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.toast.success(`Exported ${data.length} records`);
  }

  onStartDateChange(date: Date | null): void {
    if (date) {
      this.startDate.set(date);
      this.onDateChange();
    }
  }

  onEndDateChange(date: Date | null): void {
    if (date) {
      this.endDate.set(date);
      this.onDateChange();
    }
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

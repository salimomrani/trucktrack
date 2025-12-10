import { Component, ChangeDetectionStrategy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TruckService } from '../services/truck.service';
import { Truck, TruckStatus } from '../models/truck.model';

/**
 * Exemple de composant moderne avec best practices Angular 17+
 *
 * ✅ Signals au lieu de propriétés classiques
 * ✅ inject() au lieu de constructor DI
 * ✅ input() pour les @Input
 * ✅ computed() pour les valeurs dérivées
 * ✅ effect() pour les side-effects
 * ✅ OnPush change detection
 */
@Component({
  selector: 'app-truck-list-modern',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ Always use OnPush
  template: `
    <div class="truck-list-container">
      <div class="header">
        <h2>Trucks ({{ truckCount() }})</h2>
        <button mat-raised-button color="primary" (click)="refreshTrucks()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="loading">Loading trucks...</div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      <!-- Filters -->
      <div class="filters">
        <mat-chip-set>
          <mat-chip
            [highlighted]="selectedStatus() === null"
            (click)="filterByStatus(null)">
            All ({{ truckCount() }})
          </mat-chip>
          <mat-chip
            [highlighted]="selectedStatus() === TruckStatus.ACTIVE"
            (click)="filterByStatus(TruckStatus.ACTIVE)">
            Active ({{ activeTrucksCount() }})
          </mat-chip>
          <mat-chip
            [highlighted]="selectedStatus() === TruckStatus.IDLE"
            (click)="filterByStatus(TruckStatus.IDLE)">
            Idle ({{ idleTrucksCount() }})
          </mat-chip>
          <mat-chip
            [highlighted]="selectedStatus() === TruckStatus.OFFLINE"
            (click)="filterByStatus(TruckStatus.OFFLINE)">
            Offline ({{ offlineTrucksCount() }})
          </mat-chip>
        </mat-chip-set>
      </div>

      <!-- Truck list -->
      <div class="trucks-grid">
        @for (truck of filteredTrucks(); track truck.id) {
          <mat-card class="truck-card">
            <mat-card-header>
              <mat-card-title>{{ truck.truckId }}</mat-card-title>
              <mat-chip [ngClass]="'status-' + truck.status.toLowerCase()">
                {{ truck.status }}
              </mat-chip>
            </mat-card-header>
            <mat-card-content>
              @if (truck.driverName) {
                <p><strong>Driver:</strong> {{ truck.driverName }}</p>
              }
              @if (truck.currentSpeed !== null) {
                <p><strong>Speed:</strong> {{ truck.currentSpeed | number:'1.1-1' }} km/h</p>
              }
              @if (truck.lastUpdate) {
                <p><strong>Last Update:</strong> {{ truck.lastUpdate | date:'short' }}</p>
              }
            </mat-card-content>
            <mat-card-actions>
              <button mat-button (click)="viewTruckDetails(truck)">
                View Details
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>

      <!-- Empty state -->
      @if (filteredTrucks().length === 0 && !isLoading()) {
        <div class="empty-state">
          <mat-icon>local_shipping</mat-icon>
          <p>No trucks found</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .truck-list-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .filters {
      margin-bottom: 20px;
    }

    .trucks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .truck-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .status-active { background-color: #4CAF50; color: white; }
    .status-idle { background-color: #FFC107; color: black; }
    .status-offline { background-color: #9E9E9E; color: white; }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
    }

    .loading, .error {
      text-align: center;
      padding: 20px;
    }

    .error { color: #f44336; }
  `]
})
export class TruckListModernComponent {
  // ✅ inject() au lieu de constructor DI
  private truckService = inject(TruckService);

  // ✅ Signals pour l'état du composant
  trucks = signal<Truck[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  selectedStatus = signal<TruckStatus | null>(null);

  // ✅ Computed values (calculés automatiquement)
  truckCount = computed(() => this.trucks().length);

  activeTrucksCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.ACTIVE).length
  );

  idleTrucksCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.IDLE).length
  );

  offlineTrucksCount = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.OFFLINE).length
  );

  // ✅ Computed pour filtrer les trucks
  filteredTrucks = computed(() => {
    const status = this.selectedStatus();
    if (status === null) {
      return this.trucks();
    }
    return this.trucks().filter(t => t.status === status);
  });

  // Exposer TruckStatus pour le template
  readonly TruckStatus = TruckStatus;

  constructor() {
    // ✅ Effect pour charger les données au démarrage
    effect(() => {
      this.loadTrucks();
    }, { allowSignalWrites: true });

    // ✅ Effect pour logger les changements de filtre
    effect(() => {
      const status = this.selectedStatus();
      console.log('Filter changed to:', status);
    });
  }

  /**
   * Charger la liste des trucks
   */
  private loadTrucks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.truckService.getActiveTrucks().subscribe({
      next: (response) => {
        this.trucks.set(response.content || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trucks:', err);
        this.error.set('Failed to load trucks. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Rafraîchir la liste des trucks
   */
  refreshTrucks(): void {
    this.loadTrucks();
  }

  /**
   * Filtrer par statut
   */
  filterByStatus(status: TruckStatus | null): void {
    this.selectedStatus.set(status);
  }

  /**
   * Voir les détails d'un truck
   */
  viewTruckDetails(truck: Truck): void {
    console.log('View truck details:', truck);
    // Navigation vers la page de détails
  }
}

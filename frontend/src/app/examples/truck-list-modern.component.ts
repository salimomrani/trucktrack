import { Component, ChangeDetectionStrategy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-truck-list-modern',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './truck-list-modern.component.html',
  styleUrls: ['./truck-list-modern.component.scss']
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
    // Navigation vers la page de détails
  }
}

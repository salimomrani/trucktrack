import { Component, OnInit, inject, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntityType } from '../../../../core/models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

interface EntityOption {
  id: string;
  name: string;
  licensePlate?: string;
}

/**
 * Entity filter component for analytics dashboard.
 * Feature: 006-fleet-analytics
 * T025: Create entity-filter component
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-entity-filter',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entity-filter.component.html',
  styleUrls: ['./entity-filter.component.scss']
})
export class EntityFilterComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly selectedType = input<EntityType>('FLEET');
  readonly selectedEntityId = input<string | null>(null);

  readonly typeChange = output<EntityType>();
  readonly entityChange = output<string | null>();

  // Local state for select values
  localType: EntityType = 'FLEET';
  localEntityId: string | null = null;

  readonly isLoading = signal(false);
  readonly trucks = signal<EntityOption[]>([]);
  readonly groups = signal<EntityOption[]>([]);

  readonly typeOptions: { value: EntityType; label: string }[] = [
    { value: 'FLEET', label: 'Toute la flotte' },
    { value: 'GROUP', label: 'Par groupe' },
    { value: 'TRUCK', label: 'Par camion' }
  ];

  readonly currentEntities = signal<EntityOption[]>([]);

  ngOnInit(): void {
    this.localType = this.selectedType();
    this.localEntityId = this.selectedEntityId();
    this.loadEntities();
  }

  onTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const type = select.value as EntityType;
    this.localType = type;
    this.localEntityId = null;
    this.typeChange.emit(type);
    this.entityChange.emit(null);
    this.updateCurrentEntities();
  }

  onEntityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const entityId = select.value || null;
    this.localEntityId = entityId;
    this.entityChange.emit(entityId);
  }

  private loadEntities(): void {
    this.isLoading.set(true);

    // Load trucks
    this.analyticsService.getAccessibleTrucks().subscribe({
      next: (trucks) => {
        this.trucks.set(trucks.map(t => ({
          id: t.id,
          name: t.truckId || t.name,
          licensePlate: t.licensePlate
        })));
        this.updateCurrentEntities();
      },
      error: (err) => console.error('Failed to load trucks:', err)
    });

    // Load groups
    this.analyticsService.getAccessibleGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups.map(g => ({
          id: g.id,
          name: g.name
        })));
        this.updateCurrentEntities();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.isLoading.set(false);
      }
    });
  }

  private updateCurrentEntities(): void {
    if (this.localType === 'TRUCK') {
      this.currentEntities.set(this.trucks());
    } else if (this.localType === 'GROUP') {
      this.currentEntities.set(this.groups());
    } else {
      this.currentEntities.set([]);
    }
  }
}

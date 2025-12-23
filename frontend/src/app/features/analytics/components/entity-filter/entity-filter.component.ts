import { Component, Input, Output, EventEmitter, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
 */
@Component({
  selector: 'app-entity-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entity-filter.component.html',
  styleUrls: ['./entity-filter.component.scss']
})
export class EntityFilterComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  @Input() selectedType: EntityType = 'FLEET';
  @Input() selectedEntityId: string | null = null;

  @Output() typeChange = new EventEmitter<EntityType>();
  @Output() entityChange = new EventEmitter<string | null>();

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
    this.loadEntities();
  }

  onTypeChange(type: EntityType): void {
    this.selectedType = type;
    this.selectedEntityId = null;
    this.typeChange.emit(type);
    this.entityChange.emit(null);
    this.updateCurrentEntities();
  }

  onEntityChange(entityId: string | null): void {
    this.selectedEntityId = entityId;
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
    if (this.selectedType === 'TRUCK') {
      this.currentEntities.set(this.trucks());
    } else if (this.selectedType === 'GROUP') {
      this.currentEntities.set(this.groups());
    } else {
      this.currentEntities.set([]);
    }
  }
}

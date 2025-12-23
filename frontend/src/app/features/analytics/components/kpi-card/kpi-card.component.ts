import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * KPI Card component for displaying individual KPI metrics.
 * Feature: 006-fleet-analytics
 * T018: Create kpi-card component
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() unit = '';
  @Input() icon = 'analytics';
  @Input() iconClass = 'primary';
  @Input() subtitle = '';
  @Input() isLoading = false;
  @Input() formatter?: (value: number) => string;

  get formattedValue(): string {
    if (typeof this.value === 'string') {
      return this.value;
    }
    if (this.formatter) {
      return this.formatter(this.value);
    }
    // Default formatting with thousands separator
    return this.value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }
}

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

/**
 * KPI Card component for displaying individual KPI metrics.
 * Feature: 006-fleet-analytics
 * T018: Create kpi-card component
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
  readonly label = input('');
  readonly value = input<number | string>(0);
  readonly unit = input('');
  readonly icon = input('analytics');
  readonly iconClass = input('primary');
  readonly subtitle = input('');
  readonly isLoading = input(false);
  readonly formatter = input<((value: number) => string) | undefined>(undefined);

  readonly formattedValue = computed(() => {
    const val = this.value();
    const fmt = this.formatter();
    if (typeof val === 'string') {
      return val;
    }
    if (fmt) {
      return fmt(val);
    }
    // Default formatting with thousands separator
    return val.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  });

  readonly iconColorClass = computed(() => {
    const cls = this.iconClass();
    const colorMap: Record<string, string> = {
      'primary': 'bg-primary-100 text-primary-600',
      'success': 'bg-success-100 text-success-600',
      'warning': 'bg-warning-100 text-warning-600',
      'error': 'bg-danger-100 text-danger-600',
      'info': 'bg-info-100 text-info-600'
    };
    return colorMap[cls] || colorMap['primary'];
  });
}

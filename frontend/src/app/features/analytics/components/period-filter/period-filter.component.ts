import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PeriodType } from '../../../../core/models/analytics.model';

/**
 * Period filter component for analytics dashboard.
 * Feature: 006-fleet-analytics
 * T024: Create period-filter component
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './period-filter.component.html',
  styleUrls: ['./period-filter.component.scss']
})
export class PeriodFilterComponent {
  readonly selectedPeriod = input<PeriodType>('WEEK');
  readonly startDate = input<string | null>(null);
  readonly endDate = input<string | null>(null);

  readonly periodChange = output<PeriodType>();
  readonly dateRangeChange = output<{ startDate: string; endDate: string }>();

  readonly maxDate = new Date().toISOString().split('T')[0];
  readonly dateError = signal<string | null>(null);

  // Local state for date inputs
  localStartDate = '';
  localEndDate = '';

  readonly periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'TODAY', label: "Aujourd'hui" },
    { value: 'WEEK', label: '7 derniers jours' },
    { value: 'MONTH', label: '30 derniers jours' },
    { value: 'CUSTOM', label: 'Personnalisé' }
  ];

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const period = select.value as PeriodType;
    this.periodChange.emit(period);

    if (period === 'CUSTOM' && this.localStartDate && this.localEndDate) {
      this.emitDateRange();
    }
  }

  onStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.localStartDate = input.value;
    this.validateAndEmit();
  }

  onEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.localEndDate = input.value;
    this.validateAndEmit();
  }

  private validateAndEmit(): void {
    this.validateDates();
    if (!this.dateError() && this.localStartDate && this.localEndDate) {
      this.emitDateRange();
    }
  }

  private validateDates(): void {
    this.dateError.set(null);

    if (!this.localStartDate || !this.localEndDate) {
      return;
    }

    const start = new Date(this.localStartDate);
    const end = new Date(this.localEndDate);

    if (end < start) {
      this.dateError.set('La date de fin doit être après la date de début');
      return;
    }

    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 365) {
      this.dateError.set('La période ne peut pas dépasser 365 jours');
      return;
    }
  }

  private emitDateRange(): void {
    if (this.localStartDate && this.localEndDate) {
      this.dateRangeChange.emit({
        startDate: this.localStartDate,
        endDate: this.localEndDate
      });
    }
  }

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDayCount(): number {
    if (!this.localStartDate || !this.localEndDate) {
      return 0;
    }
    const start = new Date(this.localStartDate);
    const end = new Date(this.localEndDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}

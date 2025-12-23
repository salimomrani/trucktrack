import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PeriodType } from '../../../../core/models/analytics.model';

/**
 * Period filter component for analytics dashboard.
 * Feature: 006-fleet-analytics
 * T024: Create period-filter component
 */
@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './period-filter.component.html',
  styleUrls: ['./period-filter.component.scss']
})
export class PeriodFilterComponent {
  @Input() selectedPeriod: PeriodType = 'WEEK';
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;

  @Output() periodChange = new EventEmitter<PeriodType>();
  @Output() dateRangeChange = new EventEmitter<{ startDate: string; endDate: string }>();

  readonly maxDate = new Date();
  dateError: string | null = null;

  readonly periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'TODAY', label: "Aujourd'hui" },
    { value: 'WEEK', label: '7 derniers jours' },
    { value: 'MONTH', label: '30 derniers jours' },
    { value: 'CUSTOM', label: 'Personnalisé' }
  ];

  onPeriodChange(period: PeriodType): void {
    this.selectedPeriod = period;
    this.periodChange.emit(period);

    if (period === 'CUSTOM' && this.startDate && this.endDate) {
      this.emitDateRange();
    }
  }

  onDateChange(): void {
    this.validateDates();
    if (!this.dateError && this.startDate && this.endDate) {
      this.emitDateRange();
    }
  }

  private validateDates(): void {
    this.dateError = null;

    if (!this.startDate || !this.endDate) {
      return;
    }

    if (this.endDate < this.startDate) {
      this.dateError = 'La date de fin doit être après la date de début';
      return;
    }

    const days = Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 365) {
      this.dateError = 'La période ne peut pas dépasser 365 jours';
      return;
    }
  }

  private emitDateRange(): void {
    if (this.startDate && this.endDate) {
      this.dateRangeChange.emit({
        startDate: this.formatDate(this.startDate),
        endDate: this.formatDate(this.endDate)
      });
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDayCount(): number {
    if (!this.startDate || !this.endDate) {
      return 0;
    }
    return Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}

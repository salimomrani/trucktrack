import {
  Component,
  input,
  model,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import { DatepickerMode } from '../types';

/**
 * TruckTrack Datepicker Component
 * Feature: 020-tailwind-migration
 *
 * A datepicker component using Flatpickr with Tailwind CSS styling.
 *
 * @example
 * <app-datepicker
 *   label="Start Date"
 *   [(value)]="startDate"
 *   [minDate]="today"
 *   dateFormat="d/m/Y">
 * </app-datepicker>
 */
@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements AfterViewInit, OnDestroy {
  /** Datepicker label */
  readonly label = input<string>('');

  /** Placeholder text */
  readonly placeholder = input<string>('Select date');

  /** Minimum selectable date */
  readonly minDate = input<Date | null>(null);

  /** Maximum selectable date */
  readonly maxDate = input<Date | null>(null);

  /** Date format string (Flatpickr format) */
  readonly dateFormat = input<string>('Y-m-d');

  /** Enable time selection */
  readonly enableTime = input<boolean>(false);

  /** Selection mode */
  readonly mode = input<DatepickerMode>('single');

  /** Whether the datepicker is disabled */
  readonly disabled = input<boolean>(false);

  /** Error message to display */
  readonly error = input<string | null>(null);

  /** Selected date value with two-way binding */
  readonly value = model<Date | Date[] | null>(null);

  /** Reference to the input element */
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('dateInput');

  /** Unique ID for the datepicker */
  readonly pickerId = `datepicker-${Math.random().toString(36).substring(2, 9)}`;

  /** Flatpickr instance */
  private flatpickrInstance: Instance | null = null;

  constructor() {
    // React to external value changes
    effect(() => {
      const newValue = this.value();
      if (this.flatpickrInstance && newValue !== undefined) {
        this.flatpickrInstance.setDate(newValue as Date | Date[], false);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initFlatpickr();
  }

  ngOnDestroy(): void {
    this.destroyFlatpickr();
  }

  /**
   * Initialize Flatpickr
   */
  private initFlatpickr(): void {
    const inputEl = this.inputRef()?.nativeElement;
    if (!inputEl) return;

    this.flatpickrInstance = flatpickr(inputEl, {
      dateFormat: this.dateFormat(),
      enableTime: this.enableTime(),
      mode: this.mode(),
      minDate: this.minDate() || undefined,
      maxDate: this.maxDate() || undefined,
      defaultDate: this.value() || undefined,
      onChange: (selectedDates: Date[]) => {
        if (this.mode() === 'single') {
          this.value.set(selectedDates[0] || null);
        } else {
          this.value.set(selectedDates);
        }
      },
      onOpen: () => {
        // Add custom class to calendar for styling
        this.flatpickrInstance?.calendarContainer.classList.add('tt-datepicker');
      }
    });
  }

  /**
   * Destroy Flatpickr instance
   */
  private destroyFlatpickr(): void {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
      this.flatpickrInstance = null;
    }
  }

  /**
   * Clear the selected date
   */
  clearDate(): void {
    this.value.set(null);
    if (this.flatpickrInstance) {
      this.flatpickrInstance.clear();
    }
  }

  /**
   * Open the datepicker
   */
  openPicker(): void {
    if (!this.disabled() && this.flatpickrInstance) {
      this.flatpickrInstance.open();
    }
  }

  /**
   * Get input classes
   */
  getInputClasses(): string {
    const base = 'w-full px-3 py-2 pr-10 border rounded-md text-gray-800 placeholder-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2';

    const stateClasses = this.error()
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
      : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20';

    const disabledClasses = this.disabled()
      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
      : 'bg-white cursor-pointer';

    return `${base} ${stateClasses} ${disabledClasses}`;
  }

  /**
   * Get label classes
   */
  getLabelClasses(): string {
    const base = 'block text-sm font-medium mb-1.5';
    const colorClass = this.error() ? 'text-danger-600' : 'text-gray-700';
    return `${base} ${colorClass}`;
  }
}

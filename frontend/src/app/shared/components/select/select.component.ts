import { Component, input, model, ChangeDetectionStrategy, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectOption } from '../types';

/**
 * TruckTrack Select Component
 * Feature: 020-tailwind-migration
 *
 * A customizable select/dropdown component using Tailwind CSS.
 *
 * @example
 * <app-select
 *   label="Truck"
 *   [options]="truckOptions()"
 *   [(value)]="selectedTruck"
 *   searchable>
 * </app-select>
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent {
  private readonly elementRef = inject(ElementRef);

  /** Available options */
  readonly options = input<SelectOption[]>([]);

  /** Select label */
  readonly label = input<string>('');

  /** Placeholder text */
  readonly placeholder = input<string>('Select...');

  /** Enable multi-select */
  readonly multiple = input<boolean>(false);

  /** Enable search/filter */
  readonly searchable = input<boolean>(false);

  /** Whether the select is disabled */
  readonly disabled = input<boolean>(false);

  /** Error message to display */
  readonly error = input<string | null>(null);

  /** Selected value with two-way binding */
  readonly value = model<any>(null);

  /** Whether dropdown is open */
  readonly isOpen = signal(false);

  /** Search query for filtering */
  readonly searchQuery = signal('');

  /** Unique ID for the select */
  readonly selectId = `select-${Math.random().toString(36).substring(2, 9)}`;

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown(): void {
    if (!this.disabled()) {
      this.isOpen.update(open => !open);
      if (!this.isOpen()) {
        this.searchQuery.set('');
      }
    }
  }

  /**
   * Select an option
   */
  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple()) {
      const currentValue = this.value() || [];
      const index = currentValue.indexOf(option.value);
      if (index > -1) {
        this.value.set([...currentValue.slice(0, index), ...currentValue.slice(index + 1)]);
      } else {
        this.value.set([...currentValue, option.value]);
      }
    } else {
      this.value.set(option.value);
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }

  /**
   * Check if option is selected
   */
  isSelected(option: SelectOption): boolean {
    if (this.multiple()) {
      return (this.value() || []).includes(option.value);
    }
    return this.value() === option.value;
  }

  /**
   * Get filtered options based on search
   */
  getFilteredOptions(): SelectOption[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options();
    return this.options().filter(opt =>
      opt.label.toLowerCase().includes(query)
    );
  }

  /**
   * Get display text for selected value
   */
  getDisplayText(): string {
    if (this.multiple()) {
      const values = this.value() || [];
      if (values.length === 0) return '';
      const selected = this.options().filter(opt => values.includes(opt.value));
      return selected.map(s => s.label).join(', ');
    }

    const selected = this.options().find(opt => opt.value === this.value());
    return selected?.label || '';
  }

  /**
   * Get trigger button classes
   */
  getTriggerClasses(): string {
    const base = 'w-full px-3 py-2 text-left border rounded-md transition-colors duration-150 focus:outline-none focus:ring-2';

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

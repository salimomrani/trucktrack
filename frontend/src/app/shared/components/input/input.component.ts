import { Component, input, output, model, ChangeDetectionStrategy, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputType } from '../types';

/**
 * TruckTrack Input Component
 * Feature: 020-tailwind-migration
 *
 * A customizable input component using Tailwind CSS.
 *
 * @example
 * <app-input
 *   type="email"
 *   label="Email"
 *   [(value)]="email"
 *   [error]="emailError()">
 * </app-input>
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent {
  /** Input type */
  readonly type = input<InputType>('text');

  /** Input label */
  readonly label = input<string>('');

  /** Input placeholder */
  readonly placeholder = input<string>('');

  /** Whether the input is disabled */
  readonly disabled = input<boolean>(false);

  /** Whether the input is readonly */
  readonly readonly = input<boolean>(false);

  /** Whether the input is required */
  readonly required = input<boolean>(false);

  /** Error message to display */
  readonly error = input<string | null>(null);

  /** Hint text to display */
  readonly hint = input<string | null>(null);

  /** Material icon name for prefix */
  readonly prefixIcon = input<string | null>(null);

  /** Material icon name for suffix */
  readonly suffixIcon = input<string | null>(null);

  /** Input value with two-way binding */
  readonly value = model<string>('');

  /** Blur event emitter */
  readonly blur = output<FocusEvent>();

  /** Reference to the input element */
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputElement');

  /** Unique ID for the input */
  readonly inputId = `input-${Math.random().toString(36).substring(2, 9)}`;

  /**
   * Handle input value change
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }

  /**
   * Handle blur event
   */
  onBlur(event: FocusEvent): void {
    this.blur.emit(event);
  }

  /**
   * Get input container classes
   */
  getContainerClasses(): string {
    const base = 'relative';
    return base;
  }

  /**
   * Get input element classes
   */
  getInputClasses(): string {
    const base = 'w-full px-3 py-2 border rounded-md text-gray-800 placeholder-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2';

    const hasPrefix = this.prefixIcon() ? 'pl-10' : '';
    const hasSuffix = this.suffixIcon() ? 'pr-10' : '';

    const stateClasses = this.error()
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
      : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/20';

    const disabledClasses = this.disabled()
      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
      : 'bg-white';

    return `${base} ${hasPrefix} ${hasSuffix} ${stateClasses} ${disabledClasses}`.trim();
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

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonVariant, ComponentSize } from '../types';

/**
 * TruckTrack Button Component
 * Feature: 020-tailwind-migration
 *
 * A customizable button component using Tailwind CSS.
 *
 * @example
 * <app-button variant="primary" (clicked)="onSubmit()">Save</app-button>
 * <app-button variant="secondary" [disabled]="true">Cancel</app-button>
 * <app-button variant="danger" [loading]="isDeleting()">Delete</app-button>
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  /** Button style variant */
  readonly variant = input<ButtonVariant>('primary');

  /** Button size */
  readonly size = input<ComponentSize>('md');

  /** Whether the button is disabled */
  readonly disabled = input<boolean>(false);

  /** Whether to show loading spinner */
  readonly loading = input<boolean>(false);

  /** Material icon name (optional) */
  readonly icon = input<string | null>(null);

  /** Position of the icon */
  readonly iconPosition = input<'left' | 'right'>('left');

  /** Whether button should take full width */
  readonly fullWidth = input<boolean>(false);

  /** HTML button type */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Click event emitter */
  readonly clicked = output<MouseEvent>();

  /**
   * Handle button click
   */
  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  /**
   * Get CSS classes based on variant
   */
  getVariantClasses(): string {
    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-primary-700 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
    };
    return variantMap[this.variant()];
  }

  /**
   * Get CSS classes based on size
   */
  getSizeClasses(): string {
    const sizeMap: Record<ComponentSize, string> = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[40px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    };
    return sizeMap[this.size()];
  }

  /**
   * Get all button CSS classes
   */
  getButtonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const widthClasses = this.fullWidth() ? 'w-full' : '';
    const stateClasses = this.disabled() || this.loading() ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${stateClasses}`.trim();
  }
}

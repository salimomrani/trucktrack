import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card Component - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A flexible card component with variants, padding options, and hover effects.
 * Replaces MatCard usage across the application.
 *
 * @example
 * <app-card variant="elevated" padding="md" [hoverable]="true">
 *   <ng-container card-header>Header Content</ng-container>
 *   <ng-container card-content>Body Content</ng-container>
 *   <ng-container card-footer>Footer Content</ng-container>
 * </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  /** Card variant style */
  readonly variant = input<CardVariant>('default');

  /** Padding size */
  readonly padding = input<CardPadding>('md');

  /** Enable hover effect */
  readonly hoverable = input<boolean>(false);

  /** Enable click styles (pointer cursor) */
  readonly clickable = input<boolean>(false);

  /** Full width card */
  readonly fullWidth = input<boolean>(false);

  /** Custom CSS classes to add */
  readonly customClass = input<string>('');

  /**
   * Get variant-specific classes
   */
  getVariantClasses(): string {
    const variants: Record<CardVariant, string> = {
      default: 'bg-white rounded-lg shadow-card',
      elevated: 'bg-white rounded-lg shadow-lg',
      outlined: 'bg-white rounded-lg border border-gray-200',
      flat: 'bg-gray-50 rounded-lg'
    };
    return variants[this.variant()];
  }

  /**
   * Get padding classes
   */
  getPaddingClasses(): string {
    const paddings: Record<CardPadding, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };
    return paddings[this.padding()];
  }

  /**
   * Get all card classes combined
   */
  getCardClasses(): string {
    const classes = [
      this.getVariantClasses(),
      this.getPaddingClasses()
    ];

    if (this.hoverable()) {
      classes.push('transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5');
    }

    if (this.clickable()) {
      classes.push('cursor-pointer');
    }

    if (this.fullWidth()) {
      classes.push('w-full');
    }

    if (this.customClass()) {
      classes.push(this.customClass());
    }

    return classes.filter(Boolean).join(' ');
  }
}

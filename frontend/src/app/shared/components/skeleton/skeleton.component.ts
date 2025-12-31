import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton variant types
 */
export type SkeletonVariant =
  | 'text'      // Single line of text
  | 'title'     // Larger text (heading)
  | 'avatar'    // Circular avatar
  | 'thumbnail' // Square image
  | 'button'    // Button shape
  | 'input'     // Form input field
  | 'card'      // Full card placeholder
  | 'table-row' // Table row with cells
  | 'list-item' // List item with avatar and text
  | 'kpi-card'  // KPI card (icon + label + value)
  | 'chart'     // Chart placeholder
  | 'profile'   // Profile card skeleton
  | 'custom';   // Custom dimensions

/**
 * Skeleton Loader Component
 *
 * A flexible skeleton loading placeholder with multiple variants.
 * Supports dark mode via Tailwind classes.
 *
 * @example
 * // Text skeleton
 * <app-skeleton variant="text" />
 *
 * // Multiple text lines
 * <app-skeleton variant="text" [lines]="3" />
 *
 * // Avatar
 * <app-skeleton variant="avatar" size="lg" />
 *
 * // Table rows
 * <app-skeleton variant="table-row" [count]="5" [columns]="4" />
 *
 * // KPI Card
 * <app-skeleton variant="kpi-card" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  /** Skeleton variant type */
  readonly variant = input<SkeletonVariant>('text');

  /** Size: sm, md, lg */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Number of items to render (for text lines, table rows, list items) */
  readonly count = input<number>(1);

  /** Number of lines for text variant */
  readonly lines = input<number>(1);

  /** Number of columns for table-row variant */
  readonly columns = input<number>(4);

  /** Custom width (CSS value) */
  readonly width = input<string | null>(null);

  /** Custom height (CSS value) */
  readonly height = input<string | null>(null);

  /** Whether to animate */
  readonly animate = input<boolean>(true);

  /** Whether to use rounded corners */
  readonly rounded = input<boolean>(true);

  /**
   * Generate array for iteration
   */
  getArray(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  /**
   * Get random width for text lines (more natural look)
   */
  getRandomWidth(index: number): string {
    const widths = ['100%', '95%', '85%', '75%', '90%', '80%', '70%'];
    return widths[index % widths.length];
  }

  /**
   * Get size classes for avatar
   */
  getAvatarSizeClass(): string {
    switch (this.size()) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  }

  /**
   * Get height class for text
   */
  getTextHeightClass(): string {
    switch (this.size()) {
      case 'sm': return 'h-3';
      case 'lg': return 'h-5';
      default: return 'h-4';
    }
  }

  /**
   * Get height class for title
   */
  getTitleHeightClass(): string {
    switch (this.size()) {
      case 'sm': return 'h-5';
      case 'lg': return 'h-8';
      default: return 'h-6';
    }
  }
}

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';

/**
 * Card Component
 * Reusable card container with optional title, subtitle, and action slots.
 * Feature: 020-tailwind-migration (US5)
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  /** Card title (optional) */
  readonly title = input<string | null>(null);

  /** Card subtitle (optional) */
  readonly subtitle = input<string | null>(null);

  /** Show elevated shadow (default: true) */
  readonly elevated = input<boolean>(true);

  /** Enable hover effect (default: false) */
  readonly hoverable = input<boolean>(false);

  /** Content padding: 'none' | 'sm' | 'md' | 'lg' (default: 'md') */
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');

  /** Computed card classes */
  readonly cardClasses = computed(() => {
    const classes = [
      'card',
      'bg-white dark:bg-gray-800',
      'rounded-lg',
      'border border-gray-200 dark:border-gray-700'
    ];

    // Elevation
    if (this.elevated()) {
      classes.push('shadow-card');
    }

    // Hover effect
    if (this.hoverable()) {
      classes.push('transition-shadow hover:shadow-lg cursor-pointer');
    }

    return classes.join(' ');
  });

  /** Computed content padding classes */
  readonly contentClasses = computed(() => {
    const padding = this.padding();
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      case 'md':
      default:
        return 'p-4';
    }
  });

  /** Check if header should be shown */
  readonly hasHeader = computed(() => {
    return this.title() !== null || this.subtitle() !== null;
  });
}

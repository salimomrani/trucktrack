import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Unified Badge Component
 * Replaces all scattered badge/status implementations across the app
 *
 * Usage:
 * <app-badge variant="success">Active</app-badge>
 * <app-badge variant="danger" size="sm">Critical</app-badge>
 * <app-badge variant="warning" [dot]="true">Pending</app-badge>
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses()">
      @if (dot()) {
        <span [class]="dotClasses()"></span>
      }
      @if (icon()) {
        <span class="material-icons" [class]="iconClasses()">{{ icon() }}</span>
      }
      <ng-content />
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');
  readonly size = input<BadgeSize>('md');
  readonly dot = input<boolean>(false);
  readonly icon = input<string>('');
  readonly pill = input<boolean>(true);

  readonly badgeClasses = computed(() => {
    const v = this.variant();
    const s = this.size();
    const isPill = this.pill();

    const base = 'inline-flex items-center font-medium';
    const rounded = isPill ? 'rounded-full' : 'rounded-md';

    // Size classes
    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2'
    };

    // Variant classes (background + text color)
    const variantClasses: Record<BadgeVariant, string> = {
      success: 'bg-success-50 text-success-700',
      warning: 'bg-warning-50 text-warning-700',
      danger: 'bg-danger-50 text-danger-700',
      info: 'bg-info-50 text-info-700',
      neutral: 'bg-gray-100 text-gray-700',
      primary: 'bg-primary-50 text-primary-700'
    };

    return `${base} ${rounded} ${sizeClasses[s]} ${variantClasses[v]}`;
  });

  readonly dotClasses = computed(() => {
    const v = this.variant();
    const s = this.size();

    const dotSizes: Record<BadgeSize, string> = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5'
    };

    const dotColors: Record<BadgeVariant, string> = {
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-info-500',
      neutral: 'bg-gray-500',
      primary: 'bg-primary-500'
    };

    return `rounded-full ${dotSizes[s]} ${dotColors[v]}`;
  });

  readonly iconClasses = computed(() => {
    const s = this.size();
    const iconSizes: Record<BadgeSize, string> = {
      sm: '!text-xs',
      md: '!text-sm',
      lg: '!text-base'
    };
    return iconSizes[s];
  });
}

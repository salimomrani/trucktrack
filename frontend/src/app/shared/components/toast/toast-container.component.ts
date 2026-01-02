import { Component, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from './toast.service';

/**
 * Toast Container Component - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * Container that displays all active toasts.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toasts; track toast.id) {
        <div
          class="flex items-start gap-3 p-4 rounded-lg shadow-lg pointer-events-auto transition-all duration-300 border-l-4"
          [class.opacity-0]="!toast.visible"
          [class.translate-x-full]="!toast.visible"
          [class.opacity-100]="toast.visible"
          [class.translate-x-0]="toast.visible"
          [ngClass]="getToastClasses(toast.type)"
          role="alert">
          <!-- Icon -->
          <span class="material-icons text-xl flex-shrink-0 mt-0.5"
            [ngClass]="getIconClasses(toast.type)">
            {{ getIcon(toast.type) }}
          </span>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium"
              [ngClass]="getTextClasses(toast.type)">
              {{ toast.message }}
            </p>
            @if (toast.action) {
              <button
                type="button"
                class="mt-1 text-sm font-medium underline"
                [ngClass]="getActionClasses(toast.type)"
                (click)="onAction(toast)">
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Dismiss button -->
          @if (toast.dismissible) {
            <button
              type="button"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              (click)="dismiss(toast.id)"
              aria-label="Dismiss">
              <span class="material-icons text-lg">close</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  readonly cdr = inject(ChangeDetectorRef);
  toasts: Toast[] = [];
  toastService!: ToastService;

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  getToastClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-success-50 dark:bg-success-900/40 border-success-500',
      error: 'bg-danger-50 dark:bg-danger-900/40 border-danger-500',
      warning: 'bg-warning-50 dark:bg-warning-900/40 border-warning-500',
      info: 'bg-primary-50 dark:bg-primary-900/40 border-primary-500'
    };
    return classes[type] || classes['info'];
  }

  getIconClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-success-600 dark:text-success-400',
      error: 'text-danger-600 dark:text-danger-400',
      warning: 'text-warning-600 dark:text-warning-400',
      info: 'text-primary-600 dark:text-primary-400'
    };
    return classes[type] || classes['info'];
  }

  getTextClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-success-800 dark:text-success-200',
      error: 'text-danger-800 dark:text-danger-200',
      warning: 'text-warning-800 dark:text-warning-200',
      info: 'text-primary-800 dark:text-primary-200'
    };
    return classes[type] || classes['info'];
  }

  getActionClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-success-700 dark:text-success-300',
      error: 'text-danger-700 dark:text-danger-300',
      warning: 'text-warning-700 dark:text-warning-300',
      info: 'text-primary-700 dark:text-primary-300'
    };
    return classes[type] || classes['info'];
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  onAction(toast: Toast): void {
    if (toast.action) {
      toast.action.callback();
      this.dismiss(toast.id);
    }
  }
}

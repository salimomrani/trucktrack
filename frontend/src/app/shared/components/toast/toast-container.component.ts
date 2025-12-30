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
          class="flex items-start gap-3 p-4 rounded-lg shadow-lg pointer-events-auto transition-all duration-300"
          [class.opacity-0]="!toast.visible"
          [class.translate-x-full]="!toast.visible"
          [class.opacity-100]="toast.visible"
          [class.translate-x-0]="toast.visible"
          [class.bg-success-50]="toast.type === 'success'"
          [class.border-l-4]="true"
          [class.border-success-500]="toast.type === 'success'"
          [class.bg-danger-50]="toast.type === 'error'"
          [class.border-danger-500]="toast.type === 'error'"
          [class.bg-warning-50]="toast.type === 'warning'"
          [class.border-warning-500]="toast.type === 'warning'"
          [class.bg-primary-50]="toast.type === 'info'"
          [class.border-primary-500]="toast.type === 'info'"
          role="alert">
          <!-- Icon -->
          <span class="material-icons text-xl flex-shrink-0 mt-0.5"
            [class.text-success-600]="toast.type === 'success'"
            [class.text-danger-600]="toast.type === 'error'"
            [class.text-warning-600]="toast.type === 'warning'"
            [class.text-primary-600]="toast.type === 'info'">
            {{ getIcon(toast.type) }}
          </span>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium"
              [class.text-success-800]="toast.type === 'success'"
              [class.text-danger-800]="toast.type === 'error'"
              [class.text-warning-800]="toast.type === 'warning'"
              [class.text-primary-800]="toast.type === 'info'">
              {{ toast.message }}
            </p>
            @if (toast.action) {
              <button
                type="button"
                class="mt-1 text-sm font-medium underline"
                [class.text-success-700]="toast.type === 'success'"
                [class.text-danger-700]="toast.type === 'error'"
                [class.text-warning-700]="toast.type === 'warning'"
                [class.text-primary-700]="toast.type === 'info'"
                (click)="onAction(toast)">
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Dismiss button -->
          @if (toast.dismissible) {
            <button
              type="button"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
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

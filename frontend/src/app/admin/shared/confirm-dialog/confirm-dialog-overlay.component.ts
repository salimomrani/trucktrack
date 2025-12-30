import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

/**
 * Global confirmation dialog overlay component.
 * Should be placed once in app.component.html.
 * Feature: 020-tailwind-migration
 */
@Component({
  selector: 'app-confirm-dialog-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dialogService.isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        (click)="dialogService.cancel()">
        <!-- Dialog -->
        <div
          class="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200"
          (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">{{ dialogService.data()?.title }}</h2>
          </div>

          <!-- Content -->
          <div class="px-6 py-4">
            <p class="text-sm text-gray-600">{{ dialogService.data()?.message }}</p>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              (click)="dialogService.cancel()">
              {{ dialogService.data()?.cancelText || 'Cancel' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              [class]="dialogService.getConfirmButtonClass()"
              (click)="dialogService.confirm()">
              {{ dialogService.data()?.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogOverlayComponent {
  readonly dialogService = inject(ConfirmDialogService);
}

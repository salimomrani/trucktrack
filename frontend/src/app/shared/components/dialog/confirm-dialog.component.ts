import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from './dialog-ref';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'warning';
}

/**
 * Confirm Dialog Component - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A reusable confirmation dialog with customizable title, message, and buttons.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          [class.bg-primary-100]="data.confirmColor === 'primary'"
          [class.bg-danger-100]="data.confirmColor === 'danger'"
          [class.bg-warning-100]="data.confirmColor === 'warning'">
          <span class="material-icons text-xl"
            [class.text-primary-600]="data.confirmColor === 'primary'"
            [class.text-danger-600]="data.confirmColor === 'danger'"
            [class.text-warning-600]="data.confirmColor === 'warning'">
            {{ getIcon() }}
          </span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ data.title }}</h3>
          <p class="mt-2 text-sm text-gray-600">{{ data.message }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          (click)="onCancel()">
          {{ data.cancelText }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
          [class.bg-primary-600]="data.confirmColor === 'primary'"
          [class.hover:bg-primary-700]="data.confirmColor === 'primary'"
          [class.bg-danger-500]="data.confirmColor === 'danger'"
          [class.hover:bg-danger-600]="data.confirmColor === 'danger'"
          [class.bg-warning-500]="data.confirmColor === 'warning'"
          [class.hover:bg-warning-600]="data.confirmColor === 'warning'"
          (click)="onConfirm()">
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  readonly data: ConfirmDialogData = inject(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef);

  constructor() {
    // Set defaults
    this.data.title = this.data.title || 'Confirm';
    this.data.confirmText = this.data.confirmText || 'Confirm';
    this.data.cancelText = this.data.cancelText || 'Cancel';
    this.data.confirmColor = this.data.confirmColor || 'primary';
  }

  getIcon(): string {
    switch (this.data.confirmColor) {
      case 'danger': return 'warning';
      case 'warning': return 'help_outline';
      default: return 'help_outline';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn' | 'danger';
}

/**
 * Reusable confirmation dialog component.
 * Feature: 002-admin-panel
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
    selector: 'app-confirm-dialog',
    imports: [MatDialogModule],
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  get confirmButtonClass(): string {
    switch (this.data.confirmColor) {
      case 'warn':
      case 'danger':
        return 'bg-danger-500 hover:bg-danger-600';
      case 'accent':
        return 'bg-info-500 hover:bg-info-600';
      default:
        return 'bg-primary-600 hover:bg-primary-700';
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}

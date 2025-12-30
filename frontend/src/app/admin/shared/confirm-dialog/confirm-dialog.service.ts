import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn' | 'danger';
}

/**
 * Service for showing confirmation dialogs.
 * Replaces MatDialog for simple confirm/cancel flows.
 * Feature: 020-tailwind-migration
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  // Dialog state
  readonly isOpen = signal(false);
  readonly data = signal<ConfirmDialogData | null>(null);

  // Result subject
  private resultSubject = new Subject<boolean>();

  /**
   * Open a confirmation dialog.
   * Returns an Observable that emits true if confirmed, false if cancelled.
   */
  open(data: ConfirmDialogData): Observable<boolean> {
    this.data.set(data);
    this.isOpen.set(true);

    // Create a new subject for this dialog instance
    this.resultSubject = new Subject<boolean>();

    return this.resultSubject.asObservable().pipe(take(1));
  }

  /**
   * Close dialog with result.
   */
  close(result: boolean): void {
    this.isOpen.set(false);
    this.resultSubject.next(result);
    this.resultSubject.complete();
  }

  /**
   * Confirm and close dialog.
   */
  confirm(): void {
    this.close(true);
  }

  /**
   * Cancel and close dialog.
   */
  cancel(): void {
    this.close(false);
  }

  /**
   * Get confirm button CSS class based on color.
   */
  getConfirmButtonClass(): string {
    const color = this.data()?.confirmColor;
    switch (color) {
      case 'warn':
      case 'danger':
        return 'bg-danger-500 hover:bg-danger-600';
      case 'accent':
        return 'bg-info-500 hover:bg-info-600';
      default:
        return 'bg-primary-600 hover:bg-primary-700';
    }
  }
}

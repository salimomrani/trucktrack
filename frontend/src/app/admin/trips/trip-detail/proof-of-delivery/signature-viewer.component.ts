import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

/**
 * Signature Viewer Dialog Component.
 * Feature: 015-proof-of-delivery (T045)
 * Migrated to Tailwind CSS (Feature 020)
 *
 * Displays enlarged signature with metadata.
 */
@Component({
  selector: 'app-signature-viewer',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="min-w-[400px] max-w-[800px]">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-medium text-gray-800">Signature</h2>
        <button
          type="button"
          class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          (click)="close()">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="p-6 bg-gray-100 flex justify-center">
        <img [src]="data.signatureImage" alt="Signature" class="max-w-full max-h-[400px] bg-white border border-gray-200 rounded-lg">
      </div>

      @if (data.signerName) {
        <div class="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border-t border-gray-100">
          <span class="material-icons text-lg text-gray-400">person</span>
          <span>Signed by: {{ data.signerName }}</span>
        </div>
      }

      @if (data.capturedAt) {
        <div class="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border-t border-gray-100">
          <span class="material-icons text-lg text-gray-400">schedule</span>
          <span>Captured: {{ formatDate(data.capturedAt) }}</span>
        </div>
      }
    </div>
  `
})
export class SignatureViewerComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      signatureImage: string;
      signerName?: string;
      capturedAt?: string;
    },
    private dialogRef: MatDialogRef<SignatureViewerComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

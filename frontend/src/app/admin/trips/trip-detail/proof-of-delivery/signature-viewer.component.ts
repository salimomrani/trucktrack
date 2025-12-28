import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Signature Viewer Dialog Component.
 * Feature: 015-proof-of-delivery (T045)
 *
 * Displays enlarged signature with metadata.
 */
@Component({
  selector: 'app-signature-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="signature-viewer">
      <div class="header">
        <h2>Signature</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="signature-content">
        <img [src]="data.signatureImage" alt="Signature" class="signature-full">
      </div>

      @if (data.signerName) {
        <div class="signer-info">
          <mat-icon>person</mat-icon>
          <span>Signed by: {{ data.signerName }}</span>
        </div>
      }

      @if (data.capturedAt) {
        <div class="capture-info">
          <mat-icon>schedule</mat-icon>
          <span>Captured: {{ formatDate(data.capturedAt) }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .signature-viewer {
      min-width: 400px;
      max-width: 800px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    .signature-content {
      padding: 24px;
      display: flex;
      justify-content: center;
      background: #f5f5f5;
    }

    .signature-full {
      max-width: 100%;
      max-height: 400px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .signer-info,
    .capture-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #f0f0f0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #999;
      }
    }
  `]
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

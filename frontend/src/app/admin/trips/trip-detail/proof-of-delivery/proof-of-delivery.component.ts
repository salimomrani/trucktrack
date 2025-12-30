import { Component, input, output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProofOfDeliveryService, ProofResponse } from '../../../trips/proof-of-delivery.service';
import { SignatureViewerComponent } from './signature-viewer.component';

/**
 * Proof of Delivery display component.
 * Feature: 015-proof-of-delivery (T042, T043, T044, T046, T048)
 * Migrated to Tailwind CSS (Feature 020)
 *
 * Displays signature, photos, and POD metadata.
 * Allows PDF download.
 */
@Component({
  selector: 'app-proof-of-delivery',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './proof-of-delivery.component.html',
  styleUrls: ['./proof-of-delivery.component.scss']
})
export class ProofOfDeliveryComponent implements OnChanges {
  readonly tripId = input.required<string>();
  readonly hasProof = input(false);
  readonly proofLoaded = output<ProofResponse>();

  private readonly proofService = inject(ProofOfDeliveryService);
  private readonly dialog = inject(MatDialog);

  proof = signal<ProofResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  downloadingPdf = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId'] || changes['hasProof']) {
      if (this.tripId() && this.hasProof()) {
        this.loadProof();
      }
    }
  }

  loadProof(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proofService.getProofByTripId(this.tripId()).subscribe({
      next: (proof) => {
        this.proof.set(proof);
        this.proofLoaded.emit(proof);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load proof:', err);
        this.error.set('Failed to load proof of delivery');
        this.loading.set(false);
      }
    });
  }

  openSignatureViewer(): void {
    const proof = this.proof();
    if (!proof) return;

    this.dialog.open(SignatureViewerComponent, {
      data: {
        signatureImage: proof.signatureImage,
        signerName: proof.signerName,
        capturedAt: proof.capturedAt
      },
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  downloadPdf(): void {
    const proof = this.proof();
    if (!proof) return;

    this.downloadingPdf.set(true);

    this.proofService.downloadPdf(proof.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pod-${this.tripId()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdf.set(false);
      },
      error: (err) => {
        console.error('Failed to download PDF:', err);
        this.error.set('Failed to download PDF');
        this.downloadingPdf.set(false);
      }
    });
  }

  getStatusColor(): string {
    const proof = this.proof();
    if (!proof) return '#9e9e9e';
    return proof.status === 'SIGNED' ? '#28a745' : '#dc3545';
  }

  getStatusIcon(): string {
    const proof = this.proof();
    if (!proof) return 'help_outline';
    return proof.status === 'SIGNED' ? 'check_circle' : 'cancel';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
}

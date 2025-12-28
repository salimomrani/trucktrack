import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Proof of Delivery Response DTO.
 * Feature: 015-proof-of-delivery
 */
export interface ProofResponse {
  id: string;
  tripId: string;
  status: 'SIGNED' | 'REFUSED';
  statusDisplayName: string;
  signatureImage: string;
  signerName: string | null;
  refusalReason: string | null;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  integrityHash: string;
  capturedAt: string;
  syncedAt: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  photoCount: number;
  photos: ProofPhoto[] | null;
}

export interface ProofPhoto {
  id: string;
  proofId: string;
  photoImage: string;
  displayOrder: number;
  latitude: number;
  longitude: number;
  capturedAt: string;
  createdAt: string;
}

export interface ProofStats {
  totalProofs: number;
  signedCount: number;
  refusedCount: number;
  signedPercentage: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Service for Proof of Delivery operations.
 * Feature: 015-proof-of-delivery
 */
@Injectable({
  providedIn: 'root'
})
export class ProofOfDeliveryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/location/v1';

  /**
   * Get proof by trip ID.
   */
  getProofByTripId(tripId: string): Observable<ProofResponse> {
    return this.http.get<ProofResponse>(`${this.baseUrl}/trips/${tripId}/proof`);
  }

  /**
   * Check if a trip has a proof.
   */
  hasProof(tripId: string): Observable<{ hasProof: boolean }> {
    return this.http.get<{ hasProof: boolean }>(`${this.baseUrl}/trips/${tripId}/proof/exists`);
  }

  /**
   * Get all proofs with filters (admin).
   */
  getProofs(
    page = 0,
    size = 20,
    status?: 'SIGNED' | 'REFUSED',
    createdBy?: string,
    startDate?: string,
    endDate?: string
  ): Observable<PageResponse<ProofResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (createdBy) params = params.set('createdBy', createdBy);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PageResponse<ProofResponse>>(`${this.baseUrl}/admin/proofs`, { params });
  }

  /**
   * Get proof by ID (admin).
   */
  getProofById(proofId: string): Observable<ProofResponse> {
    return this.http.get<ProofResponse>(`${this.baseUrl}/admin/proofs/${proofId}`);
  }

  /**
   * Get proof statistics (admin).
   */
  getStats(startDate?: string, endDate?: string): Observable<ProofStats> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ProofStats>(`${this.baseUrl}/admin/proofs/stats`, { params });
  }

  /**
   * Download PDF for a proof (T041, T048).
   */
  downloadPdf(proofId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/proofs/${proofId}/pdf`, {
      responseType: 'blob'
    });
  }
}

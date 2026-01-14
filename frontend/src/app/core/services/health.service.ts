import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Health status for individual services
 */
export interface ServiceHealth {
  name: string;
  displayName: string;
  status: 'UP' | 'DOWN';
  responseTimeMs: number | null;
  error: string | null;
  critical: boolean;
}

/**
 * Aggregated health response from the API Gateway
 */
export interface HealthAggregate {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  services: ServiceHealth[];
}

/**
 * HealthService - Pure HTTP Service for health check API calls
 *
 * This service is a pure HTTP service that ONLY makes API calls and returns responses.
 * Used exclusively by NgRx Effects - components should NOT use this service directly
 */
@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  /**
   * Get aggregated health status from all backend services
   * Pure HTTP call - returns Observable<HealthAggregate>
   */
  getHealthStatus(): Observable<HealthAggregate> {
    return this.http.get<HealthAggregate>(`${this.API_URL}/health/aggregate`).pipe(
      catchError(error => {
        console.error('Health check failed:', error);
        return throwError(() => error);
      })
    );
  }
}

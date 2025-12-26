import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TripResponse,
  TripStatusHistoryResponse,
  CreateTripRequest,
  UpdateTripRequest,
  AssignTripRequest,
  PageResponse,
  TripStatus,
  TripAnalytics
} from './trip.model';

/**
 * Service for admin trip management API calls.
 * T044: Create TripService
 * Feature: 010-trip-management (US4: Dashboard Monitoring)
 */
@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/trips`;

  /**
   * Get paginated list of trips with filters.
   * T053: Added date range filter parameters
   */
  getTrips(
    page = 0,
    size = 25,
    search?: string,
    status?: TripStatus,
    driverId?: string,
    truckId?: string,
    startDate?: string,
    endDate?: string,
    sortBy = 'createdAt',
    sortDir = 'desc'
  ): Observable<PageResponse<TripResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (driverId) {
      params = params.set('driverId', driverId);
    }
    if (truckId) {
      params = params.set('truckId', truckId);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<PageResponse<TripResponse>>(this.baseUrl, { params });
  }

  /**
   * Get trip by ID.
   */
  getTripById(id: string): Observable<TripResponse> {
    return this.http.get<TripResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new trip.
   */
  createTrip(request: CreateTripRequest): Observable<TripResponse> {
    return this.http.post<TripResponse>(this.baseUrl, request);
  }

  /**
   * Update an existing trip.
   */
  updateTrip(id: string, request: UpdateTripRequest): Observable<TripResponse> {
    return this.http.put<TripResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Assign a trip to a truck and driver.
   */
  assignTrip(id: string, request: AssignTripRequest): Observable<TripResponse> {
    return this.http.post<TripResponse>(`${this.baseUrl}/${id}/assign`, request);
  }

  /**
   * Cancel a trip.
   */
  cancelTrip(id: string, reason?: string): Observable<TripResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.post<TripResponse>(`${this.baseUrl}/${id}/cancel`, {}, { params });
  }

  /**
   * Reassign a trip to a different truck and driver.
   * T067: Add reassign functionality
   */
  reassignTrip(id: string, request: AssignTripRequest): Observable<TripResponse> {
    return this.http.post<TripResponse>(`${this.baseUrl}/${id}/reassign`, request);
  }

  /**
   * Get trip status history.
   */
  getTripHistory(id: string): Observable<TripStatusHistoryResponse[]> {
    return this.http.get<TripStatusHistoryResponse[]>(`${this.baseUrl}/${id}/history`);
  }

  /**
   * Get pending trips (for quick assignment).
   */
  getPendingTrips(): Observable<TripResponse[]> {
    return this.http.get<TripResponse[]>(`${this.baseUrl}/pending`);
  }

  /**
   * Get active trips (ASSIGNED or IN_PROGRESS).
   */
  getActiveTrips(page = 0, size = 50): Observable<PageResponse<TripResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<TripResponse>>(`${this.baseUrl}/active`, { params });
  }

  /**
   * Get trip statistics.
   */
  getTripStats(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.baseUrl}/stats`);
  }

  /**
   * Get detailed trip analytics.
   * T054: Analytics endpoint with KPIs
   */
  getAnalytics(): Observable<TripAnalytics> {
    return this.http.get<TripAnalytics>(`${this.baseUrl}/analytics`);
  }
}

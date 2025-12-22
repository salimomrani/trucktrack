import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TruckAdminResponse,
  CreateTruckRequest,
  UpdateTruckRequest,
  PageResponse,
  TruckStatus
} from './truck.model';

/**
 * Service for admin truck management API calls.
 * T068: Create TruckAdminService
 * Feature: 002-admin-panel
 */
@Injectable({
  providedIn: 'root'
})
export class TruckAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/trucks`;

  /**
   * Get paginated list of trucks.
   */
  getTrucks(
    page = 0,
    size = 25,
    search?: string,
    status?: TruckStatus,
    groupId?: string,
    sortBy = 'createdAt',
    sortDir = 'desc'
  ): Observable<PageResponse<TruckAdminResponse>> {
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
    if (groupId) {
      params = params.set('groupId', groupId);
    }

    return this.http.get<PageResponse<TruckAdminResponse>>(this.baseUrl, { params });
  }

  /**
   * Get truck by ID.
   */
  getTruckById(id: string): Observable<TruckAdminResponse> {
    return this.http.get<TruckAdminResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new truck.
   */
  createTruck(request: CreateTruckRequest): Observable<TruckAdminResponse> {
    return this.http.post<TruckAdminResponse>(this.baseUrl, request);
  }

  /**
   * Update an existing truck.
   */
  updateTruck(id: string, request: UpdateTruckRequest): Observable<TruckAdminResponse> {
    return this.http.put<TruckAdminResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Mark truck as out of service.
   */
  markOutOfService(id: string): Observable<TruckAdminResponse> {
    return this.http.post<TruckAdminResponse>(`${this.baseUrl}/${id}/out-of-service`, {});
  }

  /**
   * Activate a truck.
   */
  activateTruck(id: string): Observable<TruckAdminResponse> {
    return this.http.post<TruckAdminResponse>(`${this.baseUrl}/${id}/activate`, {});
  }

  /**
   * Get groups assigned to a truck.
   */
  getTruckGroups(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${id}/groups`);
  }

  /**
   * Update groups assigned to a truck.
   */
  updateTruckGroups(id: string, groupIds: string[]): Observable<string[]> {
    return this.http.put<string[]>(`${this.baseUrl}/${id}/groups`, groupIds);
  }
}

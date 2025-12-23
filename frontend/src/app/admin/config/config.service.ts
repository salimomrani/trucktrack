import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Configuration DTOs matching backend
 */
export interface ConfigResponse {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  valueType: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateConfigRequest {
  value: string;
  version: number;
  reason?: string;
}

export interface ConfigHistoryResponse {
  id: number;
  configKey: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

/**
 * Service for system configuration management.
 * Feature: 002-admin-panel (US4)
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/config`;

  /**
   * Get all configurations
   */
  getAllConfig(category?: string): Observable<ConfigResponse[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<ConfigResponse[]>(this.baseUrl, { params });
  }

  /**
   * Get single configuration by key
   */
  getConfig(key: string): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.baseUrl}/${key}`);
  }

  /**
   * Update configuration value
   */
  updateConfig(key: string, request: UpdateConfigRequest): Observable<ConfigResponse> {
    return this.http.put<ConfigResponse>(`${this.baseUrl}/${key}`, request);
  }

  /**
   * Get configuration change history
   */
  getConfigHistory(key: string): Observable<ConfigHistoryResponse[]> {
    return this.http.get<ConfigHistoryResponse[]>(`${this.baseUrl}/${key}/history`);
  }

  /**
   * Get recent configuration changes
   */
  getRecentChanges(): Observable<ConfigHistoryResponse[]> {
    return this.http.get<ConfigHistoryResponse[]>(`${this.baseUrl}/recent-changes`);
  }
}

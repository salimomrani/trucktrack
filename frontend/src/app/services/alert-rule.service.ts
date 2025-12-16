import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AlertRule,
  AlertRuleType,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest
} from '../models/alert-rule.model';

/**
 * Service for alert rule HTTP operations
 * T157: Create AlertRuleService (HTTP client for alert rule CRUD)
 */
@Injectable({
  providedIn: 'root'
})
export class AlertRuleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notification/v1/alert-rules`;

  /**
   * Get all alert rules with optional filters
   */
  getAllAlertRules(type?: AlertRuleType, enabled?: boolean): Observable<AlertRule[]> {
    let params = new HttpParams();

    if (type) {
      params = params.set('type', type);
    }
    if (enabled !== undefined) {
      params = params.set('enabled', enabled.toString());
    }

    return this.http.get<AlertRule[]>(this.baseUrl, { params });
  }

  /**
   * Get enabled alert rules
   */
  getEnabledAlertRules(): Observable<AlertRule[]> {
    return this.getAllAlertRules(undefined, true);
  }

  /**
   * Get alert rule by ID
   */
  getAlertRuleById(id: string): Observable<AlertRule> {
    return this.http.get<AlertRule>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get current user's alert rules
   */
  getMyAlertRules(): Observable<AlertRule[]> {
    return this.http.get<AlertRule[]>(`${this.baseUrl}/my-rules`);
  }

  /**
   * Create a new alert rule
   */
  createAlertRule(request: CreateAlertRuleRequest): Observable<AlertRule> {
    return this.http.post<AlertRule>(this.baseUrl, request);
  }

  /**
   * Update an alert rule
   */
  updateAlertRule(id: string, request: UpdateAlertRuleRequest): Observable<AlertRule> {
    return this.http.put<AlertRule>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Enable or disable an alert rule
   */
  setEnabled(id: string, enabled: boolean): Observable<AlertRule> {
    const params = new HttpParams().set('enabled', enabled.toString());
    return this.http.patch<AlertRule>(`${this.baseUrl}/${id}/enabled`, null, { params });
  }

  /**
   * Delete an alert rule
   */
  deleteAlertRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

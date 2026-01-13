import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DashboardData,
  DashboardKpi,
  FleetStatus,
  ActivityEvent,
  PerformanceMetrics
} from '../store/dashboard/dashboard.state';

/**
 * T014: Dashboard API service for HTTP operations.
 * Feature: 022-dashboard-real-data
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/location/v1/admin/dashboard`;

  /**
   * Get all dashboard data in a single API call.
   */
  getDashboardData(performancePeriod: 'week' | 'month' = 'week'): Observable<DashboardData> {
    const params = new HttpParams().set('performancePeriod', performancePeriod);
    return this.http.get<DashboardData>(this.baseUrl, { params });
  }

  /**
   * Get KPIs only.
   */
  getKpis(): Observable<DashboardKpi> {
    return this.http.get<DashboardKpi>(`${this.baseUrl}/kpis`);
  }

  /**
   * Get fleet status breakdown.
   */
  getFleetStatus(): Observable<FleetStatus> {
    return this.http.get<FleetStatus>(`${this.baseUrl}/fleet-status`);
  }

  /**
   * Get recent activity feed.
   */
  getActivity(limit: number = 5): Observable<ActivityEvent[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ActivityEvent[]>(`${this.baseUrl}/activity`, { params });
  }

  /**
   * Get performance metrics.
   */
  getPerformance(period: 'week' | 'month' = 'week'): Observable<PerformanceMetrics> {
    const params = new HttpParams().set('period', period);
    return this.http.get<PerformanceMetrics>(`${this.baseUrl}/performance`, { params });
  }
}

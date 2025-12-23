import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FleetKPI,
  DailyMetrics,
  AlertBreakdown,
  TruckRanking,
  PeriodType,
  EntityType,
  RankingMetric,
  AnalyticsFilter
} from '../../../core/models/analytics.model';
import { environment } from '../../../../environments/environment';

/**
 * Service for fleet analytics API calls.
 * Feature: 006-fleet-analytics
 * T017: Create analytics.service.ts with getFleetKPIs() method
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/analytics`;

  /**
   * Get fleet KPIs for the specified period and entity.
   */
  getFleetKPIs(filter: AnalyticsFilter): Observable<FleetKPI> {
    const params = this.buildParams(filter);
    return this.http.get<FleetKPI>(`${this.baseUrl}/kpis`, { params });
  }

  /**
   * Get daily metrics for charts.
   */
  getDailyMetrics(filter: AnalyticsFilter): Observable<DailyMetrics> {
    const params = this.buildParams(filter);
    return this.http.get<DailyMetrics>(`${this.baseUrl}/daily-metrics`, { params });
  }

  /**
   * Get alert breakdown by type.
   */
  getAlertBreakdown(filter: AnalyticsFilter): Observable<AlertBreakdown> {
    const params = this.buildParams(filter);
    return this.http.get<AlertBreakdown>(`${this.baseUrl}/alert-breakdown`, { params });
  }

  /**
   * Get truck ranking by metric.
   */
  getTruckRanking(filter: AnalyticsFilter, metric: RankingMetric, limit: number = 10): Observable<TruckRanking> {
    let params = this.buildParams(filter);
    params = params.set('metric', metric);
    params = params.set('limit', limit.toString());
    return this.http.get<TruckRanking>(`${this.baseUrl}/truck-ranking`, { params });
  }

  /**
   * Get accessible trucks for entity filter.
   */
  getAccessibleTrucks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/trucks`);
  }

  /**
   * Get accessible groups for entity filter.
   */
  getAccessibleGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/groups`);
  }

  /**
   * Build HTTP params from filter.
   */
  private buildParams(filter: AnalyticsFilter): HttpParams {
    let params = new HttpParams()
      .set('period', filter.periodType)
      .set('entityType', filter.entityType);

    if (filter.periodType === 'CUSTOM' && filter.customStartDate && filter.customEndDate) {
      params = params.set('startDate', filter.customStartDate);
      params = params.set('endDate', filter.customEndDate);
    }

    if (filter.entityType !== 'FLEET' && filter.entityId) {
      params = params.set('entityId', filter.entityId);
    }

    return params;
  }
}

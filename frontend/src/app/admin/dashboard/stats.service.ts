import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Statistics DTOs matching backend
 */
export interface TruckStatusStats {
  active: number;
  idle: number;
  offline: number;
  outOfService: number;
  total: number;
}

export interface TruckMileage {
  truckId: string;
  licensePlate: string;
  kilometers: number;
}

export interface MileageStats {
  totalKilometers: number;
  averagePerTruck: number;
  topTrucks: TruckMileage[];
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface DashboardStats {
  trucks: TruckStatusStats;
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  alerts: AlertStats;
  mileage: MileageStats;
  generatedAt: string;
  period: string;
}

/**
 * Service for fetching dashboard statistics.
 * Feature: 002-admin-panel (US3)
 */
@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/stats`;

  /**
   * Get full dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`);
  }

  /**
   * Get truck status breakdown
   */
  getTruckStats(): Observable<TruckStatusStats> {
    return this.http.get<TruckStatusStats>(`${this.baseUrl}/trucks`);
  }

  /**
   * Get mileage statistics
   */
  getMileageStats(): Observable<MileageStats> {
    return this.http.get<MileageStats>(`${this.baseUrl}/mileage`);
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): Observable<AlertStats> {
    return this.http.get<AlertStats>(`${this.baseUrl}/alerts`);
  }
}

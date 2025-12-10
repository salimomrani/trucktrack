import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Truck, TruckListResponse, TruckStatus } from '../models/truck.model';
import { GPSPosition } from '../models/gps-position.model';

/**
 * Service for truck-related HTTP operations
 * T077: Create TruckService (HTTP client for GET /location/v1/trucks)
 */
@Injectable({
  providedIn: 'root'
})
export class TruckService {
  private readonly baseUrl = `${environment.apiUrl}/public/location/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Get all trucks with optional filters
   */
  getTrucks(
    status?: TruckStatus,
    truckGroupId?: string,
    page: number = 0,
    size: number = 100
  ): Observable<TruckListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (truckGroupId) {
      params = params.set('truckGroupId', truckGroupId);
    }

    return this.http.get<TruckListResponse>(`${this.baseUrl}/trucks`, { params });
  }

  /**
   * Get all active trucks (for map display)
   */
  getActiveTrucks(): Observable<TruckListResponse> {
    return this.getTrucks(undefined, undefined, 0, 1000);
  }

  /**
   * Get truck by ID
   */
  getTruckById(truckId: string): Observable<Truck> {
    return this.http.get<Truck>(`${this.baseUrl}/trucks/${truckId}`);
  }

  /**
   * Get truck's current position from cache (fast!)
   */
  getCurrentPosition(truckId: string): Observable<GPSPosition> {
    return this.http.get<GPSPosition>(`${this.baseUrl}/trucks/${truckId}/current-position`);
  }

  /**
   * Search trucks by ID or driver name
   */
  searchTrucks(query: string): Observable<Truck[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Truck[]>(`${this.baseUrl}/trucks/search`, { params });
  }

  /**
   * Get trucks within bounding box (for map viewport)
   */
  getTrucksInBoundingBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): Observable<Truck[]> {
    const params = new HttpParams()
      .set('minLat', minLat.toString())
      .set('maxLat', maxLat.toString())
      .set('minLng', minLng.toString())
      .set('maxLng', maxLng.toString());

    return this.http.get<Truck[]>(`${this.baseUrl}/trucks/bbox`, { params });
  }

  /**
   * Get truck history for a time range
   */
  getTruckHistory(
    truckId: string,
    startTime: string,
    endTime: string
  ): Observable<GPSPosition[]> {
    const params = new HttpParams()
      .set('startTime', startTime)
      .set('endTime', endTime);

    return this.http.get<GPSPosition[]>(
      `${this.baseUrl}/trucks/${truckId}/history`,
      { params }
    );
  }
}

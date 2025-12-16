import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Geofence, GeofenceCheckResult, PointCheckResult, GeofenceZoneType } from '../models/geofence.model';
import { environment } from '../../environments/environment';

/**
 * Service for managing geofences
 * T154: Frontend geofence drawing UI
 */
@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/location/v1/geofences`;

  /**
   * Get all active geofences
   */
  getAllGeofences(): Observable<Geofence[]> {
    return this.http.get<Geofence[]>(this.baseUrl);
  }

  /**
   * Get a geofence by ID
   */
  getGeofence(id: string): Observable<Geofence> {
    return this.http.get<Geofence>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get geofences by zone type
   */
  getGeofencesByType(zoneType: GeofenceZoneType): Observable<Geofence[]> {
    return this.http.get<Geofence[]>(`${this.baseUrl}/type/${zoneType}`);
  }

  /**
   * Create a new geofence
   */
  createGeofence(geofence: Geofence): Observable<Geofence> {
    return this.http.post<Geofence>(this.baseUrl, geofence);
  }

  /**
   * Update an existing geofence
   */
  updateGeofence(id: string, geofence: Geofence): Observable<Geofence> {
    return this.http.put<Geofence>(`${this.baseUrl}/${id}`, geofence);
  }

  /**
   * Delete a geofence
   */
  deleteGeofence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get geofences in map bounding box
   */
  getGeofencesInBounds(minLon: number, minLat: number, maxLon: number, maxLat: number): Observable<Geofence[]> {
    const params = new HttpParams()
      .set('minLon', minLon.toString())
      .set('minLat', minLat.toString())
      .set('maxLon', maxLon.toString())
      .set('maxLat', maxLat.toString());

    return this.http.get<Geofence[]>(`${this.baseUrl}/bounds`, { params });
  }

  /**
   * Check if a point is inside any geofence
   */
  checkPointInGeofences(lat: number, lon: number): Observable<GeofenceCheckResult> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this.http.get<GeofenceCheckResult>(`${this.baseUrl}/check`, { params });
  }

  /**
   * Check if a point is inside a specific geofence
   */
  checkPointInGeofence(id: string, lat: number, lon: number): Observable<PointCheckResult> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this.http.get<PointCheckResult>(`${this.baseUrl}/${id}/check`, { params });
  }

  /**
   * Search geofences by name
   */
  searchGeofences(name: string, page = 0, size = 20): Observable<{ content: Geofence[] }> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<{ content: Geofence[] }>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Get user's geofences
   */
  getMyGeofences(page = 0, size = 20): Observable<{ content: Geofence[] }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<{ content: Geofence[] }>(`${this.baseUrl}/my`, { params });
  }

  /**
   * Find restricted zones near a point
   */
  findRestrictedZonesNearby(lat: number, lon: number, distance = 1000): Observable<Geofence[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('distance', distance.toString());

    return this.http.get<Geofence[]>(`${this.baseUrl}/restricted/nearby`, { params });
  }
}

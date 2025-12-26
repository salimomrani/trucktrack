import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

/**
 * Geocoding result from Nominatim API.
 */
export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
}

/**
 * Raw response from Nominatim API.
 */
interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    city?: string;
    country?: string;
  };
}

interface NominatimReverseResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Service for geocoding using OpenStreetMap Nominatim API.
 * Free, no API key required.
 *
 * Usage limits: max 1 request per second (handled by debounce in consumers)
 * https://operations.osmfoundation.org/policies/nominatim/
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  /**
   * Search for addresses matching a query.
   * Returns up to 5 results.
   *
   * @param query Search query (address, place name, etc.)
   * @param countryCode Optional country code to limit results (e.g., 'fr', 'us')
   */
  searchAddress(query: string, countryCode?: string): Observable<GeocodingResult[]> {
    if (!query || query.trim().length < 3) {
      return of([]);
    }

    const params: Record<string, string> = {
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '5',
    };

    if (countryCode) {
      params['countrycodes'] = countryCode;
    }

    return this.http.get<NominatimSearchResult[]>(
      `${this.NOMINATIM_URL}/search`,
      { params }
    ).pipe(
      map(results => results.map(this.mapSearchResult)),
      catchError(error => {
        console.error('Geocoding search error:', error);
        return of([]);
      })
    );
  }

  /**
   * Reverse geocode coordinates to get address.
   *
   * @param lat Latitude
   * @param lng Longitude
   */
  reverseGeocode(lat: number, lng: number): Observable<GeocodingResult | null> {
    const params = {
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    };

    return this.http.get<NominatimReverseResult>(
      `${this.NOMINATIM_URL}/reverse`,
      { params }
    ).pipe(
      map(result => {
        if (!result || !result.display_name) {
          return null;
        }
        return {
          displayName: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          type: 'reverse',
          importance: 1
        };
      }),
      catchError(error => {
        console.error('Reverse geocoding error:', error);
        return of(null);
      })
    );
  }

  /**
   * Create a search operator that can be used with form controls.
   * Includes debounce and distinctUntilChanged.
   *
   * @param countryCode Optional country code to limit results
   */
  createSearchOperator(countryCode?: string) {
    return (source: Observable<string>) => source.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchAddress(query, countryCode))
    );
  }

  private mapSearchResult(result: NominatimSearchResult): GeocodingResult {
    return {
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      type: result.type,
      importance: result.importance
    };
  }
}

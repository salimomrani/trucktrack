import { Injectable } from '@angular/core';

/**
 * TokenStorageService - Manages JWT tokens in localStorage
 *
 * This service provides a centralized way to manage tokens:
 * - Storing and retrieving access/refresh tokens
 * - Token validation and expiry checking
 * - Clearing tokens on logout
 *
 * Token expiry is managed by the backend via JWT claims (exp field).
 * Used by NgRx Effects and HTTP Interceptor
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly TOKEN_KEY = 'truck_track_token';
  private readonly REFRESH_TOKEN_KEY = 'truck_track_refresh_token';

  /**
   * Get current access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set access token in localStorage
   */
  setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get current refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set refresh token in localStorage
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload) {
        return true;
      }

      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      return currentTime >= expiryTime;
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT token to get payload
   */
  private decodeToken(token: string): { exp: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }
}

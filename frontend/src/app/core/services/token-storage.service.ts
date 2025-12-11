import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * TokenStorageService - Manages JWT tokens in localStorage
 *
 * This service provides a centralized way to manage tokens:
 * - Storing and retrieving access/refresh tokens
 * - Token validation and expiry checking
 * - Clearing tokens on logout
 *
 * Used by NgRx Effects and HTTP Interceptor
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.auth.refreshTokenKey;

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

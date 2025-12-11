import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  JwtPayload,
  UserRole
} from '../models/auth.model';

/**
 * AuthService - HTTP Service for authentication API calls and token management
 *
 * This service is a pure HTTP service that:
 * - Makes API calls to the backend
 * - Manages JWT tokens in localStorage
 * - Does NOT manage application state (NgRx Store handles that)
 *
 * Used exclusively by NgRx Effects - components should NOT use this service directly
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.auth.refreshTokenKey;

  /**
   * Login with email and password
   * Returns the login response - NgRx effects handle state updates
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/v1/login`, credentials).pipe(
      tap(response => {
        // Store token in localStorage only
        this.setAccessToken(response.token);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - clear tokens and redirect to login
   * NgRx effects handle state updates
   */
  logout(): void {
    // Clear tokens from storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);

    // Redirect to login
    this.router.navigate(['/login']);
  }

  /**
   * Refresh access token using refresh token
   * Returns new tokens - NgRx effects handle state updates
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/auth/v1/refresh`, request).pipe(
      tap(response => {
        // Store new tokens in localStorage only
        this.setAccessToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Decode JWT token to get payload
   * Used internally to validate token expiry
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * Used for token validation
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return true;
    }

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  }

  /**
   * Set access token in storage
   */
  private setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Set refresh token in storage
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get current authenticated user from backend
   * Used by NgRx effects to fetch user details after login
   */
  getCurrentUserFromBackend(): Observable<User> {
    return this.http.get<{id: string, email: string, role: string}>(`${this.API_URL}/auth/v1/me`).pipe(
      map(response => ({
        id: response.id,
        email: response.email,
        firstName: '',
        lastName: '',
        role: response.role as UserRole,
        isActive: true
      })),
      catchError(error => {
        console.error('Failed to get current user:', error);
        return throwError(() => error);
      })
    );
  }
}

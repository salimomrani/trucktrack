import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  UserProfile,
  ChangePasswordRequest,
  ChangePasswordResponse
} from '../models/auth.model';

/**
 * AuthService - Pure HTTP Service for authentication API calls
 *
 * This service is a pure HTTP service that ONLY makes API calls and returns responses.
 *
 * It does NOT:
 * - Manage application state (NgRx Store handles that)
 * - Manage tokens in localStorage (TokenStorageService + NgRx Effects handle that)
 * - Update any local state
 * - Have side effects (except logging)
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

  /**
   * Login with email and password
   * Pure HTTP call - returns Observable<LoginResponse>
   * NgRx effects handle token storage and state updates
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/v1/login`, credentials).pipe(
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   * Pure HTTP call - returns Observable<RefreshTokenResponse>
   * NgRx effects handle token storage
   */
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/auth/v1/refresh`, request).pipe(
      catchError(error => {
        console.error('Token refresh failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current authenticated user from backend
   * Pure HTTP call - returns Observable<User>
   * Used by NgRx effects to fetch user details after login
   */
  getCurrentUserFromBackend(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/v1/me`).pipe(
      catchError(error => {
        console.error('Failed to get current user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user profile from backend
   * Returns full profile information including firstName, lastName
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/auth/v1/me`).pipe(
      catchError(error => {
        console.error('Failed to get user profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change user password
   * Pure HTTP call - returns Observable<ChangePasswordResponse>
   */
  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.API_URL}/auth/v1/change-password`, request).pipe(
      catchError(error => {
        console.error('Failed to change password:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Navigate to login page
   * Used by logout effect after clearing tokens
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}

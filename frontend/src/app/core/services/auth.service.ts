import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  JwtPayload, UserRole
} from '../models/auth.model';

/**
 * AuthService handles authentication, token management, and user state.
 * Implements JWT-based authentication with refresh token support.
 * Refactored with Angular 17+ best practices: signals, inject(), takeUntilDestroyed()
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly REFRESH_TOKEN_KEY = environment.auth.refreshTokenKey;

  // Current user state using signals
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());
  public currentUser = this.currentUserSignal.asReadonly();

  // Authentication state using signals
  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());
  public isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Backward compatibility: Observable streams from signals
  public currentUser$ = toObservable(this.currentUser);
  public isAuthenticated$ = toObservable(this.isAuthenticated);

  constructor() {
    // Check token expiry on init
    this.checkTokenExpiry();
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/v1/login`, credentials).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - clear tokens and redirect to login
   */
  logout(): void {
    // Clear tokens from storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem('current_user');

    // Update state
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);

    // Redirect to login
    this.router.navigate(['/login']);
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/auth/v1/refresh`, request).pipe(
      tap(response => {
        this.setAccessToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.isAuthenticatedSignal.set(true);
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
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticatedMethod(): boolean {
    return this.isAuthenticated() && this.hasValidToken();
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Decode JWT token to get payload
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
   */
  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return true;
    }

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  }

  /**
   * Check if there's a valid token in storage
   */
  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: LoginResponse): void {
    // Store token
    this.setAccessToken(response.token);

    // Create user object from response
    const user: User = {
      id: '', // Will be extracted from JWT
      email: response.email,
      firstName: '', // Not provided by backend yet
      lastName: '', // Not provided by backend yet
      role: response.role as UserRole,
      isActive: true
    };

    // Extract user ID from JWT token
    const payload = this.decodeToken(response.token);
    if (payload && payload.userId) {
      user.id = payload.userId;
    }

    // Store user data
    localStorage.setItem('current_user', JSON.stringify(user));

    // Update state
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);

    console.log('Authentication successful for user:', response.email);
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
   * Get user from local storage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('current_user');
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Failed to parse user from storage:', error);
      return null;
    }
  }

  /**
   * Check token expiry and refresh if needed
   */
  private checkTokenExpiry(): void {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }

    if (this.isTokenExpired(token)) {
      console.log('Token expired, attempting refresh...');
      this.refreshToken()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => console.log('Token refreshed successfully'),
          error: (error) => console.error('Token refresh failed:', error)
        });
    }
  }
}

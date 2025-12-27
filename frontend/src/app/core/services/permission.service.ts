import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AppState } from '../../store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import {
  Page,
  UserRole,
  UserPermissions,
  PageAccessCheckResponse,
  canAccessPage,
  getAccessiblePages
} from '../models/permission.model';

/**
 * Service for checking user permissions.
 * Feature: 008-rbac-permissions
 * T008: Create permission.service.ts
 *
 * Uses local permission matrix for fast checks,
 * with optional server validation for sensitive operations.
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store<AppState>);
  private readonly baseUrl = `${environment.apiUrl}/auth/v1/permissions`;

  /**
   * Get the current user's role from the store.
   */
  getCurrentUserRole(): Observable<UserRole | null> {
    return this.store.select(selectCurrentUser).pipe(
      map(user => user?.role as UserRole ?? null)
    );
  }

  /**
   * Check if current user can access a page (local check).
   * Uses the permission matrix defined in permission.model.ts.
   */
  canAccessPage(page: Page): Observable<boolean> {
    return this.getCurrentUserRole().pipe(
      map(role => role ? canAccessPage(role, page) : false)
    );
  }

  /**
   * Get all accessible pages for current user (local check).
   */
  getAccessiblePages(): Observable<Page[]> {
    return this.getCurrentUserRole().pipe(
      map(role => role ? getAccessiblePages(role) : [])
    );
  }

  /**
   * Check if current user has a specific role.
   */
  hasRole(role: UserRole): Observable<boolean> {
    return this.getCurrentUserRole().pipe(
      map(currentRole => currentRole === role)
    );
  }

  /**
   * Check if current user has any of the specified roles.
   */
  hasAnyRole(roles: UserRole[]): Observable<boolean> {
    return this.getCurrentUserRole().pipe(
      map(currentRole => currentRole ? roles.includes(currentRole) : false)
    );
  }

  /**
   * Check if current user is admin.
   */
  isAdmin(): Observable<boolean> {
    return this.hasRole(UserRole.ADMIN);
  }

  // ============ Server-side API calls (for sensitive operations) ============

  /**
   * Get full permissions from server.
   * Use for initial load or after permission changes.
   */
  fetchUserPermissions(): Observable<UserPermissions | null> {
    return this.http.get<UserPermissions>(`${this.baseUrl}/me`).pipe(
      catchError(err => {
        console.error('Failed to fetch user permissions:', err);
        return of(null);
      })
    );
  }

  /**
   * Get accessible pages from server.
   */
  fetchAccessiblePages(): Observable<Page[]> {
    return this.http.get<{ pages: string[] }>(`${this.baseUrl}/pages`).pipe(
      map(response => response.pages.map(p => p as Page)),
      catchError(err => {
        console.error('Failed to fetch accessible pages:', err);
        return of([]);
      })
    );
  }

  /**
   * Check page access via server (for audit trail).
   */
  checkPageAccessServer(page: Page): Observable<PageAccessCheckResponse> {
    return this.http.post<PageAccessCheckResponse>(`${this.baseUrl}/check`, { page }).pipe(
      catchError(err => {
        console.error('Failed to check page access:', err);
        return of({ allowed: false, page, reason: 'Server error' });
      })
    );
  }
}

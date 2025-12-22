import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserAdminResponse,
  CreateUserRequest,
  UpdateUserRequest,
  PageResponse,
  UserRole
} from './user.model';

/**
 * Service for admin user management API calls.
 * T041: Create UserService
 * Feature: 002-admin-panel
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  /**
   * Get paginated list of users.
   */
  getUsers(
    page = 0,
    size = 25,
    search?: string,
    role?: UserRole,
    isActive?: boolean,
    sortBy = 'createdAt',
    sortDir = 'desc'
  ): Observable<PageResponse<UserAdminResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (search) {
      params = params.set('search', search);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<PageResponse<UserAdminResponse>>(this.baseUrl, { params });
  }

  /**
   * Get user by ID.
   */
  getUserById(id: string): Observable<UserAdminResponse> {
    return this.http.get<UserAdminResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new user.
   */
  createUser(request: CreateUserRequest): Observable<UserAdminResponse> {
    return this.http.post<UserAdminResponse>(this.baseUrl, request);
  }

  /**
   * Update an existing user.
   */
  updateUser(id: string, request: UpdateUserRequest): Observable<UserAdminResponse> {
    return this.http.put<UserAdminResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Deactivate a user.
   */
  deactivateUser(id: string): Observable<UserAdminResponse> {
    return this.http.post<UserAdminResponse>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  /**
   * Reactivate a user.
   */
  reactivateUser(id: string): Observable<UserAdminResponse> {
    return this.http.post<UserAdminResponse>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  /**
   * Resend activation email.
   */
  resendActivationEmail(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/resend-activation`, {});
  }

  /**
   * Get groups assigned to a user.
   */
  getUserGroups(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${id}/groups`);
  }

  /**
   * Update groups assigned to a user.
   */
  updateUserGroups(id: string, groupIds: string[]): Observable<string[]> {
    return this.http.put<string[]>(`${this.baseUrl}/${id}/groups`, groupIds);
  }
}

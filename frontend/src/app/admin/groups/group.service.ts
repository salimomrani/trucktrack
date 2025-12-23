import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Group DTOs matching backend
 */
export interface GroupDetailResponse {
  id: string;
  name: string;
  description: string;
  truckCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name: string;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Service for group management.
 * Feature: 002-admin-panel (US5)
 */
@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/groups`;

  /**
   * Get paginated list of groups
   */
  getGroups(
    page = 0,
    size = 20,
    search?: string
  ): Observable<PageResponse<GroupDetailResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<GroupDetailResponse>>(this.baseUrl, { params });
  }

  /**
   * Get single group by ID
   */
  getGroupById(id: string): Observable<GroupDetailResponse> {
    return this.http.get<GroupDetailResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new group
   */
  createGroup(request: CreateGroupRequest): Observable<GroupDetailResponse> {
    return this.http.post<GroupDetailResponse>(this.baseUrl, request);
  }

  /**
   * Update an existing group
   */
  updateGroup(id: string, request: UpdateGroupRequest): Observable<GroupDetailResponse> {
    return this.http.put<GroupDetailResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Delete a group
   */
  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

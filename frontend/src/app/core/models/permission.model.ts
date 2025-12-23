/**
 * Permission models for RBAC.
 * Feature: 008-rbac-permissions
 * T004: Create permission.model.ts
 */

/**
 * Available pages in the application.
 */
export enum Page {
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  ANALYTICS = 'ANALYTICS',
  ADMIN = 'ADMIN',
  ALERTS = 'ALERTS',
  PROFILE = 'PROFILE'
}

/**
 * User roles.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  VIEWER = 'VIEWER'
}

/**
 * User permissions response from API.
 */
export interface UserPermissions {
  userId: string;
  role: UserRole;
  accessiblePages: Page[];
  groupIds: string[];
}

/**
 * Page access check request.
 */
export interface PageAccessCheckRequest {
  page: Page;
}

/**
 * Page access check response.
 */
export interface PageAccessCheckResponse {
  allowed: boolean;
  page: Page;
  reason?: string;
}

/**
 * Permission matrix - maps roles to allowed pages.
 * This should match the backend RolePermissions.java
 */
export const ROLE_PERMISSIONS: Record<UserRole, Page[]> = {
  [UserRole.ADMIN]: [Page.DASHBOARD, Page.MAP, Page.ANALYTICS, Page.ADMIN, Page.ALERTS, Page.PROFILE],
  [UserRole.FLEET_MANAGER]: [Page.DASHBOARD, Page.MAP, Page.ANALYTICS, Page.ALERTS, Page.PROFILE],
  [UserRole.DISPATCHER]: [Page.DASHBOARD, Page.MAP, Page.ALERTS, Page.PROFILE],
  [UserRole.DRIVER]: [Page.DASHBOARD, Page.ALERTS, Page.PROFILE],
  [UserRole.VIEWER]: [Page.DASHBOARD, Page.MAP, Page.ALERTS, Page.PROFILE]
};

/**
 * Check if a role can access a specific page.
 */
export function canAccessPage(role: UserRole, page: Page): boolean {
  const allowedPages = ROLE_PERMISSIONS[role];
  return allowedPages?.includes(page) ?? false;
}

/**
 * Get all accessible pages for a role.
 */
export function getAccessiblePages(role: UserRole): Page[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * User admin models and DTOs
 * T042: Create User interface and DTOs
 * Feature: 002-admin-panel
 */

export type UserRole = 'ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'DRIVER' | 'VIEWER';

export interface UserAdminResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  groupIds: string[] | null;
  groupCount: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  groupIds?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  groupIds?: string[];
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

export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'ADMIN', label: 'Administrator', description: 'Full system access' },
  { value: 'FLEET_MANAGER', label: 'Fleet Manager', description: 'Manage assigned groups' },
  { value: 'DISPATCHER', label: 'Dispatcher', description: 'View and manage trucks' },
  { value: 'DRIVER', label: 'Driver', description: 'Mobile app access only' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' }
];

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#f44336',
  FLEET_MANAGER: '#2196f3',
  DISPATCHER: '#ff9800',
  DRIVER: '#4caf50',
  VIEWER: '#9e9e9e'
};

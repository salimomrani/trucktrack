/**
 * Driver Mobile App - API Response Types
 * Based on contracts/mobile-api.yaml
 */

import type {
  DriverProfile,
  DriverStatus,
  Trip,
  Message,
  PushNotification,
  GPSPosition,
} from './entities';

// ==================== Auth ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: DriverProfile;
}

// ==================== Driver ====================

export interface UpdateStatusRequest {
  status: 'AVAILABLE' | 'IN_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';
}

export interface FcmTokenRequest {
  token: string;
  platform: 'IOS' | 'ANDROID';
}

// ==================== GPS ====================

export interface PositionData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  timestamp: string; // ISO date string
}

export interface PositionBatch {
  truckId?: string;
  positions: PositionData[];
}

export interface PositionBatchResponse {
  accepted: number;
  rejected: number;
}

// ==================== Trips ====================

export interface TripListParams {
  date?: string; // YYYY-MM-DD
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// ==================== Messages ====================

export interface MessageListParams {
  page?: number;
  size?: number;
  since?: string; // ISO date string
}

export interface SendMessageRequest {
  content: string;
}

export interface MessagePage {
  content: Message[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ==================== Notifications ====================

export interface NotificationListParams {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export interface NotificationPage {
  content: PushNotification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ==================== Error ====================

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ==================== Generic ====================

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

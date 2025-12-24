// API Configuration and Services
// Connects to TruckTrack Backend via API Gateway

import * as SecureStore from 'expo-secure-store';

// Configuration - Change this to your machine's IP when testing
const API_CONFIG = {
  // For local development, use your machine's local IP
  // Run: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
  BASE_URL: 'http://192.168.1.3:8000',

  // Endpoints
  AUTH: '/auth/v1',
  GPS: '/gps/v1',
  LOCATION: '/location/v1',
};

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  email: string;
  role: string;
  expiresIn: number;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface GPSPosition {
  truckId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  satellites?: number;
  timestamp: string;
}

export interface Truck {
  id: string;
  truckId: string;
  driverName: string;
  status: string;
  currentLatitude: number;
  currentLongitude: number;
  currentSpeed: number;
  currentHeading: number;
  lastUpdate: string;
}

// API Error class
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Token management
export const TokenService = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Base fetch with auth
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await TokenService.getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try refresh token
  if (response.status === 401 && token) {
    const refreshed = await AuthService.refreshToken();
    if (refreshed) {
      // Retry with new token
      const newToken = await TokenService.getToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      return fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

// Auth Service
export const AuthService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || 'Login failed',
        response.status,
        error.error || 'LOGIN_FAILED'
      );
    }

    const data: LoginResponse = await response.json();

    // Store tokens
    await TokenService.setToken(data.token);
    await TokenService.setRefreshToken(data.refreshToken);

    return data;
  },

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await TokenService.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      await TokenService.setToken(data.accessToken);
      await TokenService.setRefreshToken(data.refreshToken);
      return true;
    } catch {
      return false;
    }
  },

  async getCurrentUser(): Promise<UserInfo> {
    const response = await fetchWithAuth(`${API_CONFIG.AUTH}/me`);

    if (!response.ok) {
      throw new ApiError('Failed to get user info', response.status);
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await TokenService.clearTokens();
  },
};

// GPS Service
export const GPSService = {
  async sendPosition(position: GPSPosition): Promise<{ eventId: string }> {
    const response = await fetchWithAuth(`${API_CONFIG.GPS}/positions`, {
      method: 'POST',
      body: JSON.stringify(position),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || 'Failed to send GPS position',
        response.status
      );
    }

    return response.json();
  },

  async sendPositionBatch(positions: GPSPosition[]): Promise<{ accepted: number; rejected: number }> {
    const response = await fetchWithAuth(`${API_CONFIG.GPS}/positions/bulk`, {
      method: 'POST',
      body: JSON.stringify(positions),
    });

    if (!response.ok) {
      throw new ApiError('Failed to send GPS positions', response.status);
    }

    return response.json();
  },
};

// Location Service
export const LocationService = {
  async getTrucks(params?: { status?: string; page?: number; size?: number }): Promise<Truck[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.size) queryParams.set('size', params.size.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetchWithAuth(`${API_CONFIG.LOCATION}/trucks${query}`);

    if (!response.ok) {
      throw new ApiError('Failed to get trucks', response.status);
    }

    const data = await response.json();
    return data.content || data;
  },

  async getTruckPosition(truckId: string): Promise<GPSPosition> {
    const response = await fetchWithAuth(`${API_CONFIG.LOCATION}/trucks/${truckId}/current-position`);

    if (!response.ok) {
      throw new ApiError('Failed to get truck position', response.status);
    }

    return response.json();
  },

  async getTruckHistory(
    truckId: string,
    startTime: string,
    endTime: string
  ): Promise<GPSPosition[]> {
    const params = new URLSearchParams({
      truckId,
      startTime,
      endTime,
    });

    const response = await fetchWithAuth(`${API_CONFIG.LOCATION}/trucks/history?${params}`);

    if (!response.ok) {
      throw new ApiError('Failed to get truck history', response.status);
    }

    return response.json();
  },
};

export default {
  AuthService,
  GPSService,
  LocationService,
  TokenService,
  API_CONFIG,
};

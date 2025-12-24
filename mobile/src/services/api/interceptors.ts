/**
 * API Interceptors for JWT Authentication
 */

import { AxiosError, AxiosRequestConfig } from 'axios';
import { configureRequestInterceptor, configureResponseInterceptor, setAuthToken } from './client';
import { getTokens, setTokens, clearTokens } from '@services/auth/tokenStorage';
import { Config } from '@constants/config';
import type { LoginResponse } from '@types/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh
 */
const subscribeToRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers of new token
 */
const notifyRefreshSubscribers = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh the access token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) {
      return null;
    }

    // Use fetch directly to avoid interceptor loop
    const response = await fetch(`${Config.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data: LoginResponse = await response.json();

    await setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });

    setAuthToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    await clearTokens();
    return null;
  }
};

/**
 * Check if token needs refresh
 */
const shouldRefreshToken = async (): Promise<boolean> => {
  const tokens = await getTokens();
  if (!tokens) return false;

  const threshold = Config.TOKEN_REFRESH_THRESHOLD * 1000;
  return tokens.expiresAt - Date.now() < threshold;
};

/**
 * Request interceptor - adds auth token and handles pre-emptive refresh
 */
const requestInterceptor = async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
  const tokens = await getTokens();

  if (tokens?.accessToken) {
    // Check if we should refresh proactively
    if (await shouldRefreshToken()) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          notifyRefreshSubscribers(newToken);
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return config;
        }
      }
    }

    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }

  return config;
};

/**
 * Response interceptor - handles 401 errors
 */
const responseInterceptor = (response: any) => response;

const responseErrorInterceptor = async (error: AxiosError): Promise<any> => {
  const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

  // Handle 401 Unauthorized
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    if (isRefreshing) {
      // Wait for refresh to complete
      return new Promise(resolve => {
        subscribeToRefresh((token: string) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          resolve(fetch(originalRequest.url!, originalRequest));
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;

    if (newToken) {
      notifyRefreshSubscribers(newToken);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };
      // Retry original request
      const axios = (await import('./client')).default;
      return axios(originalRequest);
    }

    // Refresh failed - redirect to login
    // This will be handled by the auth store
  }

  return Promise.reject(error);
};

/**
 * Initialize interceptors
 */
export const initializeInterceptors = () => {
  configureRequestInterceptor(requestInterceptor);
  configureResponseInterceptor(responseInterceptor, responseErrorInterceptor);
};

export default initializeInterceptors;

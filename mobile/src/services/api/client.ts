/**
 * Axios API Client Configuration
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Config } from '@constants/config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor placeholder - will be configured by auth service
let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

/**
 * Set the auth token for all requests
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Configure request interceptor
 */
export const configureRequestInterceptor = (
  onRequest: (config: AxiosRequestConfig) => Promise<AxiosRequestConfig>,
) => {
  if (requestInterceptorId !== null) {
    apiClient.interceptors.request.eject(requestInterceptorId);
  }
  requestInterceptorId = apiClient.interceptors.request.use(
    onRequest as (config: any) => any,
    (error: AxiosError) => Promise.reject(error),
  );
};

/**
 * Configure response interceptor
 */
export const configureResponseInterceptor = (
  onResponse: (response: any) => any,
  onError: (error: AxiosError) => Promise<any>,
) => {
  if (responseInterceptorId !== null) {
    apiClient.interceptors.response.eject(responseInterceptorId);
  }
  responseInterceptorId = apiClient.interceptors.response.use(onResponse, onError);
};

/**
 * API methods
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then(res => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then(res => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then(res => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then(res => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then(res => res.data),
};

export default apiClient;

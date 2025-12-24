/**
 * Authentication Service
 */

import { api, setAuthToken } from '@services/api/client';
import { setTokens, clearTokens, getTokens } from './tokenStorage';
import type { LoginRequest, LoginResponse } from '@types/api';
import type { DriverProfile, DriverSession } from '@types/entities';

/**
 * Login with email and password
 */
export const login = async (credentials: LoginRequest): Promise<DriverSession> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);

  const expiresAt = Date.now() + response.expiresIn * 1000;

  // Store tokens securely
  await setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt,
  });

  // Set token for future requests
  setAuthToken(response.accessToken);

  // Return session data
  return {
    userId: response.user.id,
    email: response.user.email,
    firstName: response.user.firstName,
    lastName: response.user.lastName,
    truckId: response.user.truckId,
    truckName: response.user.truckName,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt,
    createdAt: Date.now(),
  };
};

/**
 * Logout - clear tokens and session
 */
export const logout = async (): Promise<void> => {
  try {
    // Notify server (optional, may fail if token expired)
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore errors during logout
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear local tokens
    await clearTokens();
    setAuthToken(null);
  }
};

/**
 * Get current driver profile from server
 */
export const getProfile = async (): Promise<DriverProfile> => {
  return api.get<DriverProfile>('/drivers/me');
};

/**
 * Restore session from stored tokens
 */
export const restoreSession = async (): Promise<DriverSession | null> => {
  const tokens = await getTokens();

  if (!tokens) {
    return null;
  }

  // Set token for requests
  setAuthToken(tokens.accessToken);

  try {
    // Fetch profile to validate token and get user data
    const profile = await getProfile();

    return {
      userId: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      truckId: profile.truckId,
      truckName: profile.truckName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      createdAt: Date.now(), // Approximate
    };
  } catch (error) {
    // Token invalid or expired
    console.warn('Failed to restore session:', error);
    await clearTokens();
    setAuthToken(null);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await getTokens();
  return tokens !== null;
};

export default {
  login,
  logout,
  getProfile,
  restoreSession,
  isAuthenticated,
};

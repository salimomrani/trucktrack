/**
 * Secure Token Storage using react-native-keychain
 */

import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'TruckTrackDriver';
const TOKEN_KEY = 'auth_tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
}

/**
 * Store tokens securely
 */
export const setTokens = async (tokens: StoredTokens): Promise<boolean> => {
  try {
    const tokenString = JSON.stringify(tokens);
    await Keychain.setGenericPassword(TOKEN_KEY, tokenString, {
      service: SERVICE_NAME,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (error) {
    console.error('Failed to store tokens:', error);
    return false;
  }
};

/**
 * Retrieve stored tokens
 */
export const getTokens = async (): Promise<StoredTokens | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (credentials && credentials.password) {
      return JSON.parse(credentials.password) as StoredTokens;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
};

/**
 * Clear stored tokens
 */
export const clearTokens = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({
      service: SERVICE_NAME,
    });
    return true;
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    return false;
  }
};

/**
 * Check if tokens exist and are not expired
 */
export const hasValidTokens = async (): Promise<boolean> => {
  const tokens = await getTokens();
  if (!tokens) return false;

  // Check if access token is expired (with 1 minute buffer)
  const bufferMs = 60 * 1000;
  return tokens.expiresAt > Date.now() + bufferMs;
};

/**
 * Get access token if valid
 */
export const getAccessToken = async (): Promise<string | null> => {
  const tokens = await getTokens();
  if (!tokens) return null;

  // Return token even if expired - interceptor will handle refresh
  return tokens.accessToken;
};

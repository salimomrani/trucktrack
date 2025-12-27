import { TokenStorageService } from './token-storage.service';

/**
 * Unit tests for TokenStorageService
 * Feature: 014-frontend-tests
 * T009: Create token-storage.service.spec.ts with direct instantiation (NO TestBed)
 *
 * Tests token storage, retrieval, expiration checking.
 * Uses direct instantiation for optimal performance.
 */
describe('TokenStorageService', () => {
  let service: TokenStorageService;

  // Test tokens (valid JWT format)
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + // expires in 1 hour
    '.signature';

  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + // expired 1 hour ago
    '.signature';

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return stored access token', () => {
      localStorage.setItem('truck_track_token', 'test-access-token');

      expect(service.getAccessToken()).toBe('test-access-token');
    });
  });

  describe('setAccessToken', () => {
    it('should store access token in localStorage', () => {
      service.setAccessToken('new-access-token');

      expect(localStorage.getItem('truck_track_token')).toBe('new-access-token');
    });

    it('should overwrite existing token', () => {
      service.setAccessToken('first-token');
      service.setAccessToken('second-token');

      expect(localStorage.getItem('truck_track_token')).toBe('second-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is stored', () => {
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return stored refresh token', () => {
      localStorage.setItem('truck_track_refresh_token', 'test-refresh-token');

      expect(service.getRefreshToken()).toBe('test-refresh-token');
    });
  });

  describe('setRefreshToken', () => {
    it('should store refresh token in localStorage', () => {
      service.setRefreshToken('new-refresh-token');

      expect(localStorage.getItem('truck_track_refresh_token')).toBe('new-refresh-token');
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from localStorage', () => {
      localStorage.setItem('truck_track_token', 'access');
      localStorage.setItem('truck_track_refresh_token', 'refresh');

      service.clearTokens();

      expect(localStorage.getItem('truck_track_token')).toBeNull();
      expect(localStorage.getItem('truck_track_refresh_token')).toBeNull();
    });

    it('should not throw when no tokens exist', () => {
      expect(() => service.clearTokens()).not.toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      expect(service.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      expect(service.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for malformed token (not 3 parts)', () => {
      expect(service.isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for token with invalid JSON payload', () => {
      const invalidJson = 'header.' + btoa('not-json') + '.signature';
      expect(service.isTokenExpired(invalidJson)).toBe(true);
    });

    it('should return true for empty string token', () => {
      expect(service.isTokenExpired('')).toBe(true);
    });

    it('should return false when token has no exp claim (known limitation)', () => {
      const noExpToken = 'header.' + btoa(JSON.stringify({ sub: 'user' })) + '.signature';
      // Note: Current implementation returns false when exp is undefined because
      // undefined * 1000 = NaN, and Date.now() >= NaN is always false.
      // This is a known limitation - tokens without exp are not treated as expired.
      expect(service.isTokenExpired(noExpToken)).toBe(false);
    });
  });
});

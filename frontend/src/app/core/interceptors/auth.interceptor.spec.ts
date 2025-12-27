import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';
import { StoreFacade } from '../../store/store.facade';

/**
 * Unit tests for Auth Interceptor
 * Feature: 014-frontend-tests
 * T017: Create auth.interceptor.spec.ts with TestBed + HttpClientTestingModule
 *
 * Tests HTTP request/response interception for authentication.
 * TestBed required for HTTP interceptor chain.
 */
describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockTokenStorage: jasmine.SpyObj<TokenStorageService>;
  let mockStoreFacade: jasmine.SpyObj<StoreFacade>;

  beforeEach(() => {
    mockTokenStorage = jasmine.createSpyObj('TokenStorageService', ['getAccessToken']);
    mockStoreFacade = jasmine.createSpyObj('StoreFacade', ['refreshToken', 'logout']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: mockTokenStorage },
        { provide: StoreFacade, useValue: mockStoreFacade }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authorization header', () => {
    it('should add Authorization header when token exists', () => {
      mockTokenStorage.getAccessToken.and.returnValue('valid-token');

      httpClient.get('/api/location/v1/trucks').subscribe();

      const req = httpMock.expectOne('/api/location/v1/trucks');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});
    });

    it('should NOT add Authorization header when no token', () => {
      mockTokenStorage.getAccessToken.and.returnValue(null);

      httpClient.get('/api/location/v1/trucks').subscribe();

      const req = httpMock.expectOne('/api/location/v1/trucks');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add Authorization header for login endpoint', () => {
      mockTokenStorage.getAccessToken.and.returnValue('valid-token');

      httpClient.post('/api/auth/v1/login', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/v1/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add Authorization header for refresh endpoint', () => {
      mockTokenStorage.getAccessToken.and.returnValue('valid-token');

      httpClient.post('/api/auth/v1/refresh', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/v1/refresh');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 handling', () => {
    it('should attempt token refresh on 401 response', () => {
      mockTokenStorage.getAccessToken.and.returnValue('expired-token');
      // refreshToken returns Observable<void>
      mockStoreFacade.refreshToken.and.returnValue(of(undefined));

      // After refresh, return new token
      let callCount = 0;
      mockTokenStorage.getAccessToken.and.callFake(() => {
        callCount++;
        return callCount === 1 ? 'expired-token' : 'new-token';
      });

      httpClient.get('/api/location/v1/trucks').subscribe();

      // First request with expired token
      const firstReq = httpMock.expectOne('/api/location/v1/trucks');
      firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // After refresh, retry request
      const retryReq = httpMock.expectOne('/api/location/v1/trucks');
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
      retryReq.flush({ data: 'success' });

      expect(mockStoreFacade.refreshToken).toHaveBeenCalled();
    });

    it('should logout user when refresh fails', () => {
      mockTokenStorage.getAccessToken.and.returnValue('expired-token');
      mockStoreFacade.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

      httpClient.get('/api/location/v1/trucks').subscribe({
        error: () => {
          // Expected to error
        }
      });

      const req = httpMock.expectOne('/api/location/v1/trucks');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(mockStoreFacade.logout).toHaveBeenCalled();
    });

    it('should NOT attempt refresh for auth endpoints on 401', () => {
      mockTokenStorage.getAccessToken.and.returnValue(null);

      httpClient.post('/api/auth/v1/login', {}).subscribe({
        error: () => {
          // Expected to error
        }
      });

      const req = httpMock.expectOne('/api/auth/v1/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      expect(mockStoreFacade.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Error passthrough', () => {
    it('should pass through non-401 errors', () => {
      mockTokenStorage.getAccessToken.and.returnValue('valid-token');

      let receivedError: any;
      httpClient.get('/api/location/v1/trucks').subscribe({
        error: (error) => {
          receivedError = error;
        }
      });

      const req = httpMock.expectOne('/api/location/v1/trucks');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(receivedError.status).toBe(404);
      expect(mockStoreFacade.refreshToken).not.toHaveBeenCalled();
    });

    it('should pass through 500 errors', () => {
      mockTokenStorage.getAccessToken.and.returnValue('valid-token');

      let receivedError: any;
      httpClient.get('/api/location/v1/trucks').subscribe({
        error: (error) => {
          receivedError = error;
        }
      });

      const req = httpMock.expectOne('/api/location/v1/trucks');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(receivedError.status).toBe(500);
      expect(mockStoreFacade.refreshToken).not.toHaveBeenCalled();
    });
  });
});

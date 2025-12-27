import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse, RefreshTokenResponse, User, UserRole, ChangePasswordResponse } from '../models/auth.model';

/**
 * Unit tests for AuthService
 * Feature: 014-frontend-tests
 * T011: Create auth.service.spec.ts with TestBed + HttpClientTestingModule
 *
 * Tests HTTP authentication operations (login, refresh, getCurrentUser).
 * TestBed required for HttpClient injection.
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login', () => {
    it('should send login request and return response', (done) => {
      const credentials: LoginRequest = {
        email: 'admin@trucktrack.com',
        password: 'password123'
      };

      const mockResponse: LoginResponse = {
        token: 'access-token',
        refreshToken: 'refresh-token',
        type: 'Bearer',
        email: 'admin@trucktrack.com',
        role: 'ADMIN',
        expiresIn: 86400
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.token).toBe('access-token');
        expect(response.role).toBe('ADMIN');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should propagate error on login failure', (done) => {
      const credentials: LoginRequest = {
        email: 'wrong@test.com',
        password: 'wrong'
      };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('refreshToken', () => {
    it('should send refresh token request and return new tokens', (done) => {
      const refreshToken = 'old-refresh-token';

      const mockResponse: RefreshTokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 86400
      };

      service.refreshToken(refreshToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.accessToken).toBe('new-access-token');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken });
      req.flush(mockResponse);
    });

    it('should propagate error on refresh failure', (done) => {
      service.refreshToken('invalid-token').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/refresh');
      req.flush('Invalid refresh token', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getCurrentUserFromBackend', () => {
    it('should fetch current user from backend', (done) => {
      const mockUser: User = {
        id: '123',
        email: 'admin@trucktrack.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        lastLogin: '2025-12-27T10:00:00Z',
        createdAt: '2025-01-01T00:00:00Z'
      };

      service.getCurrentUserFromBackend().subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(user.role).toBe(UserRole.ADMIN);
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should propagate error when not authenticated', (done) => {
      service.getCurrentUserFromBackend().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/me');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', (done) => {
      const mockProfile = {
        id: '123',
        email: 'admin@trucktrack.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        lastLogin: '2025-12-27T10:00:00Z'
      };

      service.getUserProfile().subscribe(profile => {
        expect(profile.email).toBe('admin@trucktrack.com');
        expect(profile.firstName).toBe('Admin');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });
  });

  describe('changePassword', () => {
    it('should send change password request', (done) => {
      const request = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123'
      };

      const mockResponse: ChangePasswordResponse = {
        message: 'Password changed successfully'
      };

      service.changePassword(request).subscribe(response => {
        expect(response.message).toBe('Password changed successfully');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/change-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should propagate error on wrong current password', (done) => {
      const request = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      service.changePassword(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/change-password');
      req.flush('Invalid current password', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('navigateToLogin', () => {
    it('should navigate to login page', () => {
      service.navigateToLogin();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});

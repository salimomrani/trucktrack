# Quickstart: Frontend Unit Tests

**Feature**: 014-frontend-tests
**Date**: 2025-12-27

## Running Tests

```bash
# Run all frontend tests
cd frontend && npm test

# Run tests with coverage
cd frontend && npm test -- --code-coverage

# Run specific test file
cd frontend && npm test -- --include=**/auth.guard.spec.ts
```

## Test Examples

### 1. Guard Test (Without TestBed)

```typescript
// auth.guard.spec.ts
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { Router, UrlTree } from '@angular/router';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue({} as UrlTree);

    guard = new AuthGuard(mockAuthService, mockRouter);
  });

  describe('canActivate', () => {
    it('should allow access when authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBe(true);
    });

    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate();

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toEqual({} as UrlTree);
    });
  });
});
```

### 2. Simple Service Test (Without TestBed)

```typescript
// token-storage.service.spec.ts
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveToken', () => {
    it('should store token in localStorage', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      service.saveToken(token);

      expect(localStorage.getItem('auth_token')).toBe(token);
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      const token = 'test-token';
      localStorage.setItem('auth_token', token);

      expect(service.getToken()).toBe(token);
    });
  });

  describe('clearToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'some-token');

      service.clearToken();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });
});
```

### 3. Permission Service Test (Without TestBed)

```typescript
// permission.service.spec.ts
import { PermissionService } from './permission.service';
import { TokenStorageService } from './token-storage.service';
import { UserRole } from '../models/auth.model';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockTokenStorage: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    mockTokenStorage = jasmine.createSpyObj('TokenStorageService', ['getDecodedToken']);
    service = new PermissionService(mockTokenStorage);
  });

  describe('hasRole', () => {
    it('should return true when user has required role', () => {
      mockTokenStorage.getDecodedToken.and.returnValue({ role: UserRole.ADMIN });

      expect(service.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it('should return false when user lacks required role', () => {
      mockTokenStorage.getDecodedToken.and.returnValue({ role: UserRole.DRIVER });

      expect(service.hasRole(UserRole.ADMIN)).toBe(false);
    });

    it('should return false when no token exists', () => {
      mockTokenStorage.getDecodedToken.and.returnValue(null);

      expect(service.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      mockTokenStorage.getDecodedToken.and.returnValue({ role: UserRole.ADMIN });

      expect(service.isAdmin()).toBe(true);
    });

    it('should return true for FLEET_MANAGER role', () => {
      mockTokenStorage.getDecodedToken.and.returnValue({ role: UserRole.FLEET_MANAGER });

      expect(service.isAdmin()).toBe(true);
    });
  });
});
```

### 4. HTTP Service Test (With TestBed)

```typescript
// truck.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TruckService } from './truck.service';
import { Truck } from '../models/truck.model';

describe('TruckService', () => {
  let service: TruckService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TruckService]
    });

    service = TestBed.inject(TruckService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTrucks', () => {
    it('should return trucks from API', () => {
      const mockTrucks: Truck[] = [
        { id: '1', licensePlate: 'ABC-123', status: 'ACTIVE' },
        { id: '2', licensePlate: 'XYZ-789', status: 'IDLE' }
      ];

      service.getTrucks().subscribe(trucks => {
        expect(trucks.length).toBe(2);
        expect(trucks).toEqual(mockTrucks);
      });

      const req = httpMock.expectOne('/api/trucks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTrucks);
    });

    it('should handle error response', () => {
      service.getTrucks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/trucks');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
```

### 5. Interceptor Test (With TestBed)

```typescript
// auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockTokenStorage: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    mockTokenStorage = jasmine.createSpyObj('TokenStorageService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TokenStorageService, useValue: mockTokenStorage },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    mockTokenStorage.getToken.and.returnValue('test-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    mockTokenStorage.getToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
```

## Test Patterns Summary

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Direct instantiation | Guards, simple services | `new AuthGuard(mockAuth, mockRouter)` |
| jasmine.createSpyObj | Mocking dependencies | `createSpyObj('Service', ['method'])` |
| HttpClientTestingModule | Services with HTTP | `TestBed.configureTestingModule({imports: [...]})` |
| HttpTestingController | Verifying HTTP calls | `httpMock.expectOne('/api/endpoint')` |

## Coverage Targets

| Category | Target | Files |
|----------|--------|-------|
| Guards | 100% | auth.guard, admin.guard, page.guard |
| Core Services | 90% | auth, permission, token-storage |
| HTTP Services | 80% | truck, geofence, notification |
| Interceptors | 90% | auth.interceptor |

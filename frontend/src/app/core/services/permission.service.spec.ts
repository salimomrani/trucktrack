import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { PermissionService } from './permission.service';
import { Page, UserRole, UserPermissions } from '../models/permission.model';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

/**
 * Unit tests for PermissionService
 * Feature: 014-frontend-tests
 * T010: Create permission.service.spec.ts
 *
 * Tests permission checks based on user roles.
 * Uses TestBed because of NgRx Store and HttpClient dependencies.
 */
describe('PermissionService', () => {
  let service: PermissionService;
  let store: MockStore;
  let httpMock: HttpTestingController;

  const initialState = {
    auth: {
      user: null,
      isAuthenticated: false
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PermissionService,
        provideMockStore({ initialState })
      ]
    });

    service = TestBed.inject(PermissionService);
    store = TestBed.inject(MockStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCurrentUserRole', () => {
    it('should return null when no user is logged in', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      service.getCurrentUserRole().subscribe(role => {
        expect(role).toBeNull();
        done();
      });
    });

    it('should return user role when user is logged in', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.getCurrentUserRole().subscribe(role => {
        expect(role).toBe(UserRole.ADMIN);
        done();
      });
    });
  });

  describe('canAccessPage', () => {
    it('should return false when no user is logged in', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      service.canAccessPage(Page.ADMIN).subscribe(canAccess => {
        expect(canAccess).toBe(false);
        done();
      });
    });

    it('should return true when ADMIN accesses ADMIN page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.canAccessPage(Page.ADMIN).subscribe(canAccess => {
        expect(canAccess).toBe(true);
        done();
      });
    });

    it('should return false when DRIVER tries to access ADMIN page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '2',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      service.canAccessPage(Page.ADMIN).subscribe(canAccess => {
        expect(canAccess).toBe(false);
        done();
      });
    });

    it('should return true when FLEET_MANAGER accesses ANALYTICS page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '3',
        email: 'fm@test.com',
        firstName: 'Fleet',
        lastName: 'Manager',
        role: UserRole.FLEET_MANAGER,
        isActive: true
      });

      service.canAccessPage(Page.ANALYTICS).subscribe(canAccess => {
        expect(canAccess).toBe(true);
        done();
      });
    });
  });

  describe('getAccessiblePages', () => {
    it('should return empty array when no user is logged in', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      service.getAccessiblePages().subscribe(pages => {
        expect(pages).toEqual([]);
        done();
      });
    });

    it('should return all pages for ADMIN', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.getAccessiblePages().subscribe(pages => {
        expect(pages).toContain(Page.ADMIN);
        expect(pages).toContain(Page.DASHBOARD);
        expect(pages).toContain(Page.MAP);
        expect(pages).toContain(Page.ANALYTICS);
        done();
      });
    });

    it('should not include ADMIN page for DRIVER', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '2',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      service.getAccessiblePages().subscribe(pages => {
        expect(pages).not.toContain(Page.ADMIN);
        expect(pages).toContain(Page.DASHBOARD);
        done();
      });
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.hasRole(UserRole.ADMIN).subscribe(hasRole => {
        expect(hasRole).toBe(true);
        done();
      });
    });

    it('should return false when user has different role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.hasRole(UserRole.DRIVER).subscribe(hasRole => {
        expect(hasRole).toBe(false);
        done();
      });
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the specified roles', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'fm@test.com',
        firstName: 'Fleet',
        lastName: 'Manager',
        role: UserRole.FLEET_MANAGER,
        isActive: true
      });

      service.hasAnyRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]).subscribe(hasAny => {
        expect(hasAny).toBe(true);
        done();
      });
    });

    it('should return false when user has none of the specified roles', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      service.hasAnyRole([UserRole.ADMIN, UserRole.FLEET_MANAGER]).subscribe(hasAny => {
        expect(hasAny).toBe(false);
        done();
      });
    });

    it('should return false when no user is logged in', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      service.hasAnyRole([UserRole.ADMIN]).subscribe(hasAny => {
        expect(hasAny).toBe(false);
        done();
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      service.isAdmin().subscribe(isAdmin => {
        expect(isAdmin).toBe(true);
        done();
      });
    });

    it('should return false for non-ADMIN role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      service.isAdmin().subscribe(isAdmin => {
        expect(isAdmin).toBe(false);
        done();
      });
    });
  });

  describe('fetchUserPermissions', () => {
    it('should fetch user permissions from server', (done) => {
      const mockPermissions: UserPermissions = {
        userId: '1',
        role: UserRole.ADMIN,
        accessiblePages: [Page.DASHBOARD, Page.MAP, Page.ADMIN],
        groupIds: ['group1']
      };

      service.fetchUserPermissions().subscribe(permissions => {
        expect(permissions).toEqual(mockPermissions);
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/permissions/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);
    });

    it('should return null on error', (done) => {
      service.fetchUserPermissions().subscribe(permissions => {
        expect(permissions).toBeNull();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/auth/v1/permissions/me');
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});

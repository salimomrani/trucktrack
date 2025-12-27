import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { authGuard, guestOnlyGuard, roleGuard } from './auth.guard';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/auth/auth.selectors';
import { UserRole } from '../models/auth.model';

/**
 * Unit tests for Auth Guards
 * Feature: 014-frontend-tests
 * T013: Create auth.guard.spec.ts
 *
 * Tests authentication and role-based route protection.
 * Uses TestBed because guards use inject() for Store and Router.
 */
describe('Auth Guards', () => {
  let store: MockStore;
  let router: Router;

  const initialState = {
    auth: {
      user: null,
      isAuthenticated: false
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({ initialState }),
        {
          provide: Router,
          useValue: {
            createUrlTree: jasmine.createSpy('createUrlTree').and.callFake((commands: string[]) => {
              return { toString: () => commands.join('/') } as UrlTree;
            })
          }
        }
      ]
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', (done) => {
      store.overrideSelector(selectIsAuthenticated, true);

      TestBed.runInInjectionContext(() => {
        const result = authGuard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should redirect to login when user is not authenticated', (done) => {
      store.overrideSelector(selectIsAuthenticated, false);

      TestBed.runInInjectionContext(() => {
        const result = authGuard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
          done();
        });
      });
    });
  });

  describe('guestOnlyGuard', () => {
    it('should allow access when user is NOT authenticated', (done) => {
      store.overrideSelector(selectIsAuthenticated, false);

      TestBed.runInInjectionContext(() => {
        const result = guestOnlyGuard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should redirect to /map when user IS authenticated', (done) => {
      store.overrideSelector(selectIsAuthenticated, true);

      TestBed.runInInjectionContext(() => {
        const result = guestOnlyGuard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          expect(router.createUrlTree).toHaveBeenCalledWith(['/map']);
          done();
        });
      });
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user has allowed role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      const guard = roleGuard([UserRole.ADMIN, UserRole.FLEET_MANAGER]);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should redirect to unauthorized when user has wrong role', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      const guard = roleGuard([UserRole.ADMIN, UserRole.FLEET_MANAGER]);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
          done();
        });
      });
    });

    it('should redirect to login when no user is found', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      const guard = roleGuard([UserRole.ADMIN]);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
          done();
        });
      });
    });
  });
});

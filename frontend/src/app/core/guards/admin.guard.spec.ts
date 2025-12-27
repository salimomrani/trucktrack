import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { adminGuard } from './admin.guard';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { UserRole } from '../models/auth.model';

/**
 * Unit tests for Admin Guard
 * Feature: 014-frontend-tests
 * T014: Create admin.guard.spec.ts
 *
 * Tests ADMIN role-only route protection.
 * Uses TestBed because guards use inject() for Store and Router.
 */
describe('adminGuard', () => {
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

  it('should allow access for ADMIN user', (done) => {
    store.overrideSelector(selectCurrentUser, {
      id: '1',
      email: 'admin@trucktrack.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true
    });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as any, {} as any);
      (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
        expect(canActivate).toBe(true);
        done();
      });
    });
  });

  it('should redirect FLEET_MANAGER to unauthorized', (done) => {
    store.overrideSelector(selectCurrentUser, {
      id: '2',
      email: 'fm@trucktrack.com',
      firstName: 'Fleet',
      lastName: 'Manager',
      role: UserRole.FLEET_MANAGER,
      isActive: true
    });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as any, {} as any);
      (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
        expect(canActivate).not.toBe(true);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
        done();
      });
    });
  });

  it('should redirect DRIVER to unauthorized', (done) => {
    store.overrideSelector(selectCurrentUser, {
      id: '3',
      email: 'driver@trucktrack.com',
      firstName: 'Driver',
      lastName: 'User',
      role: UserRole.DRIVER,
      isActive: true
    });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as any, {} as any);
      (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
        expect(canActivate).not.toBe(true);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
        done();
      });
    });
  });

  it('should redirect DISPATCHER to unauthorized', (done) => {
    store.overrideSelector(selectCurrentUser, {
      id: '4',
      email: 'dispatcher@trucktrack.com',
      firstName: 'Dispatcher',
      lastName: 'User',
      role: UserRole.DISPATCHER,
      isActive: true
    });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as any, {} as any);
      (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
        expect(canActivate).not.toBe(true);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
        done();
      });
    });
  });

  it('should redirect to login when no user is logged in', (done) => {
    store.overrideSelector(selectCurrentUser, null);

    TestBed.runInInjectionContext(() => {
      const result = adminGuard({} as any, {} as any);
      (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
        expect(canActivate).not.toBe(true);
        expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });
});

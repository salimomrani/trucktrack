import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { pageGuard, multiPageGuard } from './page.guard';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { Page, UserRole } from '../models/permission.model';

/**
 * Unit tests for Page Guard
 * Feature: 014-frontend-tests
 * T015: Create page.guard.spec.ts
 *
 * Tests page-level RBAC route protection.
 * Uses TestBed because guards use inject() for Store and Router.
 */
describe('Page Guards', () => {
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
            createUrlTree: jasmine.createSpy('createUrlTree').and.callFake(
              (commands: string[], extras?: { queryParams?: any }) => {
                return {
                  toString: () => commands.join('/'),
                  queryParams: extras?.queryParams
                } as UrlTree;
              }
            )
          }
        }
      ]
    });

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
  });

  describe('pageGuard', () => {
    it('should allow ADMIN to access ADMIN page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true
      });

      const guard = pageGuard(Page.ADMIN);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should allow FLEET_MANAGER to access ANALYTICS page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '2',
        email: 'fm@test.com',
        firstName: 'Fleet',
        lastName: 'Manager',
        role: UserRole.FLEET_MANAGER,
        isActive: true
      });

      const guard = pageGuard(Page.ANALYTICS);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should deny DRIVER access to ADMIN page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '3',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      const guard = pageGuard(Page.ADMIN);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          expect(router.createUrlTree).toHaveBeenCalled();
          done();
        });
      });
    });

    it('should deny DISPATCHER access to ANALYTICS page', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '4',
        email: 'dispatcher@test.com',
        firstName: 'Dispatcher',
        lastName: 'User',
        role: UserRole.DISPATCHER,
        isActive: true
      });

      const guard = pageGuard(Page.ANALYTICS);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          done();
        });
      });
    });

    it('should redirect to login when no user is found', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      const guard = pageGuard(Page.DASHBOARD);

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

  describe('multiPageGuard', () => {
    it('should allow access when user can access any of the pages', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '1',
        email: 'fm@test.com',
        firstName: 'Fleet',
        lastName: 'Manager',
        role: UserRole.FLEET_MANAGER,
        isActive: true
      });

      // FLEET_MANAGER can access DASHBOARD and MAP
      const guard = multiPageGuard([Page.DASHBOARD, Page.MAP]);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).toBe(true);
          done();
        });
      });
    });

    it('should deny access when user cannot access any of the pages', (done) => {
      store.overrideSelector(selectCurrentUser, {
        id: '2',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        role: UserRole.DRIVER,
        isActive: true
      });

      // DRIVER cannot access ADMIN or ANALYTICS
      const guard = multiPageGuard([Page.ADMIN, Page.ANALYTICS]);

      TestBed.runInInjectionContext(() => {
        const result = guard({} as any, {} as any);
        (result as Observable<boolean | UrlTree>).subscribe((canActivate: boolean | UrlTree) => {
          expect(canActivate).not.toBe(true);
          done();
        });
      });
    });

    it('should redirect to login when no user is found', (done) => {
      store.overrideSelector(selectCurrentUser, null);

      const guard = multiPageGuard([Page.DASHBOARD, Page.MAP]);

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

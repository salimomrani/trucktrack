import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AppState } from '../../store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { Page, UserRole, canAccessPage } from '../models/permission.model';

/**
 * Page Guard Factory - Creates a guard that checks if user can access a specific page.
 * Feature: 008-rbac-permissions
 * T010: Create pageGuard factory function
 *
 * Uses the permission matrix defined in permission.model.ts.
 * Redirects to /access-denied if user doesn't have access.
 *
 * Usage: canActivate: [pageGuard(Page.ANALYTICS)]
 */
export function pageGuard(page: Page): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const store = inject(Store<AppState>);
    const router = inject(Router);

    return store.select(selectCurrentUser).pipe(
      take(1),
      map(user => {
        if (!user) {
          console.log('No user found, redirecting to login');
          return router.createUrlTree(['/login']);
        }

        const userRole = user.role as UserRole;
        if (canAccessPage(userRole, page)) {
          return true;
        }

        // User doesn't have access to this page
        console.log(`User role ${user.role} cannot access page ${page}`);
        return router.createUrlTree(['/access-denied'], {
          queryParams: { page, role: user.role }
        });
      })
    );
  };
}

/**
 * Multi-page Guard Factory - Creates a guard that checks if user can access any of the specified pages.
 * Useful for routes that serve multiple purposes.
 *
 * Usage: canActivate: [multiPageGuard([Page.DASHBOARD, Page.MAP])]
 */
export function multiPageGuard(pages: Page[]): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const store = inject(Store<AppState>);
    const router = inject(Router);

    return store.select(selectCurrentUser).pipe(
      take(1),
      map(user => {
        if (!user) {
          console.log('No user found, redirecting to login');
          return router.createUrlTree(['/login']);
        }

        const userRole = user.role as UserRole;
        const hasAccess = pages.some(page => canAccessPage(userRole, page));

        if (hasAccess) {
          return true;
        }

        console.log(`User role ${user.role} cannot access any of pages: ${pages.join(', ')}`);
        return router.createUrlTree(['/access-denied'], {
          queryParams: { page: pages[0], role: user.role }
        });
      })
    );
  };
}

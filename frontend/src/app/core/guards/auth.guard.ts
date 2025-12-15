import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/auth/auth.selectors';

/**
 * Auth Guard - Protects routes that require authentication
 * Redirects to login page if user is not authenticated
 * Uses NgRx Store selectors as single source of truth
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};

/**
 * Guest Only Guard - Allows access only to unauthenticated users
 * Redirects authenticated users to map page
 * Uses NgRx Store selectors as single source of truth
 * Usage: canActivate: [guestOnlyGuard] on login route
 */
export const guestOnlyGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/map']);
    })
  );
};

/**
 * Role Guard Factory - Creates a guard that checks for specific roles
 * Uses NgRx Store selectors as single source of truth
 * Usage: canActivate: [roleGuard(['FLEET_MANAGER', 'DISPATCHER'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
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

        if (allowedRoles.includes(user.role)) {
          return true;
        }

        // User doesn't have required role, redirect to unauthorized page
        console.log(`User role ${user.role} not authorized for this route`);
        return router.createUrlTree(['/unauthorized']);
      })
    );
  };
}

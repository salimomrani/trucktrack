import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

/**
 * Admin Guard - Protects admin routes
 * Only allows access to users with ADMIN role
 * T017: Create AdminGuard
 * Feature: 002-admin-panel
 */
export const adminGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectCurrentUser).pipe(
    take(1),
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      if (user.role === 'ADMIN') {
        return true;
      }

      // User doesn't have ADMIN role, redirect to unauthorized page
      return router.createUrlTree(['/unauthorized']);
    })
  );
};

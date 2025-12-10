import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // User is not authenticated, redirect to login
  console.log('User not authenticated, redirecting to login');
  return router.createUrlTree(['/login']);
};

/**
 * Role Guard Factory - Creates a guard that checks for specific roles
 * Usage: canActivate: [roleGuard(['FLEET_MANAGER', 'DISPATCHER'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();

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
  };
}

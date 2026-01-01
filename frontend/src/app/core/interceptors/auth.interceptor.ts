import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { StoreFacade } from '../../store/store.facade';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * HTTP Interceptor that adds JWT token to outgoing requests
 * and handles 401 Unauthorized responses by attempting token refresh
 * Uses TokenStorageService for token access and StoreFacade for refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const facade = inject(StoreFacade);
  const tokenStorage = inject(TokenStorageService);

  // Get the access token from TokenStorageService
  const token = tokenStorage.getAccessToken();

  // Clone request and add authorization header if token exists
  // Skip token for login and refresh endpoints
  const isAuthEndpoint = req.url.includes('/auth/v1/login') || req.url.includes('/auth/v1/refresh');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Send the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized and we have a refresh token, try to refresh
      if (error.status === 401 && !isAuthEndpoint) {

        return facade.refreshToken().pipe(
          switchMap(() => {
            // Retry the original request with new token from TokenStorageService
            const newToken = tokenStorage.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout user
            console.error('Token refresh failed, logging out');
            facade.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // For other errors, just pass them through
      return throwError(() => error);
    })
  );
};

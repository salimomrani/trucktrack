import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          switchMap((response) => {
            // Store access token and refresh token in localStorage
            this.tokenStorage.setAccessToken(response.token);
            if (response.refreshToken) {
              this.tokenStorage.setRefreshToken(response.refreshToken);
            }

            // Fetch user details from backend
            return this.authService.getCurrentUserFromBackend().pipe(
              map(user => AuthActions.loginSuccess({ response, user })),
              catchError(error => {
                console.error('Failed to fetch user after login:', error);
                return of(AuthActions.loginFailure({ error: error.message || 'Failed to fetch user details' }));
              })
            );
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message || 'Login failed' }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          // AuthService already handles navigation
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        // Clear tokens from localStorage
        this.tokenStorage.clearTokens();
      }),
      map(() => AuthActions.logoutSuccess())
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          // Navigate to login page after logout
          this.authService.navigateToLogin();
        })
      ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      switchMap(() => {
        // Check if token exists in localStorage
        const token = this.tokenStorage.getAccessToken();
        if (!token) {
          return of(AuthActions.loadUserFailure({ error: 'No token found' }));
        }

        // Check if token is expired
        if (this.tokenStorage.isTokenExpired(token)) {
          console.log('Access token expired, attempting refresh...');

          // Try to refresh using refresh token
          const refreshToken = this.tokenStorage.getRefreshToken();
          if (!refreshToken) {
            console.log('No refresh token available');
            return of(AuthActions.loadUserFailure({ error: 'Token expired and no refresh token' }));
          }

          // Attempt to refresh tokens
          return this.authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              // Store new tokens
              this.tokenStorage.setAccessToken(response.accessToken);
              this.tokenStorage.setRefreshToken(response.refreshToken);
              console.log('Token refreshed successfully');

              // Now fetch user with new token
              return this.authService.getCurrentUserFromBackend().pipe(
                map(user => AuthActions.loadUserSuccess({ user })),
                catchError(error => of(AuthActions.loadUserFailure({ error: error.message || 'Failed to load user after refresh' })))
              );
            }),
            catchError(error => {
              console.error('Token refresh failed:', error);
              this.tokenStorage.clearTokens();
              return of(AuthActions.loadUserFailure({ error: 'Token refresh failed' }));
            })
          );
        }

        // Token is valid, fetch user from backend
        return this.authService.getCurrentUserFromBackend().pipe(
          map(user => AuthActions.loadUserSuccess({ user })),
          catchError(error => of(AuthActions.loadUserFailure({ error: error.message || 'Failed to load user' })))
        );
      })
    )
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() => {
        // Get refresh token from localStorage
        const refreshToken = this.tokenStorage.getRefreshToken();
        if (!refreshToken) {
          return of(AuthActions.refreshTokenFailure({ error: 'No refresh token available' }));
        }

        return this.authService.refreshToken(refreshToken).pipe(
          map((response) => {
            // Store new tokens in localStorage
            this.tokenStorage.setAccessToken(response.accessToken);
            this.tokenStorage.setRefreshToken(response.refreshToken);

            return AuthActions.refreshTokenSuccess({
              token: response.accessToken,
              refreshToken: response.refreshToken
            });
          }),
          catchError((error) =>
            of(AuthActions.refreshTokenFailure({ error: error.message || 'Token refresh failed' }))
          )
        );
      })
    )
  );

  refreshTokenFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        tap(() => {
          // Clear tokens and navigate to login on refresh failure
          this.tokenStorage.clearTokens();
          this.authService.navigateToLogin();
        })
      ),
    { dispatch: false }
  );

  loadUserFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadUserFailure),
        tap(() => {
          // Clear any remaining tokens
          // Navigation is handled by route guards - they will redirect to login
          // when they see isAuthenticated: false in the store
          this.tokenStorage.clearTokens();
        })
      ),
    { dispatch: false }
  );
}

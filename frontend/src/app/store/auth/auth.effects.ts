import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects implements OnInitEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          switchMap((response) => {
            // Store access token in localStorage
            this.tokenStorage.setAccessToken(response.token);

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
          return of(AuthActions.loadUserFailure({ error: 'Token expired' }));
        }

        // Fetch user from backend
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

  /**
   * Initialize auth state on effects startup
   * This method is called automatically by NgRx when the effect is initialized
   */
  ngrxOnInitEffects(): Action {
    return AuthActions.loadUser();
  }
}

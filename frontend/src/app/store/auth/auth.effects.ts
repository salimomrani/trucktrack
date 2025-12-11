import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects implements OnInitEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) => {
            // Get user from current state (already set by authService)
            const user = this.authService.getCurrentUser();
            if (!user) {
              throw new Error('User not found after login');
            }
            return AuthActions.loginSuccess({ response, user });
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
        this.authService.logout();
      }),
      map(() => AuthActions.logoutSuccess())
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          // AuthService already handles navigation
        })
      ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      map(() => {
        const user = this.authService.getCurrentUser();
        if (user) {
          return AuthActions.loadUserSuccess({ user });
        } else {
          return AuthActions.loadUserFailure({ error: 'No user found' });
        }
      })
    )
  );

  /**
   * Initialize auth state on effects startup
   * This method is called automatically by NgRx when the effect is initialized
   */
  ngrxOnInitEffects(): Action {
    return AuthActions.loadUser();
  }
}

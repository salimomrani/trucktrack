import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { response, user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState
  })),

  // Load User
  on(AuthActions.loadUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false
  })),

  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error
  })),

  // Refresh Token
  on(AuthActions.refreshToken, (state) => ({
    ...state,
    loading: true
  })),

  on(AuthActions.refreshTokenSuccess, (state) => ({
    ...state,
    loading: false
  })),

  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

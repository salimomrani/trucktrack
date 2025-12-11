import { ApplicationConfig, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects, Actions, ofType } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { rootReducers, metaReducers, AppState } from './store';
import { AuthEffects } from './store/auth/auth.effects';
import { TrucksEffects } from './store/trucks/trucks.effects';
import * as AuthActions from './store/auth/auth.actions';

/**
 * Initialize authentication state before app bootstrap
 * This prevents flash of login page on refresh by loading user from token first
 */
function initializeAuth(store: Store<AppState>, actions$: Actions) {
  return () => {
    // Dispatch loadUser action
    store.dispatch(AuthActions.loadUser());

    // Wait for either success or failure before continuing app bootstrap
    return firstValueFrom(
      actions$.pipe(
        ofType(AuthActions.loadUserSuccess, AuthActions.loadUserFailure)
      )
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(rootReducers, { metaReducers }),
    provideEffects([AuthEffects, TrucksEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [Store, Actions],
      multi: true
    }
  ]
};

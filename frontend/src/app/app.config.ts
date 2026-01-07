import { ApplicationConfig, isDevMode, APP_INITIALIZER, LOCALE_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects, Actions, ofType } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CustomMissingTranslationHandler } from './core/services/missing-translation.handler';
import { environment } from '../environments/environment';

// Register locales for date/number formatting
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeEn, 'en');

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { rootReducers, metaReducers, AppState } from './store';
import { AuthEffects } from './store/auth/auth.effects';
import { TrucksEffects } from './store/trucks/trucks.effects';
import { HistoryEffects } from './store/history/history.effects';
import { CacheEffects } from './store/cache/cache.effects';
import { NotificationsEffects } from './store/notifications/notifications.effects';
import { TripsEffects } from './store/trips/trips.effects';
import { LanguageEffects } from './store/language/language.effects';
import * as AuthActions from './store/auth/auth.actions';

/**
 * Initialize authentication state before app bootstrap
 * This prevents flash of login page on refresh by loading user from token first
 */
function initializeAuth(store: Store<AppState>, actions$: Actions) {
  return () => {
    // IMPORTANT: Subscribe FIRST, then dispatch
    // Otherwise we miss the action if it's emitted synchronously
    const result = firstValueFrom(
      actions$.pipe(
        ofType(AuthActions.loadUserSuccess, AuthActions.loadUserFailure),
        timeout(5000),
        catchError((err) => {
          console.warn('Auth initialization timeout, continuing without auth:', err);
          return of(null);
        })
      )
    );

    // Now dispatch the action - the subscription above will catch the response
    store.dispatch(AuthActions.loadUser());

    return result;
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(rootReducers, { metaReducers }),
    provideEffects([AuthEffects, TrucksEffects, HistoryEffects, CacheEffects, NotificationsEffects, TripsEffects, LanguageEffects]),
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
    },
    // i18n configuration with cache busting via build date query string
    ...TranslateModule.forRoot({
      defaultLanguage: 'fr',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new TranslateHttpLoader(http, './assets/i18n/', `.json?d=${environment.buildTimestamp}`),
        deps: [HttpClient]
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: CustomMissingTranslationHandler
      }
    }).providers || [],
    {
      provide: LOCALE_ID,
      useValue: 'fr'
    }
  ]
};

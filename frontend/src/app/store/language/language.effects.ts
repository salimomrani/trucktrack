import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { tap, map } from 'rxjs/operators';
import * as LanguageActions from './language.actions';
import {
  SupportedLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES
} from './language.state';

@Injectable()
export class LanguageEffects {
  private readonly actions$ = inject(Actions);
  private readonly translate = inject(TranslateService);

  /**
   * Initialize language from localStorage or default
   */
  initLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LanguageActions.initLanguage),
      map(() => {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
        const language = this.isValidLanguage(stored) ? stored : DEFAULT_LANGUAGE;

        // Configure TranslateService
        this.translate.setDefaultLang(DEFAULT_LANGUAGE);
        this.translate.use(language);

        return LanguageActions.initLanguageSuccess({ language });
      })
    )
  );

  /**
   * Set language and update TranslateService
   */
  setLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LanguageActions.setLanguage),
      map(({ language }) => {
        const validLanguage = this.isValidLanguage(language) ? language : DEFAULT_LANGUAGE;

        // Update TranslateService
        this.translate.use(validLanguage);

        // Persist to localStorage
        localStorage.setItem(LANGUAGE_STORAGE_KEY, validLanguage);

        return LanguageActions.setLanguageSuccess({ language: validLanguage });
      })
    )
  );

  /**
   * Persist language to localStorage (standalone action)
   */
  persistLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LanguageActions.persistLanguage),
        tap(({ language }) => {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        })
      ),
    { dispatch: false }
  );

  /**
   * Validate if a language is supported
   */
  private isValidLanguage(lang: string | null): lang is SupportedLanguage {
    return lang !== null && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  }
}

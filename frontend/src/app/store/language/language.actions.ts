import { createAction, props } from '@ngrx/store';
import { SupportedLanguage } from './language.state';

// Initialize language from localStorage or default
export const initLanguage = createAction('[Language] Init Language');

export const initLanguageSuccess = createAction(
  '[Language] Init Language Success',
  props<{ language: SupportedLanguage }>()
);

// Set language (user action)
export const setLanguage = createAction(
  '[Language] Set Language',
  props<{ language: SupportedLanguage }>()
);

export const setLanguageSuccess = createAction(
  '[Language] Set Language Success',
  props<{ language: SupportedLanguage }>()
);

// Persist language to localStorage
export const persistLanguage = createAction(
  '[Language] Persist Language',
  props<{ language: SupportedLanguage }>()
);

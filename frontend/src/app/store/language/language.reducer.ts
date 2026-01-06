import { createReducer, on } from '@ngrx/store';
import { initialLanguageState } from './language.state';
import * as LanguageActions from './language.actions';

export const languageReducer = createReducer(
  initialLanguageState,

  on(LanguageActions.initLanguageSuccess, (state, { language }) => ({
    ...state,
    currentLanguage: language,
    initialized: true
  })),

  on(LanguageActions.setLanguageSuccess, (state, { language }) => ({
    ...state,
    currentLanguage: language
  }))
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LanguageState, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, SupportedLanguage } from './language.state';

/**
 * Feature selector for language state
 */
export const selectLanguageState = createFeatureSelector<LanguageState>('language');

/**
 * Select current language
 */
export const selectCurrentLanguage = createSelector(
  selectLanguageState,
  (state) => state.currentLanguage
);

/**
 * Select if language is initialized
 */
export const selectLanguageInitialized = createSelector(
  selectLanguageState,
  (state) => state.initialized
);

/**
 * Select current language display name
 */
export const selectCurrentLanguageName = createSelector(
  selectCurrentLanguage,
  (language) => LANGUAGE_NAMES[language]
);

/**
 * Select all supported languages with their names
 */
export const selectSupportedLanguages = createSelector(
  selectLanguageState,
  () => SUPPORTED_LANGUAGES
);

/**
 * Select language names map
 */
export const selectLanguageNames = createSelector(
  selectLanguageState,
  () => LANGUAGE_NAMES
);

/**
 * Select available languages (excluding current)
 */
export const selectOtherLanguages = createSelector(
  selectCurrentLanguage,
  (current) => SUPPORTED_LANGUAGES.filter((lang) => lang !== current)
);

/**
 * Select language dropdown view model
 */
export const selectLanguageDropdownViewModel = createSelector(
  selectCurrentLanguage,
  selectSupportedLanguages,
  selectLanguageNames,
  (currentLanguage, supportedLanguages, languageNames) => ({
    currentLanguage,
    currentLanguageName: languageNames[currentLanguage],
    supportedLanguages,
    languageNames,
    languageFlags: {
      fr: '🇫🇷',
      en: '🇬🇧'
    } as Record<SupportedLanguage, string>
  })
);

/**
 * Supported language codes
 */
export type SupportedLanguage = 'fr' | 'en';

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English'
};

/**
 * Supported languages list
 */
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['fr', 'en'] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

/**
 * LocalStorage key for language preference
 */
export const LANGUAGE_STORAGE_KEY = 'trucktrack_language';

/**
 * Language state interface
 */
export interface LanguageState {
  currentLanguage: SupportedLanguage;
  initialized: boolean;
}

/**
 * Initial language state
 */
export const initialLanguageState: LanguageState = {
  currentLanguage: DEFAULT_LANGUAGE,
  initialized: false
};

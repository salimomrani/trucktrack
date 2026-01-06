import { Injectable } from '@angular/core';
import { SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../store/language/language.state';

/**
 * Utility service for language-related operations
 * State management is handled by NgRx store via StoreFacade
 *
 * @deprecated Use StoreFacade for language state management
 * This service only provides utility methods like getBrowserLanguage()
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  /**
   * Get the browser's preferred language
   */
  getBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language?.split('-')[0] as SupportedLanguage;
    return this.isValidLanguage(browserLang) ? browserLang : DEFAULT_LANGUAGE;
  }

  /**
   * Check if a language is supported
   */
  isValidLanguage(lang: string | null): lang is SupportedLanguage {
    return lang !== null && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  }
}

// Re-export types for backwards compatibility
export type { SupportedLanguage } from '../../store/language/language.state';

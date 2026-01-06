import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'fr' | 'en';

const LANGUAGE_STORAGE_KEY = 'trucktrack_language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  /** Supported languages */
  readonly supportedLanguages: readonly SupportedLanguage[] = ['fr', 'en'] as const;

  /** Default language */
  readonly defaultLanguage: SupportedLanguage = 'fr';

  /** Current language signal */
  readonly currentLanguage = signal<SupportedLanguage>(this.defaultLanguage);

  /** Language display names */
  readonly languageNames: Record<SupportedLanguage, string> = {
    fr: 'Français',
    en: 'English'
  };

  /**
   * Initialize language from localStorage or default
   * Should be called once at app startup
   */
  init(): void {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    const language = this.isValidLanguage(stored) ? stored : this.defaultLanguage;

    this.currentLanguage.set(language);
    this.translate.use(language);
    this.translate.setDefaultLang(this.defaultLanguage);
  }

  /**
   * Switch to a new language and persist preference
   */
  setLanguage(lang: SupportedLanguage): void {
    if (!this.isValidLanguage(lang)) {
      console.warn(`Invalid language: ${lang}, falling back to ${this.defaultLanguage}`);
      lang = this.defaultLanguage;
    }

    this.currentLanguage.set(lang);
    this.translate.use(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }

  /**
   * Get the browser's preferred language (for future auto-detect feature)
   */
  getBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language?.split('-')[0] as SupportedLanguage;
    return this.isValidLanguage(browserLang) ? browserLang : this.defaultLanguage;
  }

  /**
   * Check if a language is supported
   */
  private isValidLanguage(lang: string | null): lang is SupportedLanguage {
    return lang !== null && this.supportedLanguages.includes(lang as SupportedLanguage);
  }
}

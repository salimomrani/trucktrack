import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, SupportedLanguage } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  /** Whether the dropdown is open */
  readonly isOpen = signal(false);

  /** Current language */
  readonly currentLanguage = this.languageService.currentLanguage;

  /** Available languages */
  readonly languages = this.languageService.supportedLanguages;

  /** Language display names */
  readonly languageNames = this.languageService.languageNames;

  /** Flag emojis for languages */
  readonly languageFlags: Record<SupportedLanguage, string> = {
    fr: '🇫🇷',
    en: '🇬🇧'
  };

  toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  selectLanguage(lang: SupportedLanguage): void {
    this.languageService.setLanguage(lang);
    this.isOpen.set(false);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }
}

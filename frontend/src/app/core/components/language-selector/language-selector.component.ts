import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreFacade } from '../../../store/store.facade';
import { SupportedLanguage } from '../../../store/language/language.state';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  private readonly facade = inject(StoreFacade);

  /** Whether the dropdown is open */
  readonly isOpen = signal(false);

  /** Language dropdown view model from NgRx selector */
  readonly viewModel = this.facade.languageDropdownViewModel;

  /** Current language (from store) */
  readonly currentLanguage = this.facade.currentLanguage;

  /** Available languages (from store) */
  readonly languages = this.facade.supportedLanguages;

  /** Language display names (from store) */
  readonly languageNames = this.facade.languageNames;

  /** Flag emojis for languages */
  readonly languageFlags: Record<SupportedLanguage, string> = {
    fr: '🇫🇷',
    en: '🇬🇧'
  };

  toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  selectLanguage(lang: SupportedLanguage): void {
    this.facade.setLanguage(lang);
    this.isOpen.set(false);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }
}

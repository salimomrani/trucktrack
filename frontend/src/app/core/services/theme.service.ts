import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'trucktrack-theme';

/**
 * ThemeService - Manages dark/light mode
 * - Persists preference to localStorage
 * - Applies 'dark' class to <html> element
 * - Respects system preference on first visit
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _theme = signal<Theme>(this.getInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = () => this._theme() === 'dark';

  constructor() {
    // Apply theme class whenever theme changes
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  /**
   * Toggle between light and dark mode
   */
  toggle(): void {
    this._theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }

  /**
   * Apply theme to DOM and persist to localStorage
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(THEME_KEY, theme);
  }
}

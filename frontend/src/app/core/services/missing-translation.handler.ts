import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';
import { isDevMode } from '@angular/core';

/**
 * Custom handler for missing translations
 * - Development: Shows [KEY] to help developers identify missing translations
 * - Production: Shows the last part of the key as fallback text
 */
export class CustomMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (isDevMode()) {
      console.warn(`Missing translation key: ${params.key}`);
      return `[${params.key}]`;
    }

    // In production, return the last segment of the key as a readable fallback
    // e.g., "COMMON.SAVE" -> "SAVE", "NAV.DASHBOARD" -> "DASHBOARD"
    const lastSegment = params.key.split('.').pop() || params.key;

    // Convert SCREAMING_SNAKE_CASE to Title Case
    return lastSegment
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

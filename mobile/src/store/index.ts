/**
 * Zustand Store Configuration
 * Central export for all store slices
 */

export { useAuthStore } from './authStore';
export { useStatusStore } from './statusStore';
export { useTripsStore } from './tripsStore';
export { useMessagesStore } from './messagesStore';
export { useSettingsStore } from './settingsStore';

// Re-export types
export type { AuthState } from './authStore';
export type { StatusState } from './statusStore';
export type { TripsState } from './tripsStore';
export type { MessagesState } from './messagesStore';
export type { SettingsState } from './settingsStore';

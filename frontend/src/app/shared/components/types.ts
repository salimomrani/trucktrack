/**
 * Shared Types for TruckTrack UI Components
 * Feature: 020-tailwind-migration
 */

/**
 * Option type for Select components
 */
export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Column definition for Table component
 */
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Sort event for Table component
 */
export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Dialog configuration
 */
export interface DialogConfig {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  data?: any;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Confirm dialog options
 */
export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

/**
 * Toast notification configuration
 */
export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Component sizes
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Input types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel';

/**
 * Icon positions
 */
export type IconPosition = 'left' | 'right';

/**
 * Datepicker modes
 */
export type DatepickerMode = 'single' | 'range' | 'multiple';

/**
 * Card padding options
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

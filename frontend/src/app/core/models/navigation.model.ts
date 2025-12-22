import { Signal } from '@angular/core';
import { UserRole } from './auth.model';

/**
 * Navigation item interface for menu structure
 */
export interface NavItem {
  /** Display label for the menu item */
  label: string;
  /** Router link path */
  route: string;
  /** Material icon name */
  icon: string;
  /** Roles that can see this item (empty = all roles) */
  roles: UserRole[];
  /** Optional badge count signal for dynamic badges */
  badge?: Signal<number>;
  /** Badge color theme */
  badgeColor?: 'primary' | 'accent' | 'warn';
  /** Whether this is a divider/separator */
  divider?: boolean;
  /** Child items for sub-menus */
  children?: NavItem[];
  /** Category grouping label */
  category?: string;
}

/**
 * Navigation category for grouping menu items
 */
export interface NavCategory {
  label: string;
  items: NavItem[];
}

/**
 * Navigation layout state for responsive behavior
 */
export interface NavigationState {
  /** Sidenav open/closed state */
  sidenavOpen: boolean;
  /** Sidenav mode: 'side' (push), 'over' (overlay) */
  sidenavMode: 'side' | 'over';
  /** Mini mode (icons only) on desktop */
  miniMode: boolean;
  /** Current breakpoint */
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Navigation configuration constants
 */
export interface NavigationConfig {
  /** Breakpoint thresholds in pixels */
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  /** Sidenav dimensions */
  dimensions: {
    miniWidth: number;
    fullWidth: number;
  };
  /** Animation timing in ms */
  animationDuration: number;
}

/** Default navigation configuration */
export const DEFAULT_NAV_CONFIG: NavigationConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1024
  },
  dimensions: {
    miniWidth: 56,
    fullWidth: 240
  },
  animationDuration: 250
};

/**
 * Header indicator for critical information (alerts, offline trucks)
 */
export interface HeaderIndicator {
  /** Unique identifier */
  id: string;
  /** Material icon name */
  icon: string;
  /** Badge count (0 = hidden) */
  count: number;
  /** Badge display text (e.g., "99+") */
  displayText: string;
  /** Badge color */
  color: 'primary' | 'accent' | 'warn';
  /** Click route */
  route: string;
  /** Tooltip text */
  tooltip: string;
  /** Pulse animation enabled */
  pulse: boolean;
}

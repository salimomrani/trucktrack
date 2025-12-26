import { Injectable, Signal, computed, inject } from '@angular/core';
import { NavItem } from '../models/navigation.model';
import { UserRole } from '../models/auth.model';

/**
 * NavigationService - Centralized navigation configuration and role-based filtering
 *
 * Provides:
 * - Complete navigation structure definition
 * - Role-based item filtering
 * - Dynamic badge support for alerts and offline trucks
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  /**
   * Complete navigation items configuration
   * Roles array defines which roles can see each item
   * Empty roles array = visible to all authenticated users
   */
  private readonly ALL_NAV_ITEMS: NavItem[] = [
    // Operations category
    {
      label: 'Carte',
      route: '/map',
      icon: 'map',
      roles: [], // All roles can see Map
      category: 'operations'
    },
    {
      label: 'Historique',
      route: '/history',
      icon: 'history',
      roles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.VIEWER],
      category: 'operations'
    },
    {
      label: 'Alertes',
      route: '/alerts',
      icon: 'notifications',
      roles: [UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.VIEWER],
      category: 'operations',
      badgeColor: 'warn'
    },
    // Geofences removed - accessible via /map geofence panel

    // Administration category (ADMIN only)
    {
      label: 'Utilisateurs',
      route: '/admin/users',
      icon: 'people',
      roles: [UserRole.ADMIN],
      category: 'administration'
    },
    {
      label: 'Camions',
      route: '/admin/trucks',
      icon: 'local_shipping',
      roles: [UserRole.ADMIN],
      category: 'administration'
    },
    {
      label: 'Trajets',
      route: '/admin/trips',
      icon: 'route',
      roles: [UserRole.ADMIN],
      category: 'administration'
    },
    {
      label: 'Configuration',
      route: '/admin/config',
      icon: 'settings',
      roles: [UserRole.ADMIN],
      category: 'administration'
    }
  ];

  /**
   * User menu items (always visible after main nav)
   */
  private readonly USER_MENU_ITEMS: NavItem[] = [
    {
      label: 'Profil',
      route: '/profile',
      icon: 'person',
      roles: [] // All roles
    }
  ];

  /**
   * Get all navigation items (unfiltered)
   */
  getAllNavigationItems(): NavItem[] {
    return [...this.ALL_NAV_ITEMS];
  }

  /**
   * Get navigation items filtered by user role
   * @param role - Current user's role
   * @returns Filtered navigation items the user can access
   */
  getNavigationItemsForRole(role: UserRole | null | undefined): NavItem[] {
    if (!role) {
      // No role defined - return only items with empty roles array (Map only)
      return this.ALL_NAV_ITEMS.filter(item => item.roles.length === 0);
    }

    return this.ALL_NAV_ITEMS.filter(item => {
      // Empty roles array means visible to all authenticated users
      if (item.roles.length === 0) {
        return true;
      }
      // Check if user's role is in the allowed roles
      return item.roles.includes(role);
    });
  }

  /**
   * Get navigation items grouped by category
   * @param role - Current user's role
   * @returns Object with categories as keys and filtered items as values
   */
  getNavigationItemsByCategory(role: UserRole | null | undefined): Record<string, NavItem[]> {
    const items = this.getNavigationItemsForRole(role);
    const categories: Record<string, NavItem[]> = {};

    items.forEach(item => {
      const category = item.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });

    return categories;
  }

  /**
   * Get user menu items
   */
  getUserMenuItems(): NavItem[] {
    return [...this.USER_MENU_ITEMS];
  }

  /**
   * Check if a route is accessible for a given role
   * @param route - Route path to check
   * @param role - User's role
   * @returns true if route is accessible
   */
  isRouteAccessible(route: string, role: UserRole | null | undefined): boolean {
    const item = this.ALL_NAV_ITEMS.find(i => i.route === route);
    if (!item) {
      return true; // Unknown routes are handled by guards
    }
    if (item.roles.length === 0) {
      return true; // Visible to all
    }
    return role ? item.roles.includes(role) : false;
  }

  /**
   * Get category label for display
   */
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'operations': 'Opérations',
      'administration': 'Administration',
      'other': 'Autre'
    };
    return labels[category] || category;
  }

  /**
   * Check if user has access to administration section
   */
  hasAdminAccess(role: UserRole | null | undefined): boolean {
    return role === UserRole.ADMIN;
  }
}

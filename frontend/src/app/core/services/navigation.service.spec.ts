import { NavigationService } from './navigation.service';
import { UserRole } from '../models/auth.model';

/**
 * Unit tests for NavigationService
 * Feature: 014-frontend-tests
 * T023: Create navigation.service.spec.ts with direct instantiation (NO TestBed)
 *
 * Tests navigation menu generation based on user roles.
 * Uses direct instantiation for optimal performance - no Angular DI needed.
 */
describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    service = new NavigationService();
  });

  describe('getAllNavigationItems', () => {
    it('should return all navigation items', () => {
      const items = service.getAllNavigationItems();

      expect(items.length).toBeGreaterThan(0);
      expect(items.some(item => item.route === '/map')).toBe(true);
      expect(items.some(item => item.route === '/admin/users')).toBe(true);
    });

    it('should return a copy of items (not reference)', () => {
      const items1 = service.getAllNavigationItems();
      const items2 = service.getAllNavigationItems();

      expect(items1).not.toBe(items2);
      expect(items1).toEqual(items2);
    });
  });

  describe('getNavigationItemsForRole', () => {
    it('should return all items for ADMIN role', () => {
      const items = service.getNavigationItemsForRole(UserRole.ADMIN);

      expect(items.some(item => item.route === '/map')).toBe(true);
      expect(items.some(item => item.route === '/admin/users')).toBe(true);
      expect(items.some(item => item.route === '/admin/trucks')).toBe(true);
      expect(items.some(item => item.route === '/admin/config')).toBe(true);
    });

    it('should return limited items for DRIVER role', () => {
      const items = service.getNavigationItemsForRole(UserRole.DRIVER);

      // DRIVER should see Map (empty roles = all)
      expect(items.some(item => item.route === '/map')).toBe(true);

      // DRIVER should NOT see admin items
      expect(items.some(item => item.route === '/admin/users')).toBe(false);
      expect(items.some(item => item.route === '/admin/trucks')).toBe(false);
    });

    it('should return limited items for FLEET_MANAGER role', () => {
      const items = service.getNavigationItemsForRole(UserRole.FLEET_MANAGER);

      expect(items.some(item => item.route === '/map')).toBe(true);
      expect(items.some(item => item.route === '/history')).toBe(true);
      expect(items.some(item => item.route === '/alerts')).toBe(true);

      // FLEET_MANAGER should NOT see admin items
      expect(items.some(item => item.route === '/admin/users')).toBe(false);
    });

    it('should return only items with empty roles when role is null', () => {
      const items = service.getNavigationItemsForRole(null);

      // Only Map has empty roles array (visible to all)
      expect(items.length).toBe(1);
      expect(items[0].route).toBe('/map');
    });

    it('should return only items with empty roles when role is undefined', () => {
      const items = service.getNavigationItemsForRole(undefined);

      expect(items.length).toBe(1);
      expect(items[0].route).toBe('/map');
    });
  });

  describe('getNavigationItemsByCategory', () => {
    it('should group items by category for ADMIN', () => {
      const categories = service.getNavigationItemsByCategory(UserRole.ADMIN);

      expect(categories['operations']).toBeDefined();
      expect(categories['administration']).toBeDefined();
      expect(categories['operations'].some(item => item.route === '/map')).toBe(true);
      expect(categories['administration'].some(item => item.route === '/admin/users')).toBe(true);
    });

    it('should NOT include administration category for DRIVER', () => {
      const categories = service.getNavigationItemsByCategory(UserRole.DRIVER);

      expect(categories['administration']).toBeUndefined();
    });

    it('should include operations for FLEET_MANAGER', () => {
      const categories = service.getNavigationItemsByCategory(UserRole.FLEET_MANAGER);

      expect(categories['operations']).toBeDefined();
      expect(categories['operations'].length).toBeGreaterThan(0);
    });
  });

  describe('getUserMenuItems', () => {
    it('should return user menu items', () => {
      const items = service.getUserMenuItems();

      expect(items.length).toBeGreaterThan(0);
      expect(items.some(item => item.route === '/profile')).toBe(true);
    });

    it('should return a copy of items', () => {
      const items1 = service.getUserMenuItems();
      const items2 = service.getUserMenuItems();

      expect(items1).not.toBe(items2);
    });
  });

  describe('isRouteAccessible', () => {
    it('should return true for /map route for any role', () => {
      expect(service.isRouteAccessible('/map', UserRole.ADMIN)).toBe(true);
      expect(service.isRouteAccessible('/map', UserRole.DRIVER)).toBe(true);
      expect(service.isRouteAccessible('/map', UserRole.FLEET_MANAGER)).toBe(true);
    });

    it('should return true for /admin/users only for ADMIN', () => {
      expect(service.isRouteAccessible('/admin/users', UserRole.ADMIN)).toBe(true);
      expect(service.isRouteAccessible('/admin/users', UserRole.DRIVER)).toBe(false);
      expect(service.isRouteAccessible('/admin/users', UserRole.FLEET_MANAGER)).toBe(false);
    });

    it('should return true for unknown routes (handled by guards)', () => {
      expect(service.isRouteAccessible('/unknown-route', UserRole.DRIVER)).toBe(true);
    });

    it('should return false for restricted routes when role is null', () => {
      expect(service.isRouteAccessible('/admin/users', null)).toBe(false);
      expect(service.isRouteAccessible('/history', null)).toBe(false);
    });

    it('should return true for /map even when role is null', () => {
      expect(service.isRouteAccessible('/map', null)).toBe(true);
    });
  });

  describe('getCategoryLabel', () => {
    it('should return French labels for known categories', () => {
      expect(service.getCategoryLabel('operations')).toBe('Opérations');
      expect(service.getCategoryLabel('administration')).toBe('Administration');
      expect(service.getCategoryLabel('other')).toBe('Autre');
    });

    it('should return category name for unknown categories', () => {
      expect(service.getCategoryLabel('unknown')).toBe('unknown');
    });
  });

  describe('hasAdminAccess', () => {
    it('should return true only for ADMIN role', () => {
      expect(service.hasAdminAccess(UserRole.ADMIN)).toBe(true);
      expect(service.hasAdminAccess(UserRole.FLEET_MANAGER)).toBe(false);
      expect(service.hasAdminAccess(UserRole.DISPATCHER)).toBe(false);
      expect(service.hasAdminAccess(UserRole.DRIVER)).toBe(false);
      expect(service.hasAdminAccess(UserRole.VIEWER)).toBe(false);
    });

    it('should return false when role is null', () => {
      expect(service.hasAdminAccess(null)).toBe(false);
    });

    it('should return false when role is undefined', () => {
      expect(service.hasAdminAccess(undefined)).toBe(false);
    });
  });
});

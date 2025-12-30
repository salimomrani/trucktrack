import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { StoreFacade } from '../../../store/store.facade';
import { NotificationService } from '../../../services/notification.service';
import { NavigationService } from '../../services/navigation.service';
import { NavItem } from '../../models/navigation.model';
import { UserRole } from '../../models/auth.model';

/**
 * Header Component - Application navigation header
 * - Tailwind-based header with dynamic navigation based on user role
 * - User menu with logout (using MatMenu for dropdown)
 * - Notification badges for alerts
 * - Mobile hamburger menu support
 * - Integrated with NgRx store
 * - Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly facade = inject(StoreFacade);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly navigationService = inject(NavigationService);

  // Store signals
  currentUser = this.facade.currentUser;
  isAuthenticated = this.facade.isAuthenticated;

  // T165: Notification badge - unread count from NotificationService
  unreadCount = this.notificationService.unreadCount;

  // User menu dropdown state
  userMenuOpen = signal(false);

  // Mobile menu state
  mobileMenuOpen = signal(false);

  // Current user role computed from currentUser
  currentUserRole = computed(() => {
    const user = this.currentUser();
    return user?.role ?? null;
  });

  // Navigation items filtered by current user role (US1 + US2)
  filteredNavItems = computed(() => {
    const role = this.currentUserRole();
    return this.navigationService.getNavigationItemsForRole(role);
  });

  // Navigation items grouped by category
  navItemsByCategory = computed(() => {
    const role = this.currentUserRole();
    return this.navigationService.getNavigationItemsByCategory(role);
  });

  // Check if user has admin access
  hasAdminAccess = computed(() => {
    return this.navigationService.hasAdminAccess(this.currentUserRole());
  });

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      // Load initial unread count
      this.loadUnreadCount();
      // Connect to notification WebSocket for real-time updates
      this.notificationService.connectWebSocket();
    }
  }

  /**
   * Load unread notification count from backend
   */
  private loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        this.notificationService.unreadCount.set(response.count);
      },
      error: (err) => {
        console.error('Failed to load unread count:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectWebSocket();
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.facade.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Get user display name (firstName + lastName or email)
   */
  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) {
      return '';
    }

    const fullName = [user.firstName, user.lastName]
      .filter(name => name && name.trim())
      .join(' ');

    return fullName || user.email;
  }

  /**
   * Get user initials for avatar
   */
  getInitials(): string {
    const user = this.currentUser();
    if (!user) {
      return '?';
    }

    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return '?';
  }

  /**
   * Format badge count (show 99+ if > 99)
   */
  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update(open => !open);
  }

  /**
   * Close user menu dropdown
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Check if nav item is the alerts route (for badge display)
   */
  isAlertsRoute(item: NavItem): boolean {
    return item.route === '/alerts';
  }

  /**
   * Get category label for display
   */
  getCategoryLabel(category: string): string {
    return this.navigationService.getCategoryLabel(category);
  }
}

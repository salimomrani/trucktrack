import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StoreFacade } from '../../../store/store.facade';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { NotificationService } from '../../../services/notification.service';
import { NavigationService } from '../../services/navigation.service';
import { NavItem } from '../../models/navigation.model';
import { UserRole } from '../../models/auth.model';

/**
 * Header Component - Application navigation header
 * - Material toolbar with dynamic navigation based on user role
 * - User menu with logout
 * - Notification badges for alerts
 * - Mobile hamburger menu support
 * - Integrated with NgRx store
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    SearchBarComponent
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

  // Mobile sidenav state
  sidenavOpen = signal(false);

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

  // Output event for mobile sidenav toggle
  readonly toggleSidenavEvent = output<void>();

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
   * Format badge count (show 99+ if > 99)
   */
  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Toggle mobile sidenav - emit event to parent
   */
  toggleSidenav(): void {
    this.toggleSidenavEvent.emit();
  }

  /**
   * Close mobile sidenav
   */
  closeSidenav(): void {
    this.sidenavOpen.set(false);
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

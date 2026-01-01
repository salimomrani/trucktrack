import {
  Component,
  inject,
  computed,
  output,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StoreFacade } from '../../../store/store.facade';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { NavItem } from '../../models/navigation.model';

/**
 * Sidebar Component
 * Dark sidebar with navigation, user info and logout.
 * Feature: 021-sidebar-layout
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly facade = inject(StoreFacade);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  /** Event emitted when navigation item is clicked (for mobile close) */
  readonly navigationClick = output<void>();

  /** Store signals */
  readonly currentUser = this.facade.currentUser;
  readonly isAuthenticated = this.facade.isAuthenticated;

  /** Unread notification count */
  readonly unreadCount = this.notificationService.unreadCount;

  /** Current user role */
  readonly currentUserRole = computed(() => {
    const user = this.currentUser();
    return user?.role ?? null;
  });

  /** Navigation items as array of categories for sidebar */
  readonly navCategories = computed(() => {
    const role = this.currentUserRole();
    return this.navigationService.getSidebarNavigation(role);
  });

  ngOnInit(): void {
    // Load unread count if authenticated
    if (this.isAuthenticated()) {
      this.notificationService.getUnreadCount()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notificationService.unreadCount.set(response.count);
          },
          error: (err) => {
            console.error('Failed to load unread count:', err);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.facade.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Handle navigation click (emit for mobile close)
   */
  onNavClick(): void {
    this.navigationClick.emit();
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return '';

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
    if (!user) return '?';

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
   * Format badge count (99+ if > 99)
   */
  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Check if nav item is alerts route
   */
  isAlertsRoute(item: NavItem): boolean {
    return item.route === '/alerts';
  }

  /**
   * Get category label
   */
  getCategoryLabel(category: string): string {
    return this.navigationService.getCategoryLabel(category);
  }
}

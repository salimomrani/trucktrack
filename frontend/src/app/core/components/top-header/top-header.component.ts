import {
  Component,
  inject,
  signal,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../../services/notification.service';
import { StoreFacade } from '../../../store/store.facade';
import { NotificationsDropdownComponent } from '../../../shared/components/notifications-dropdown/notifications-dropdown.component';

/**
 * Top Header Component
 * Simplified header with actions (theme, notifications, user).
 * Feature: 021-sidebar-layout
 */
@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [RouterLink, NotificationsDropdownComponent],
  templateUrl: './top-header.component.html',
  styleUrl: './top-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopHeaderComponent {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);
  private readonly facade = inject(StoreFacade);

  /** Event to toggle mobile sidebar */
  readonly toggleSidebar = output<void>();

  /** Current user */
  readonly currentUser = this.facade.currentUser;

  /** Theme state */
  readonly isDark = this.themeService.isDark;

  /** Unread notification count */
  readonly unreadCount = this.notificationService.unreadCount;

  /** Notifications dropdown open state */
  readonly notificationsOpen = signal(false);

  /** User menu dropdown open state */
  readonly userMenuOpen = signal(false);

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    this.themeService.toggle();
  }

  /**
   * Toggle notifications dropdown
   */
  toggleNotifications(): void {
    this.userMenuOpen.set(false);
    this.notificationsOpen.update(open => !open);
  }

  /**
   * Close notifications dropdown
   */
  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu(): void {
    this.notificationsOpen.set(false);
    this.userMenuOpen.update(open => !open);
  }

  /**
   * Close user menu dropdown
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Handle sidebar toggle click
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Get user initials
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
   * Format badge count
   */
  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
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

    return fullName || user.email || '';
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.closeUserMenu();
    this.facade.logout();
    this.router.navigate(['/login']);
  }
}

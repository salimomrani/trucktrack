import {
  Component,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/navigation.model';

/**
 * Sidenav Component - Navigation opérationnelle
 * - Mini mode (icons) on desktop, full mode on mobile/tablet
 * - Operations navigation only (no admin, no user section)
 * - Auto-close on navigation (mobile/tablet)
 * - Migrated to Tailwind CSS (Feature 020)
 */
@Component({
    selector: 'app-sidenav',
    imports: [
    RouterLink,
    RouterLinkActive
],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {
  private readonly router = inject(Router);

  /** Navigation items to display */
  readonly navItems = input<NavItem[]>([]);

  /** Whether sidenav is open */
  readonly isOpen = input<boolean>(false);

  /** Mini mode - icons only (desktop) */
  readonly miniMode = input<boolean>(false);

  /** Emit when sidenav should close */
  readonly closed = output<void>();

  /** Emit when a nav item is clicked */
  readonly itemClicked = output<NavItem>();

  /**
   * Handle keyboard Escape to close sidenav
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  /**
   * Close the sidenav
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Handle navigation item click
   */
  onNavItemClick(item: NavItem): void {
    this.router.navigate([item.route]);
    this.itemClicked.emit(item);
  }

  /**
   * Get operations items only (filter out admin and alerts - alerts are in header)
   */
  getOperationsItems(): NavItem[] {
    return this.navItems().filter(item =>
      item.category === 'operations' && item.route !== '/alerts'
    );
  }
}

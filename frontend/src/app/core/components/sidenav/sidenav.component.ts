import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  HostListener,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavItem } from '../../models/navigation.model';

/**
 * Sidenav Component - Navigation opérationnelle
 * - Mini mode (icons) on desktop, full mode on mobile/tablet
 * - Operations navigation only (no admin, no user section)
 * - Auto-close on navigation (mobile/tablet)
 */
@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SidenavComponent {
  private readonly router = inject(Router);

  /** Navigation items to display */
  @Input() navItems: NavItem[] = [];

  /** Whether sidenav is open */
  @Input() isOpen = false;

  /** Mini mode - icons only (desktop) */
  @Input() miniMode = false;

  /** Emit when sidenav should close */
  @Output() closed = new EventEmitter<void>();

  /** Emit when a nav item is clicked */
  @Output() itemClicked = new EventEmitter<NavItem>();

  /**
   * Handle keyboard Escape to close sidenav
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
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
    return this.navItems.filter(item =>
      item.category === 'operations' && item.route !== '/alerts'
    );
  }
}

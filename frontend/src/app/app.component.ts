import { Component, OnDestroy, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './core/components/header/header.component';
import { SidenavComponent } from './core/components/sidenav/sidenav.component';
import { ConfirmDialogOverlayComponent } from './admin/shared/confirm-dialog/confirm-dialog-overlay.component';
import { NotificationService } from './services/notification.service';
import { NavigationService } from './core/services/navigation.service';
import { StoreFacade } from './store/store.facade';
import { ToastService } from './shared/components/toast/toast.service';
import { Notification } from './models/notification.model';
import { DEFAULT_NAV_CONFIG } from './core/models/navigation.model';

/**
 * Root application component
 * T166-T167: Real-time notification handling with snackbar alerts
 * 003-nav-optimization: Mobile sidenav integration
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidenavComponent, ConfirmDialogOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'frontend';

  private readonly notificationService = inject(NotificationService);
  private readonly navigationService = inject(NavigationService);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(StoreFacade);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Navigation state signals
  sidenavOpen = signal(false);
  sidenavMode = signal<'side' | 'over'>('side');
  miniMode = signal(false);
  currentBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Current user info for sidenav
  currentUser = this.facade.currentUser;
  isAuthenticated = this.facade.isAuthenticated;
  unreadCount = this.notificationService.unreadCount;

  // Navigation items for sidenav (operations only)
  filteredNavItems = computed(() => {
    const user = this.currentUser();
    return this.navigationService.getNavigationItemsForRole(user?.role ?? null);
  });

  constructor() {
    // Subscribe to new notifications and show snackbar
    this.notificationService.newNotification$
      .pipe(takeUntilDestroyed())
      .subscribe(notification => {
        this.showNotificationSnackbar(notification);
      });

    // T166: Connect/disconnect WebSocket based on auth state
    effect(() => {
      const isAuthenticated = this.facade.isAuthenticated();
      if (isAuthenticated) {
        this.notificationService.connectWebSocket();
      } else {
        this.notificationService.disconnectWebSocket();
      }
    });

    // Responsive breakpoint detection
    this.breakpointObserver
      .observe([
        `(max-width: ${DEFAULT_NAV_CONFIG.breakpoints.mobile - 1}px)`,
        `(min-width: ${DEFAULT_NAV_CONFIG.breakpoints.mobile}px) and (max-width: ${DEFAULT_NAV_CONFIG.breakpoints.desktop - 1}px)`,
        `(min-width: ${DEFAULT_NAV_CONFIG.breakpoints.desktop}px)`
      ])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        const breakpoints = result.breakpoints;
        if (breakpoints[`(max-width: ${DEFAULT_NAV_CONFIG.breakpoints.mobile - 1}px)`]) {
          // Mobile: overlay sidenav, closed by default
          this.currentBreakpoint.set('mobile');
          this.sidenavMode.set('over');
          this.miniMode.set(false);
          this.sidenavOpen.set(false);
        } else if (breakpoints[`(min-width: ${DEFAULT_NAV_CONFIG.breakpoints.mobile}px) and (max-width: ${DEFAULT_NAV_CONFIG.breakpoints.desktop - 1}px)`]) {
          // Tablet: overlay sidenav, closed by default
          this.currentBreakpoint.set('tablet');
          this.sidenavMode.set('over');
          this.miniMode.set(false);
          this.sidenavOpen.set(false);
        } else {
          // Desktop: side sidenav, mini mode, always open
          this.currentBreakpoint.set('desktop');
          this.sidenavMode.set('side');
          this.miniMode.set(true);
          this.sidenavOpen.set(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectWebSocket();
  }

  /**
   * T167: Show toast alert for new notification
   */
  private showNotificationSnackbar(notification: Notification): void {
    const message = `${notification.title}: ${notification.message}`;

    switch (notification.severity) {
      case 'CRITICAL':
        this.toast.error(message);
        break;
      case 'WARNING':
        this.toast.warning(message);
        break;
      case 'INFO':
      default:
        this.toast.info(message);
        break;
    }
  }

  // --- Sidenav Methods ---

  /**
   * Toggle sidenav open/closed
   */
  toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }

  /**
   * Close sidenav
   */
  closeSidenav(): void {
    this.sidenavOpen.set(false);
  }

  /**
   * Handle navigation item click - close sidenav on mobile/tablet
   */
  onNavItemClicked(): void {
    if (this.sidenavMode() === 'over') {
      this.closeSidenav();
    }
  }

}

import {
  Component,
  signal,
  computed,
  HostListener,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { SidebarV2Component } from '../sidebar-v2/sidebar-v2.component';
import { TopHeaderComponent } from '../top-header/top-header.component';

/**
 * Layout Shell Component
 * Orchestrates the sidebar and header layout.
 * Feature: 021-sidebar-layout
 */
@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [SidebarV2Component, TopHeaderComponent],
  templateUrl: './layout-shell.component.html',
  styleUrl: './layout-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  /** Breakpoint for lg (1024px) */
  private readonly LG_BREAKPOINT = 1024;

  /** Mobile sidebar open state */
  readonly mobileSidebarOpen = signal(false);

  /** Current window width */
  private readonly windowWidth = signal(
    typeof window !== 'undefined' ? window.innerWidth : this.LG_BREAKPOINT
  );

  /** Is mobile/tablet view */
  readonly isMobile = computed(() => this.windowWidth() < this.LG_BREAKPOINT);

  /** Sidebar classes for responsive behavior */
  readonly sidebarClasses = computed(() => {
    const base = 'sidebar-container';
    if (this.isMobile()) {
      return this.mobileSidebarOpen()
        ? `${base} mobile-open`
        : `${base} mobile-closed`;
    }
    return `${base} desktop`;
  });

  ngOnInit(): void {
    // Close mobile sidebar on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.mobileSidebarOpen.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Listen for window resize
   */
  @HostListener('window:resize')
  onResize(): void {
    this.windowWidth.set(window.innerWidth);

    // Close mobile sidebar when resizing to desktop
    if (!this.isMobile()) {
      this.mobileSidebarOpen.set(false);
    }
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(open => !open);
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  /**
   * Handle sidebar navigation click
   */
  onSidebarNavigationClick(): void {
    if (this.isMobile()) {
      this.closeMobileSidebar();
    }
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    this.closeMobileSidebar();
  }
}

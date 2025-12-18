import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { StoreFacade } from '../../../store/store.facade';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { NotificationService } from '../../../services/notification.service';

/**
 * Header Component - Application navigation header
 * - Material toolbar with navigation
 * - User menu with logout
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

  // Store signals
  currentUser = this.facade.currentUser;
  isAuthenticated = this.facade.isAuthenticated;

  // T165: Notification badge - unread count from NotificationService
  unreadCount = this.notificationService.unreadCount;

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
}

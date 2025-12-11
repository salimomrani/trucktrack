import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { StoreFacade } from '../../../store/store.facade';

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
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private readonly facade = inject(StoreFacade);
  private readonly router = inject(Router);

  // Store signals
  currentUser = this.facade.currentUser;
  isAuthenticated = this.facade.isAuthenticated;

  /**
   * Handle user logout
   */
  logout(): void {
    this.facade.logout();
    this.router.navigate(['/login']);
  }
}

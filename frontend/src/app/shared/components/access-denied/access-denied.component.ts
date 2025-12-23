import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Page } from '../../../core/models/permission.model';

/**
 * AccessDeniedComponent - Displayed when user tries to access a page they don't have permission for
 * Feature: 008-rbac-permissions
 * T030: Create AccessDeniedComponent
 *
 * Receives query params:
 * - page: The Page enum value they tried to access
 * - role: The user's current role
 */
@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss'
})
export class AccessDeniedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  /** The page user tried to access */
  deniedPage = signal<string | null>(null);

  /** User's current role */
  userRole = signal<string | null>(null);

  /** Page labels for user-friendly display */
  private readonly pageLabels: Record<string, string> = {
    [Page.DASHBOARD]: 'Tableau de bord',
    [Page.MAP]: 'Carte',
    [Page.ANALYTICS]: 'Analytics',
    [Page.ADMIN]: 'Administration',
    [Page.ALERTS]: 'Alertes',
    [Page.PROFILE]: 'Profil'
  };

  /** Role labels for user-friendly display */
  private readonly roleLabels: Record<string, string> = {
    'ADMIN': 'Administrateur',
    'FLEET_MANAGER': 'Gestionnaire de flotte',
    'DISPATCHER': 'Dispatcher',
    'DRIVER': 'Conducteur',
    'VIEWER': 'Observateur'
  };

  ngOnInit(): void {
    // Read query params
    const page = this.route.snapshot.queryParamMap.get('page');
    const role = this.route.snapshot.queryParamMap.get('role');

    this.deniedPage.set(page);
    this.userRole.set(role);
  }

  /**
   * Get user-friendly page name
   */
  getPageLabel(): string {
    const page = this.deniedPage();
    if (page && this.pageLabels[page]) {
      return this.pageLabels[page];
    }
    return page || 'cette page';
  }

  /**
   * Get user-friendly role name
   */
  getRoleLabel(): string {
    const role = this.userRole();
    if (role && this.roleLabels[role]) {
      return this.roleLabels[role];
    }
    return role || 'votre role';
  }
}

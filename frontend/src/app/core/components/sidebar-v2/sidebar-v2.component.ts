import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';
import { SidebarService } from '../../services/sidebar.service';

interface NavItem {
  icon: string;
  label: string;
  translationKey: string;
  route: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  translationKey: string;
  items: NavItem[];
}

/**
 * SidebarV2 - Industrial Command Center Design
 * A refined, modern sidebar with command-center aesthetics
 */
@Component({
  selector: 'app-sidebar-v2',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar-v2.component.html',
  styleUrl: './sidebar-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarV2Component {
  private readonly facade = inject(StoreFacade);
  private readonly sidebarService = inject(SidebarService);

  // Collapse state from service
  readonly isCollapsed = this.sidebarService.isCollapsed;

  // User data from store
  readonly currentUser = this.facade.currentUser;
  readonly unreadNotifications = this.facade.unreadCount;

  // Show labels when not collapsed
  readonly showLabels = computed(() => !this.isCollapsed());

  // Navigation structure
  readonly navGroups: NavGroup[] = [
    {
      title: 'Operations',
      translationKey: 'SIDEBAR.OPERATIONS',
      items: [
        { icon: 'map', label: 'Live Map', translationKey: 'NAV.MAP', route: '/map' },
        { icon: 'history', label: 'History', translationKey: 'NAV.HISTORY', route: '/history' },
        { icon: 'notifications', label: 'Alerts', translationKey: 'NAV.ALERTS', route: '/alerts' }
      ]
    },
    {
      title: 'Fleet',
      translationKey: 'SIDEBAR.MANAGEMENT',
      items: [
        { icon: 'local_shipping', label: 'Trucks', translationKey: 'NAV.TRUCKS', route: '/admin/trucks' },
        { icon: 'route', label: 'Trips', translationKey: 'NAV.TRIPS', route: '/admin/trips' },
        { icon: 'groups', label: 'Groups', translationKey: 'NAV.GROUPS', route: '/admin/groups' }
      ]
    },
    {
      title: 'Admin',
      translationKey: 'SIDEBAR.ADMINISTRATION',
      items: [
        { icon: 'people', label: 'Users', translationKey: 'NAV.USERS', route: '/admin/users' },
        { icon: 'settings', label: 'Config', translationKey: 'NAV.CONFIG', route: '/admin/config' },
        { icon: 'dashboard', label: 'Dashboard', translationKey: 'NAV.DASHBOARD', route: '/admin/dashboard' }
      ]
    }
  ];

  toggleCollapse(): void {
    this.sidebarService.toggleCollapsed();
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
  }

  logout(): void {
    this.facade.logout();
  }
}

import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';
import { pageGuard } from './core/guards/page.guard';
import { Page } from './core/models/permission.model';

export const routes: Routes = [
  // Default route - redirect to map if authenticated, otherwise to login
  {
    path: '',
    redirectTo: '/map',
    pathMatch: 'full'
  },

  // Login route - guests only, authenticated users redirected to map
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login - Truck Track'
  },

  // Map route - protected, requires MAP page access
  // Accessible by: ADMIN, FLEET_MANAGER, DISPATCHER, VIEWER (not DRIVER)
  {
    path: 'map',
    canActivate: [authGuard, pageGuard(Page.MAP)],
    loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent),
    title: 'Live Map - Truck Track'
  },

  // History route - protected, requires authentication
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent),
    title: 'History - Truck Track'
  },

  // Alerts route - protected, requires authentication
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () => import('./features/alerts/alerts.component').then(m => m.AlertsComponent),
    title: 'Alerts - Truck Track'
  },

  // Analytics route - protected, requires ANALYTICS page access
  // Accessible by: ADMIN, FLEET_MANAGER only
  // Feature: 006-fleet-analytics, 008-rbac-permissions
  {
    path: 'analytics',
    canActivate: [authGuard, pageGuard(Page.ANALYTICS)],
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    title: 'Analytics - Truck Track'
  },

  // Profile route - protected, requires authentication
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profile - Truck Track'
  },

  // Admin routes - protected by adminGuard, lazy loaded
  // T020: Add admin route to AppRoutingModule
  // Feature: 002-admin-panel
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    title: 'Admin - Truck Track'
  },

  // Access Denied route - shown when user doesn't have permission for a page
  // Feature: 008-rbac-permissions, T033
  {
    path: 'access-denied',
    loadComponent: () => import('./shared/components/access-denied/access-denied.component').then(m => m.AccessDeniedComponent),
    title: 'Accès refusé - Truck Track'
  },

  // Unauthorized route - shown when user doesn't have required role (legacy)
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Unauthorized - Truck Track'
  },

  // 404 Not Found - catch all route
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Not Found - Truck Track'
  }
];

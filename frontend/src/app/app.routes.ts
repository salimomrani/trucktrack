import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';

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

  // Map route - protected, requires authentication
  {
    path: 'map',
    canActivate: [authGuard],
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

  // Geofences route - redirects to map with geofences panel
  // 003-nav-optimization: Added geofences navigation link
  // Note: redirectTo handles auth via the target route's guard
  {
    path: 'geofences',
    redirectTo: '/map',
    pathMatch: 'full'
  },

  // Profile route - placeholder, redirects to map for now
  {
    path: 'profile',
    redirectTo: '/map',
    pathMatch: 'full'
  },

  // Admin routes - protected by adminGuard, lazy loaded
  // T020: Add admin route to AppRoutingModule
  // Feature: 002-admin-panel
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    title: 'Admin - Truck Track'
  },

  // Unauthorized route - shown when user doesn't have required role
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

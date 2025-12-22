import { Routes } from '@angular/router';
import { adminGuard } from '../core/guards/admin.guard';

/**
 * Admin module routes
 * T019: Create AdminRoutingModule
 * Feature: 002-admin-panel
 *
 * All routes are lazy-loaded and protected by adminGuard
 */
export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      // Dashboard - default admin page
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/stats-dashboard.component').then(m => m.StatsDashboardComponent),
        title: 'Dashboard - Admin'
      },

      // User Management
      {
        path: 'users',
        loadComponent: () => import('./users/user-list/user-list.component').then(m => m.UserListComponent),
        title: 'Users - Admin'
      },
      {
        path: 'users/new',
        loadComponent: () => import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
        title: 'New User - Admin'
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
        title: 'Edit User - Admin'
      },

      // Truck Management
      {
        path: 'trucks',
        loadComponent: () => import('./trucks/truck-list/truck-list.component').then(m => m.TruckListComponent),
        title: 'Trucks - Admin'
      },
      {
        path: 'trucks/new',
        loadComponent: () => import('./trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'New Truck - Admin'
      },
      {
        path: 'trucks/:id',
        loadComponent: () => import('./trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'Edit Truck - Admin'
      },

      // Group Management
      {
        path: 'groups',
        loadComponent: () => import('./groups/group-list/group-list.component').then(m => m.GroupListComponent),
        title: 'Groups - Admin'
      },
      {
        path: 'groups/new',
        loadComponent: () => import('./groups/group-form/group-form.component').then(m => m.GroupFormComponent),
        title: 'New Group - Admin'
      },
      {
        path: 'groups/:id',
        loadComponent: () => import('./groups/group-form/group-form.component').then(m => m.GroupFormComponent),
        title: 'Edit Group - Admin'
      },

      // Configuration
      {
        path: 'config',
        loadComponent: () => import('./config/config-page.component').then(m => m.ConfigPageComponent),
        title: 'Configuration - Admin'
      }
    ]
  }
];

import { Component, Input } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  link?: string;
  icon?: string;
}

/**
 * Breadcrumb navigation component for admin pages.
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-breadcrumb',
    imports: [RouterModule, MatIconModule],
    template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <!-- Dashboard link (always first) -->
        <li class="breadcrumb-item">
          <a routerLink="/admin/dashboard" class="breadcrumb-link home">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
        </li>

        <!-- Additional items -->
        @for (item of items; track item.label; let last = $last) {
          <li class="breadcrumb-item">
            <mat-icon class="separator">chevron_right</mat-icon>
            @if (item.link && !last) {
              <a [routerLink]="item.link" class="breadcrumb-link">
                @if (item.icon) {
                  <mat-icon>{{ item.icon }}</mat-icon>
                }
                <span>{{ item.label }}</span>
              </a>
            } @else {
              <span class="breadcrumb-current">
                @if (item.icon) {
                  <mat-icon>{{ item.icon }}</mat-icon>
                }
                {{ item.label }}
              </span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
    styles: [`
    .breadcrumb {
      padding: 12px 0;
      margin-bottom: 16px;
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      flex-wrap: wrap;
      gap: 4px;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1976d2;
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 14px;
      transition: background-color 0.2s ease;
    }

    .breadcrumb-link:hover {
      background-color: rgba(25, 118, 210, 0.08);
      text-decoration: none;
    }

    .breadcrumb-link.home {
      font-weight: 500;
    }

    .breadcrumb-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .separator {
      color: #9e9e9e;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .breadcrumb-current {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #616161;
      font-size: 14px;
      font-weight: 500;
      padding: 6px 10px;
    }

    .breadcrumb-current mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}

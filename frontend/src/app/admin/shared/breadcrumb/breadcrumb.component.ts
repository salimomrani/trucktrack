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
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}

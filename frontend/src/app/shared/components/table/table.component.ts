import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

/**
 * Table Component - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A flexible data table with sorting, custom cell templates, and row actions.
 *
 * @example
 * <app-table
 *   [columns]="columns"
 *   [data]="items()"
 *   [loading]="loading()"
 *   [sortColumn]="sortColumn"
 *   [sortDirection]="sortDirection"
 *   (sort)="onSort($event)"
 *   (rowClick)="onRowClick($event)">
 *   <ng-template #cellTemplate let-row let-column="column">
 *     {{ row[column.key] }}
 *   </ng-template>
 * </app-table>
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent<T = any> {
  /** Column definitions */
  readonly columns = input<TableColumn[]>([]);

  /** Table data */
  readonly data = input<T[]>([]);

  /** Loading state */
  readonly loading = input<boolean>(false);

  /** Current sort column */
  readonly sortColumn = input<string | null>(null);

  /** Current sort direction */
  readonly sortDirection = input<'asc' | 'desc' | null>(null);

  /** Enable row hover effect */
  readonly hoverable = input<boolean>(true);

  /** Enable striped rows */
  readonly striped = input<boolean>(false);

  /** Enable row click */
  readonly clickable = input<boolean>(false);

  /** Empty state message */
  readonly emptyMessage = input<string>('No data available');

  /** Empty state icon */
  readonly emptyIcon = input<string>('inbox');

  /** Sort event */
  readonly sort = output<SortEvent>();

  /** Row click event */
  readonly rowClick = output<T>();

  /** Custom cell template */
  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;

  /** Custom actions template */
  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<any>;

  /**
   * Handle column header click for sorting
   */
  onHeaderClick(column: TableColumn): void {
    if (!column.sortable) return;

    let newDirection: 'asc' | 'desc' | null = 'asc';

    if (this.sortColumn() === column.key) {
      if (this.sortDirection() === 'asc') {
        newDirection = 'desc';
      } else if (this.sortDirection() === 'desc') {
        newDirection = null;
      }
    }

    this.sort.emit({
      column: column.key,
      direction: newDirection
    });
  }

  /**
   * Handle row click
   */
  onRowClick(row: T): void {
    if (this.clickable()) {
      this.rowClick.emit(row);
    }
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: TableColumn): string {
    if (!column.sortable) return '';
    if (this.sortColumn() !== column.key) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  /**
   * Get cell value from row
   */
  getCellValue(row: T, column: TableColumn): any {
    const keys = column.key.split('.');
    let value: any = row;
    for (const key of keys) {
      value = value?.[key];
    }
    return value ?? '-';
  }

  /**
   * Get alignment class for column
   */
  getAlignmentClass(align?: 'left' | 'center' | 'right'): string {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  }

  /**
   * Track function for data rows
   */
  trackByIndex(index: number): number {
    return index;
  }
}

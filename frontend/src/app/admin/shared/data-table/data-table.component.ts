import { Component, input, output, OnInit, OnChanges, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

/**
 * Column definition for DataTable
 */
export interface ColumnDef {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'badge' | 'boolean' | 'actions';
  badgeColors?: { [key: string]: string };
  width?: string;
}

/**
 * Page info emitted on pagination change
 */
export interface PageInfo {
  page: number;
  size: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Reusable DataTable component with pagination, sorting, and search
 * T021: Create reusable DataTableComponent
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-data-table',
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatCheckboxModule
    ],
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T> implements OnInit, OnChanges {
  // Signal inputs
  readonly columns = input<ColumnDef[]>([]);
  readonly data = input<T[]>([]);
  readonly totalElements = input<number>(0);
  readonly pageSize = input<number>(25);
  readonly pageIndex = input<number>(0);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  readonly searchable = input<boolean>(true);
  readonly searchPlaceholder = input<string>('Search...');
  readonly selectable = input<boolean>(false);
  readonly showActions = input<boolean>(true);
  readonly rowClickable = input<boolean>(false);
  readonly noDataMessage = input<string>('No data available');
  readonly isLoading = input<boolean>(false);

  // Signal outputs
  readonly pageChange = output<PageInfo>();
  readonly search = output<string>();
  readonly onEdit = output<T>();
  readonly onDelete = output<T>();
  readonly onRowClick = output<T>();
  readonly selectionChange = output<T[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchValue = '';
  dataSource = new MatTableDataSource<T>();
  selection = new SelectionModel<T>(true, []);

  private currentSort: Sort | null = null;
  private currentPageIndex = 0;
  private currentPageSize = 25;

  displayedColumns = computed(() => {
    const cols = this.selectable() ? ['select'] : [];
    cols.push(...this.columns().map(c => c.key));
    if (this.showActions()) {
      cols.push('actions');
    }
    return cols;
  });

  ngOnInit() {
    this.dataSource.data = this.data();
    this.currentPageIndex = this.pageIndex();
    this.currentPageSize = this.pageSize();

    this.selection.changed.subscribe(() => {
      this.selectionChange.emit(this.selection.selected);
    });
  }

  ngOnChanges() {
    this.dataSource.data = this.data();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  onSort(sort: Sort) {
    this.currentSort = sort;
    this.emitPageChange();
  }

  onPageChange(event: PageEvent) {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.emitPageChange();
  }

  private emitPageChange() {
    this.pageChange.emit({
      page: this.currentPageIndex,
      size: this.currentPageSize,
      sortColumn: this.currentSort?.active,
      sortDirection: this.currentSort?.direction as 'asc' | 'desc'
    });
  }

  getBadgeColor(col: ColumnDef, value: string): string {
    return col.badgeColors?.[value] || '#9e9e9e';
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }
}

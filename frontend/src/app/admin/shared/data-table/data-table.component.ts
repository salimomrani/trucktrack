import { Component, input, output, OnInit, OnChanges, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  readonly searchChange = output<string>();
  readonly editRow = output<T>();
  readonly deleteRow = output<T>();
  readonly rowClicked = output<T>();
  readonly selectionChange = output<T[]>();

  searchValue = '';
  selection = new SelectionModel<T>(true, []);

  currentSortColumn: string | null = null;
  currentSortDirection: 'asc' | 'desc' | '' = '';
  currentPageIndex = 0;
  currentPageSize = 25;

  displayedColumns = computed(() => {
    const cols = this.selectable() ? ['select'] : [];
    cols.push(...this.columns().map(c => c.key));
    if (this.showActions()) {
      cols.push('actions');
    }
    return cols;
  });

  ngOnInit() {
    this.currentPageIndex = this.pageIndex();
    this.currentPageSize = this.pageSize();

    this.selection.changed.subscribe(() => {
      this.selectionChange.emit(this.selection.selected);
    });
  }

  ngOnChanges() {
    // Update local state when inputs change
    this.currentPageIndex = this.pageIndex();
    this.currentPageSize = this.pageSize();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }

  toggleSort(column: string) {
    if (this.currentSortColumn === column) {
      // Cycle: asc -> desc -> none
      if (this.currentSortDirection === 'asc') {
        this.currentSortDirection = 'desc';
      } else if (this.currentSortDirection === 'desc') {
        this.currentSortColumn = null;
        this.currentSortDirection = '';
      } else {
        this.currentSortDirection = 'asc';
      }
    } else {
      this.currentSortColumn = column;
      this.currentSortDirection = 'asc';
    }
    this.emitPageChange();
  }

  onPageSizeChange(size: string) {
    this.currentPageSize = parseInt(size, 10);
    this.currentPageIndex = 0; // Reset to first page
    this.emitPageChange();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.getTotalPages()) return;
    this.currentPageIndex = page;
    this.emitPageChange();
  }

  private emitPageChange() {
    this.pageChange.emit({
      page: this.currentPageIndex,
      size: this.currentPageSize,
      sortColumn: this.currentSortColumn || undefined,
      sortDirection: this.currentSortDirection as 'asc' | 'desc' || undefined
    });
  }

  getBadgeColor(col: ColumnDef, value: string): string {
    return col.badgeColors?.[value] || '#9e9e9e';
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.data().length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data().forEach(row => this.selection.select(row));
    }
  }

  getTotalColumns(): number {
    let count = this.columns().length;
    if (this.selectable()) count++;
    if (this.showActions()) count++;
    return count;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalElements() / this.currentPageSize);
  }

  getPaginationLabel(): string {
    const total = this.totalElements();
    if (total === 0) return '0 of 0';

    const start = this.currentPageIndex * this.currentPageSize + 1;
    const end = Math.min((this.currentPageIndex + 1) * this.currentPageSize, total);
    return `${start}-${end} of ${total}`;
  }
}

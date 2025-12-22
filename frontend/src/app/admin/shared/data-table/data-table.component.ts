import { Component, Input, Output, EventEmitter, OnInit, ViewChild, signal, computed } from '@angular/core';
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
  standalone: true,
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
  template: `
    <div class="data-table-container">
      <!-- Search bar -->
      <div class="table-header" *ngIf="searchable">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input matInput
                 [placeholder]="searchPlaceholder"
                 [(ngModel)]="searchValue"
                 (input)="onSearch($event)"
                 aria-label="Search table">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Loading spinner -->
      <div class="loading-overlay" *ngIf="loading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Table -->
      <div class="table-wrapper" [class.loading]="loading()">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSort($event)">

          <!-- Selection column -->
          <ng-container *ngIf="selectable" matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox (change)="$event ? toggleAllRows() : null"
                            [checked]="selection.hasValue() && isAllSelected()"
                            [indeterminate]="selection.hasValue() && !isAllSelected()"
                            aria-label="Select all rows">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox (click)="$event.stopPropagation()"
                            (change)="$event ? selection.toggle(row) : null"
                            [checked]="selection.isSelected(row)"
                            [aria-label]="'Select row'">
              </mat-checkbox>
            </td>
          </ng-container>

          <!-- Dynamic columns -->
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef
                [mat-sort-header]="col.sortable ? col.key : ''"
                [disabled]="!col.sortable"
                [style.width]="col.width">
              {{ col.header }}
            </th>
            <td mat-cell *matCellDef="let row" [style.width]="col.width">
              <!-- Text -->
              <ng-container *ngIf="col.type === 'text' || !col.type">
                {{ row[col.key] }}
              </ng-container>

              <!-- Date -->
              <ng-container *ngIf="col.type === 'date'">
                {{ row[col.key] | date:'short' }}
              </ng-container>

              <!-- Badge -->
              <ng-container *ngIf="col.type === 'badge'">
                <span class="badge" [style.background-color]="getBadgeColor(col, row[col.key])">
                  {{ row[col.key] }}
                </span>
              </ng-container>

              <!-- Boolean -->
              <ng-container *ngIf="col.type === 'boolean'">
                <mat-icon [class.active]="row[col.key]">
                  {{ row[col.key] ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </ng-container>

              <!-- Actions -->
              <ng-container *ngIf="col.type === 'actions'">
                <ng-content select="[actions]"></ng-content>
              </ng-container>
            </td>
          </ng-container>

          <!-- Actions column -->
          <ng-container *ngIf="showActions" matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="width: 120px">Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button
                      matTooltip="Edit"
                      (click)="onEdit.emit(row)"
                      aria-label="Edit row">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button
                      matTooltip="Delete"
                      (click)="onDelete.emit(row)"
                      aria-label="Delete row">
                <mat-icon color="warn">delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns();"
              (click)="onRowClick.emit(row)"
              [class.clickable]="rowClickable">
          </tr>

          <!-- No data row -->
          <tr class="mat-row no-data" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns().length">
              <div class="no-data-message">
                <mat-icon>inbox</mat-icon>
                <span>{{ noDataMessage }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Paginator -->
      <mat-paginator [length]="totalElements"
                     [pageSize]="pageSize"
                     [pageSizeOptions]="pageSizeOptions"
                     [pageIndex]="pageIndex"
                     (page)="onPageChange($event)"
                     showFirstLastButtons
                     aria-label="Select page">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .data-table-container {
      position: relative;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .table-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .search-field {
      width: 300px;
    }

    .table-wrapper {
      overflow-x: auto;
      transition: opacity 0.2s;
    }

    .table-wrapper.loading {
      opacity: 0.5;
      pointer-events: none;
    }

    .loading-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    table {
      width: 100%;
    }

    tr.clickable {
      cursor: pointer;
    }

    tr.clickable:hover {
      background-color: #f5f5f5;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      color: white;
    }

    mat-icon.active {
      color: #4caf50;
    }

    mat-icon:not(.active) {
      color: #9e9e9e;
    }

    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #9e9e9e;
    }

    .no-data-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class DataTableComponent<T> implements OnInit {
  @Input() columns: ColumnDef[] = [];
  @Input() data: T[] = [];
  @Input() totalElements = 0;
  @Input() pageSize = 25;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() selectable = false;
  @Input() showActions = true;
  @Input() rowClickable = false;
  @Input() noDataMessage = 'No data available';

  @Input() set isLoading(value: boolean) {
    this.loading.set(value);
  }

  @Output() pageChange = new EventEmitter<PageInfo>();
  @Output() search = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<T>();
  @Output() onDelete = new EventEmitter<T>();
  @Output() onRowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(false);
  searchValue = '';
  dataSource = new MatTableDataSource<T>();
  selection = new SelectionModel<T>(true, []);

  private currentSort: Sort | null = null;

  displayedColumns = computed(() => {
    const cols = this.selectable ? ['select'] : [];
    cols.push(...this.columns.map(c => c.key));
    if (this.showActions) {
      cols.push('actions');
    }
    return cols;
  });

  ngOnInit() {
    this.dataSource.data = this.data;

    this.selection.changed.subscribe(() => {
      this.selectionChange.emit(this.selection.selected);
    });
  }

  ngOnChanges() {
    this.dataSource.data = this.data;
  }

  setLoading(value: boolean) {
    this.loading.set(value);
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
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.emitPageChange();
  }

  private emitPageChange() {
    this.pageChange.emit({
      page: this.pageIndex,
      size: this.pageSize,
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

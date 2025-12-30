# Component API Contracts

**Feature**: 020-tailwind-migration
**Date**: 2025-12-30

## Button Component API

```typescript
// button.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  // Inputs
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<'left' | 'right'>('left');
  readonly fullWidth = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  // Outputs
  readonly clicked = output<MouseEvent>();
}
```

**Usage**:
```html
<app-button
  variant="primary"
  size="md"
  [loading]="isSubmitting()"
  (clicked)="onSubmit()">
  Save Changes
</app-button>
```

---

## Input Component API

```typescript
// input.component.ts
import { Component, input, output, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent {
  // Inputs
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel'>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly prefixIcon = input<string | null>(null);
  readonly suffixIcon = input<string | null>(null);

  // Two-way binding
  readonly value = model<string>('');

  // Outputs
  readonly blur = output<FocusEvent>();
}
```

**Usage**:
```html
<app-input
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  [(value)]="email"
  [error]="emailError()"
  prefixIcon="mail">
</app-input>
```

---

## Select Component API

```typescript
// select.component.ts
export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent {
  readonly options = input<SelectOption[]>([]);
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select...');
  readonly multiple = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly value = model<any>(null);
}
```

**Usage**:
```html
<app-select
  label="Select Truck"
  [options]="truckOptions()"
  [(value)]="selectedTruck"
  searchable>
</app-select>
```

---

## Datepicker Component API

```typescript
// datepicker.component.ts
@Component({
  selector: 'app-datepicker',
  standalone: true,
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements AfterViewInit, OnDestroy {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select date');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly dateFormat = input<string>('Y-m-d');
  readonly enableTime = input<boolean>(false);
  readonly mode = input<'single' | 'range' | 'multiple'>('single');
  readonly disabled = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly value = model<Date | Date[] | null>(null);
}
```

**Usage**:
```html
<app-datepicker
  label="Start Date"
  [(value)]="startDate"
  [minDate]="today"
  dateFormat="d/m/Y">
</app-datepicker>
```

---

## Card Component API

```typescript
// card.component.ts
@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly elevated = input<boolean>(true);
  readonly hoverable = input<boolean>(false);
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
}
```

**Usage**:
```html
<app-card title="Truck Details" elevated hoverable>
  <ng-container header>
    <app-button variant="ghost" icon="more_vert"></app-button>
  </ng-container>

  <p>Card content here...</p>

  <ng-container actions>
    <app-button variant="secondary">Cancel</app-button>
    <app-button variant="primary">Save</app-button>
  </ng-container>
</app-card>
```

---

## Table Component API

```typescript
// table.component.ts
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<any>;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent<T> {
  readonly columns = input<TableColumn[]>([]);
  readonly data = input<T[]>([]);
  readonly sortable = input<boolean>(true);
  readonly sortColumn = input<string | null>(null);
  readonly sortDirection = input<'asc' | 'desc'>('asc');
  readonly loading = input<boolean>(false);
  readonly emptyMessage = input<string>('No data available');
  readonly striped = input<boolean>(false);
  readonly hoverable = input<boolean>(true);

  readonly sortChange = output<SortEvent>();
  readonly rowClick = output<T>();
}
```

**Usage**:
```html
<app-table
  [columns]="columns"
  [data]="trucks()"
  [loading]="isLoading()"
  (sortChange)="onSort($event)"
  (rowClick)="onRowClick($event)">

  <ng-template #statusCell let-row>
    <span [class]="getStatusClass(row.status)">{{ row.status }}</span>
  </ng-template>
</app-table>
```

---

## Dialog Service API

```typescript
// dialog.service.ts
export interface DialogConfig {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  data?: any;
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export interface DialogRef<R = any> {
  close(result?: R): void;
  afterClosed(): Observable<R | undefined>;
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  open<T, R = any>(component: ComponentType<T>, config?: DialogConfig): DialogRef<R>;
  confirm(message: string, options?: ConfirmOptions): Observable<boolean>;
  alert(message: string, title?: string): Observable<void>;
}
```

**Usage**:
```typescript
// Open custom dialog
const dialogRef = this.dialogService.open(TruckFormComponent, {
  title: 'Edit Truck',
  size: 'lg',
  data: { truck: this.selectedTruck }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) this.refreshTrucks();
});

// Confirmation dialog
this.dialogService.confirm('Delete this truck?', {
  type: 'danger',
  confirmText: 'Delete'
}).subscribe(confirmed => {
  if (confirmed) this.deleteTruck();
});
```

---

## Toast Service API

```typescript
// toast.service.ts
export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface ToastRef {
  dismiss(): void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string, duration?: number): ToastRef;
  error(message: string, duration?: number): ToastRef;
  warning(message: string, duration?: number): ToastRef;
  info(message: string, duration?: number): ToastRef;
  show(config: ToastConfig): ToastRef;
}
```

**Usage**:
```typescript
// Simple toast
this.toastService.success('Truck saved successfully');

// Toast with action
this.toastService.show({
  message: 'Trip cancelled',
  type: 'warning',
  action: {
    label: 'Undo',
    callback: () => this.undoCancel()
  }
});
```

---

## Pagination Component API

```typescript
// pagination.component.ts
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  readonly totalItems = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly currentPage = input<number>(1);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);
  readonly showPageSize = input<boolean>(true);
  readonly showInfo = input<boolean>(true);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
}
```

**Usage**:
```html
<app-pagination
  [totalItems]="total()"
  [pageSize]="pageSize()"
  [currentPage]="currentPage()"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>
```

import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

/**
 * Pagination Component - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A flexible pagination component with page size options.
 *
 * @example
 * <app-pagination
 *   [totalItems]="100"
 *   [pageSize]="10"
 *   [currentPage]="1"
 *   [pageSizeOptions]="[10, 25, 50]"
 *   (pageChange)="onPageChange($event)">
 * </app-pagination>
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  /** Total number of items */
  readonly totalItems = input<number>(0);

  /** Items per page */
  readonly pageSize = input<number>(10);

  /** Current page (1-indexed) */
  readonly currentPage = input<number>(1);

  /** Page size options */
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  /** Show page size selector */
  readonly showPageSizeSelector = input<boolean>(true);

  /** Show first/last buttons */
  readonly showFirstLastButtons = input<boolean>(true);

  /** Page change event */
  readonly pageChange = output<PageEvent>();

  /** Total number of pages */
  readonly totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  });

  /** Range of items being displayed */
  readonly itemRange = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.totalItems());
    return { start, end };
  });

  /** Array of page numbers to display */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | 'ellipsis')[] = [];

    if (total <= 7) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and surrounding
      pages.push(1);

      if (current > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('ellipsis');
      }

      pages.push(total);
    }

    return pages;
  });

  /** Can navigate to previous page */
  readonly canPrevious = computed(() => this.currentPage() > 1);

  /** Can navigate to next page */
  readonly canNext = computed(() => this.currentPage() < this.totalPages());

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.emitPageChange(page);
  }

  /**
   * Go to first page
   */
  goToFirst(): void {
    if (this.canPrevious()) {
      this.goToPage(1);
    }
  }

  /**
   * Go to last page
   */
  goToLast(): void {
    if (this.canNext()) {
      this.goToPage(this.totalPages());
    }
  }

  /**
   * Go to previous page
   */
  goToPrevious(): void {
    if (this.canPrevious()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Go to next page
   */
  goToNext(): void {
    if (this.canNext()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newPageSize = parseInt(select.value, 10);

    // Calculate new page to keep approximately the same position
    const firstItemIndex = (this.currentPage() - 1) * this.pageSize();
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1;

    this.pageChange.emit({
      pageIndex: newPage - 1,
      pageSize: newPageSize,
      length: this.totalItems()
    });
  }

  /**
   * Emit page change event
   */
  private emitPageChange(page: number): void {
    this.pageChange.emit({
      pageIndex: page - 1,
      pageSize: this.pageSize(),
      length: this.totalItems()
    });
  }

  /**
   * Track function for page numbers
   */
  trackByPage(index: number, item: number | 'ellipsis'): string {
    return item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`;
  }
}

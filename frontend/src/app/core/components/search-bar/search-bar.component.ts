import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreFacade } from '../../../store/store.facade';

/**
 * SearchBarComponent - Search trucks by ID or driver name
 * T102: Create SearchBarComponent with Material Input and signals
 * Features:
 * - Search trucks by truck ID or driver name
 * - Autocomplete dropdown with search results
 * - Debounced search (300ms)
 * - Clear button
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  private readonly facade = inject(StoreFacade);

  // Search query signal
  searchQuery = signal('');

  // Dropdown visibility
  showDropdown = signal(false);

  // Search results from store - filtered by status filters
  // If user deselects "Active" in filters, active trucks won't appear in search results
  searchResults = this.facade.filteredSearchResults;
  isSearching = this.facade.isSearching;

  private searchTimeout: any;

  /**
   * Handle search input change with debouncing
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);

    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search - wait 300ms after user stops typing
    if (query.trim().length >= 2) {
      this.searchTimeout = setTimeout(() => {
        this.facade.searchTrucks(query.trim());
      }, 300);
    } else if (query.trim().length === 0) {
      // Clear search results when query is empty
      this.facade.clearSearch();
    }
  }

  /**
   * Clear search query and results
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.facade.clearSearch();
    this.showDropdown.set(false);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Handle blur event - hide dropdown with delay for click to register
   */
  onBlur(): void {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }

  /**
   * Handle truck selection from autocomplete
   */
  selectTruck(truckId: string): void {
    console.log('Selected truck:', truckId);
    // Dispatch selection to store - MapComponent will react to this
    this.facade.selectTruck(truckId);
    // Clear search after selection
    this.clearSearch();
  }
}

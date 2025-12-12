import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  private readonly facade = inject(StoreFacade);

  // Search query signal
  searchQuery = signal('');

  // Search results from store
  searchResults = this.facade.searchResults;
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

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Handle truck selection from autocomplete
   */
  selectTruck(truckId: string): void {
    console.log('Selected truck:', truckId);
    // TODO: Implement truck selection behavior (zoom on map, show details)
    // For now, just clear the search
    this.clearSearch();
  }
}

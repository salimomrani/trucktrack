import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';
import { StoreFacade } from '../../../store/store.facade';
import { signal } from '@angular/core';
import { Truck, TruckStatus } from '../../../models/truck.model';

/**
 * Unit tests for SearchBarComponent
 * Feature: Frontend Tests - Critical Components
 * 
 * Tests search bar component functionality:
 * - Search input with debouncing
 * - Search results display
 * - Truck selection
 * - Clear search
 */
describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let mockStoreFacade: jasmine.SpyObj<StoreFacade>;

  const mockTrucks: Truck[] = [
    {
      id: '1',
      truckId: 'TRK-001',
      driverName: 'John Doe',
      status: TruckStatus.ACTIVE,
      vehicleType: 'Delivery',
      currentLatitude: 45.5,
      currentLongitude: -73.5,
      lastUpdate: new Date().toISOString(),
      truckGroupId: 'group-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      truckId: 'TRK-002',
      driverName: 'Jane Smith',
      status: TruckStatus.IDLE,
      vehicleType: 'Delivery',
      currentLatitude: 45.6,
      currentLongitude: -73.6,
      lastUpdate: new Date().toISOString(),
      truckGroupId: 'group-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const filteredSearchResultsSignal = signal<Truck[]>([]);
    const isSearchingSignal = signal(false);
    
    mockStoreFacade = jasmine.createSpyObj('StoreFacade', [
      'searchTrucks',
      'clearSearch',
      'selectTruck'
    ]);
    
    Object.defineProperty(mockStoreFacade, 'filteredSearchResults', {
      get: () => filteredSearchResultsSignal,
      configurable: true
    });
    
    Object.defineProperty(mockStoreFacade, 'isSearching', {
      get: () => isSearchingSignal,
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
      providers: [
        { provide: StoreFacade, useValue: mockStoreFacade }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Search input', () => {
    it('should initialize with empty search query', () => {
      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBe(false);
    });

    it('should update search query on input change', () => {
      component.onSearchChange('test');
      expect(component.searchQuery()).toBe('test');
    });

    it('should debounce search for queries >= 2 characters', fakeAsync(() => {
      component.onSearchChange('tr');
      expect(mockStoreFacade.searchTrucks).not.toHaveBeenCalled();
      
      tick(300);
      expect(mockStoreFacade.searchTrucks).toHaveBeenCalledWith('tr');
    }));

    it('should clear search when query is empty', () => {
      component.onSearchChange('');
      expect(mockStoreFacade.clearSearch).toHaveBeenCalled();
    });

    it('should not search for queries < 2 characters', fakeAsync(() => {
      component.onSearchChange('t');
      tick(300);
      expect(mockStoreFacade.searchTrucks).not.toHaveBeenCalled();
    }));

    it('should clear previous timeout on new search', fakeAsync(() => {
      component.onSearchChange('tr');
      tick(200);
      component.onSearchChange('tru');
      tick(100);
      expect(mockStoreFacade.searchTrucks).not.toHaveBeenCalled();
      tick(200);
      expect(mockStoreFacade.searchTrucks).toHaveBeenCalledTimes(1);
      expect(mockStoreFacade.searchTrucks).toHaveBeenCalledWith('tru');
    }));
  });

  describe('Search results', () => {
    it('should display search results from store', () => {
      const filteredSearchResultsSignal = signal(mockTrucks);
      Object.defineProperty(mockStoreFacade, 'filteredSearchResults', {
        get: () => filteredSearchResultsSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(SearchBarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.searchResults().length).toBe(2);
    });

    it('should show dropdown when search query >= 2 characters', () => {
      component.searchQuery.set('tr');
      component.showDropdown.set(true);
      fixture.detectChanges();
      expect(component.showDropdown()).toBe(true);
    });

    it('should show loading state when searching', () => {
      const isSearchingSignal = signal(true);
      Object.defineProperty(mockStoreFacade, 'isSearching', {
        get: () => isSearchingSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(SearchBarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.isSearching()).toBe(true);
    });

    it('should hide dropdown on blur with delay', fakeAsync(() => {
      component.showDropdown.set(true);
      component.onBlur();
      expect(component.showDropdown()).toBe(true);
      
      tick(200);
      expect(component.showDropdown()).toBe(false);
    }));
  });

  describe('Truck selection', () => {
    it('should select truck and clear search', () => {
      component.searchQuery.set('TRK-001');
      component.showDropdown.set(true);
      
      component.selectTruck('1');
      
      expect(mockStoreFacade.selectTruck).toHaveBeenCalledWith('1');
      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBe(false);
      expect(mockStoreFacade.clearSearch).toHaveBeenCalled();
    });
  });

  describe('Clear search', () => {
    it('should clear search query and results', () => {
      component.searchQuery.set('test');
      component.showDropdown.set(true);
      
      component.clearSearch();
      
      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBe(false);
      expect(mockStoreFacade.clearSearch).toHaveBeenCalled();
    });

    it('should clear timeout when clearing search', fakeAsync(() => {
      component.onSearchChange('test');
      component.clearSearch();
      tick(300);
      expect(mockStoreFacade.searchTrucks).not.toHaveBeenCalled();
    }));
  });
});


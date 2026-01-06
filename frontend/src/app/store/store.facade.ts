import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, race, filter, map, take } from 'rxjs';
import { AppState } from './index';
import * as AuthSelectors from './auth/auth.selectors';
import * as TrucksSelectors from './trucks/trucks.selectors';
import * as GpsSelectors from './gps/gps.selectors';
import * as HistorySelectors from './history/history.selectors';
import * as CacheSelectors from './cache/cache.selectors';
import * as NotificationsSelectors from './notifications/notifications.selectors';
import * as TripsSelectors from './trips/trips.selectors';
import * as LanguageSelectors from './language/language.selectors';
import * as AuthActions from './auth/auth.actions';
import * as TrucksActions from './trucks/trucks.actions';
import * as GpsActions from './gps/gps.actions';
import * as HistoryActions from './history/history.actions';
import * as CacheActions from './cache/cache.actions';
import * as NotificationsActions from './notifications/notifications.actions';
import * as TripsActions from './trips/trips.actions';
import * as LanguageActions from './language/language.actions';
import { LoginRequest } from '../core/models/auth.model';
import { GPSPositionEvent } from '../models/gps-position.model';
import { TruckStatus } from '../models/truck.model';
import { TripStatus, CreateTripRequest, UpdateTripRequest, AssignTripRequest } from '../admin/trips/trip.model';
import { SupportedLanguage } from './language/language.state';

/**
 * Store Facade with Signals Integration
 * Provides a clean API to interact with NgRx store using Angular 17+ signals
 */
@Injectable({
  providedIn: 'root'
})
export class StoreFacade {
  private store = inject(Store<AppState>);
  private actions$ = inject(Actions);

  // Auth Signals
  readonly currentUser = toSignal(this.store.select(AuthSelectors.selectCurrentUser));
  readonly isAuthenticated = toSignal(this.store.select(AuthSelectors.selectIsAuthenticated), {
    initialValue: false
  });
  readonly authLoading = toSignal(this.store.select(AuthSelectors.selectAuthLoading), {
    initialValue: false
  });
  readonly authError = toSignal(this.store.select(AuthSelectors.selectAuthError));

  // Trucks Signals
  readonly trucks = toSignal(this.store.select(TrucksSelectors.selectAllTrucks), {
    initialValue: []
  });
  readonly selectedTruck = toSignal(this.store.select(TrucksSelectors.selectSelectedTruck));
  readonly trucksLoading = toSignal(this.store.select(TrucksSelectors.selectTrucksLoading), {
    initialValue: false
  });
  readonly searchResults = toSignal(this.store.select(TrucksSelectors.selectSearchResults), {
    initialValue: []
  });
  // Filtered search results - respects status filters
  readonly filteredSearchResults = toSignal(this.store.select(TrucksSelectors.selectFilteredSearchResults), {
    initialValue: []
  });
  readonly isSearching = toSignal(this.store.select(TrucksSelectors.selectIsSearching), {
    initialValue: false
  });

  // T106: Status Filter Signals for US2
  readonly statusFilters = toSignal(this.store.select(TrucksSelectors.selectStatusFilters), {
    initialValue: [TruckStatus.ACTIVE, TruckStatus.IDLE, TruckStatus.OFFLINE]
  });
  readonly filteredTrucks = toSignal(this.store.select(TrucksSelectors.selectFilteredTrucks), {
    initialValue: []
  });
  readonly hasActiveFilters = toSignal(this.store.select(TrucksSelectors.selectHasActiveFilters), {
    initialValue: false
  });

  // GPS Signals
  readonly latestPosition = toSignal(this.store.select(GpsSelectors.selectLatestPosition));
  readonly allPositions = toSignal(this.store.select(GpsSelectors.selectAllPositions), {
    initialValue: {}
  });

  // History Signals
  readonly historyEntries = toSignal(this.store.select(HistorySelectors.selectHistoryEntries), {
    initialValue: []
  });
  readonly historyLoading = toSignal(this.store.select(HistorySelectors.selectHistoryLoading), {
    initialValue: false
  });
  readonly historyError = toSignal(this.store.select(HistorySelectors.selectHistoryError));

  // History Pagination Signals (for infinite scroll)
  readonly historyCurrentPage = toSignal(this.store.select(HistorySelectors.selectHistoryCurrentPage), {
    initialValue: 0
  });
  readonly historyTotalElements = toSignal(this.store.select(HistorySelectors.selectHistoryTotalElements), {
    initialValue: 0
  });
  readonly historyHasMorePages = toSignal(this.store.select(HistorySelectors.selectHistoryHasMorePages), {
    initialValue: true
  });
  readonly historyLoadingMore = toSignal(this.store.select(HistorySelectors.selectHistoryLoadingMore), {
    initialValue: false
  });

  // Cache Signals
  readonly trucksCacheState = toSignal(this.store.select(CacheSelectors.selectTrucksCacheState));
  readonly driversCacheState = toSignal(this.store.select(CacheSelectors.selectDriversCacheState));
  readonly groupsCacheState = toSignal(this.store.select(CacheSelectors.selectGroupsCacheState));
  readonly isTrucksCacheStale = toSignal(this.store.select(CacheSelectors.selectIsTrucksCacheStale), {
    initialValue: true
  });
  readonly shouldRefreshTrucks = toSignal(this.store.select(CacheSelectors.selectShouldRefreshTrucks), {
    initialValue: true
  });
  readonly isAnyCacheLoading = toSignal(this.store.select(CacheSelectors.selectIsAnyCacheLoading), {
    initialValue: false
  });

  // T034-T037: Memoized truck selectors for US4
  readonly activeTrucks = toSignal(this.store.select(TrucksSelectors.selectActiveTrucks), {
    initialValue: []
  });
  readonly truckCountsByStatus = toSignal(this.store.select(TrucksSelectors.selectTruckCountsByStatus));
  readonly onlineTruckCount = toSignal(this.store.select(TrucksSelectors.selectOnlineTruckCount), {
    initialValue: 0
  });
  readonly onlineTruckPercentage = toSignal(this.store.select(TrucksSelectors.selectOnlineTruckPercentage), {
    initialValue: 0
  });

  // T038: Dashboard cache stats for US4
  readonly dashboardCacheStats = toSignal(this.store.select(CacheSelectors.selectDashboardCacheStats));
  readonly trucksCacheAge = toSignal(this.store.select(CacheSelectors.selectTrucksCacheAge), {
    initialValue: 'Never'
  });
  readonly allCachesFresh = toSignal(this.store.select(CacheSelectors.selectAllCachesFresh), {
    initialValue: false
  });

  // Notifications Signals
  readonly notifications = toSignal(this.store.select(NotificationsSelectors.selectAllNotifications), {
    initialValue: []
  });
  readonly unreadCount = toSignal(this.store.select(NotificationsSelectors.selectUnreadCount), {
    initialValue: 0
  });
  readonly notificationsLoading = toSignal(this.store.select(NotificationsSelectors.selectNotificationsLoading), {
    initialValue: false
  });
  readonly notificationsError = toSignal(this.store.select(NotificationsSelectors.selectNotificationsError));
  readonly wsConnected = toSignal(this.store.select(NotificationsSelectors.selectWsConnected), {
    initialValue: false
  });
  readonly markingAsReadId = toSignal(this.store.select(NotificationsSelectors.selectMarkingAsReadId));
  readonly markingAllAsRead = toSignal(this.store.select(NotificationsSelectors.selectMarkingAllAsRead), {
    initialValue: false
  });
  readonly unreadNotifications = toSignal(this.store.select(NotificationsSelectors.selectUnreadNotifications), {
    initialValue: []
  });
  readonly hasUnreadNotifications = toSignal(this.store.select(NotificationsSelectors.selectHasUnreadNotifications), {
    initialValue: false
  });

  // Pagination Signals (for Alerts page)
  readonly currentPage = toSignal(this.store.select(NotificationsSelectors.selectCurrentPage), {
    initialValue: 0
  });
  readonly totalElements = toSignal(this.store.select(NotificationsSelectors.selectTotalElements), {
    initialValue: 0
  });
  readonly hasMorePages = toSignal(this.store.select(NotificationsSelectors.selectHasMorePages), {
    initialValue: true
  });
  readonly loadingMore = toSignal(this.store.select(NotificationsSelectors.selectLoadingMore), {
    initialValue: false
  });

  // Computed Signals
  readonly trucksCount = computed(() => this.trucks().length);
  readonly hasActiveTrucks = computed(() => this.trucksCount() > 0);
  readonly userEmail = computed(() => this.currentUser()?.email);

  // Auth Actions
  login(credentials: LoginRequest) {
    this.store.dispatch(AuthActions.login({ credentials }));
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  loadUser() {
    this.store.dispatch(AuthActions.loadUser());
  }

  checkAuthStatus() {
    this.store.dispatch(AuthActions.checkAuthStatus());
  }

  /**
   * Refresh access token
   * Returns an Observable that completes when refresh succeeds or errors when it fails
   */
  refreshToken(): Observable<void> {
    // Dispatch refresh action
    this.store.dispatch(AuthActions.refreshToken());

    // Wait for either success or failure
    return race([
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenSuccess),
        take(1),
        map(() => undefined)
      ),
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        take(1),
        map((action) => {
          throw new Error(action.error);
        })
      )
    ]);
  }

  // Trucks Actions
  loadTrucks() {
    this.store.dispatch(TrucksActions.loadTrucks());
  }

  selectTruck(truckId: string) {
    this.store.dispatch(TrucksActions.selectTruck({ truckId }));
  }

  deselectTruck() {
    this.store.dispatch(TrucksActions.deselectTruck());
  }

  updateTruckPosition(truckId: string, latitude: number, longitude: number, speed: number, heading: number) {
    this.store.dispatch(TrucksActions.updateTruckPosition({ truckId, latitude, longitude, speed, heading }));
  }

  searchTrucks(query: string) {
    this.store.dispatch(TrucksActions.searchTrucks({ query }));
  }

  clearSearch() {
    this.store.dispatch(TrucksActions.clearSearch());
  }

  // T106: Status Filter Actions for US2
  setStatusFilters(statuses: TruckStatus[]) {
    this.store.dispatch(TrucksActions.setStatusFilters({ statuses }));
  }

  clearStatusFilters() {
    this.store.dispatch(TrucksActions.clearStatusFilters());
  }

  // GPS Actions
  addGpsPosition(position: GPSPositionEvent) {
    this.store.dispatch(GpsActions.addGpsPosition({ position }));
  }

  clearGpsPositions() {
    this.store.dispatch(GpsActions.clearGpsPositions());
  }

  // Helper to get position for specific truck
  getTruckPosition(truckId: string) {
    return toSignal(this.store.select(GpsSelectors.selectTruckPosition(truckId)));
  }

  // History Actions
  loadHistory(startTime: string, endTime: string, truckId?: string | null) {
    this.store.dispatch(HistoryActions.loadHistory({ startTime, endTime, truckId }));
  }

  clearHistory() {
    this.store.dispatch(HistoryActions.clearHistory());
  }

  // Helper to get history for specific truck
  getHistoryByTruckId(truckId: string) {
    return toSignal(this.store.select(HistorySelectors.selectHistoryByTruckId(truckId)));
  }

  // History Pagination Actions (for infinite scroll)

  /**
   * Load first page of history (paginated)
   */
  loadHistoryPaged(startTime: string, endTime: string, truckId?: string | null, size: number = 50) {
    this.store.dispatch(HistoryActions.loadHistoryPaged({ startTime, endTime, truckId, size }));
  }

  /**
   * Load more history (infinite scroll)
   */
  loadMoreHistory() {
    this.store.dispatch(HistoryActions.loadMoreHistory());
  }

  // T036: Helper to get truck by ID using memoized selector
  getTruckById(truckId: string) {
    return toSignal(this.store.select(TrucksSelectors.selectTruckById(truckId)));
  }

  // T037: Helper to get trucks by group ID using memoized selector
  getTrucksByGroup(groupId: string) {
    return toSignal(this.store.select(TrucksSelectors.selectTrucksByGroup(groupId)));
  }

  // Cache Actions

  /**
   * Check trucks cache and trigger refresh if stale.
   * Uses stale-while-revalidate pattern - existing data shown while refreshing.
   */
  checkTrucksCache() {
    this.store.dispatch(CacheActions.checkTrucksCache());
  }

  /**
   * Check drivers cache and trigger refresh if stale.
   */
  checkDriversCache() {
    this.store.dispatch(CacheActions.checkDriversCache());
  }

  /**
   * Check groups cache and trigger refresh if stale.
   */
  checkGroupsCache() {
    this.store.dispatch(CacheActions.checkGroupsCache());
  }

  /**
   * Invalidate trucks cache (force refresh on next access).
   */
  invalidateTrucksCache() {
    this.store.dispatch(CacheActions.invalidateTrucksCache());
  }

  /**
   * Clear all caches (called on logout).
   */
  clearAllCaches() {
    this.store.dispatch(CacheActions.clearAllCaches());
  }

  /**
   * Load trucks with cache awareness.
   * If cache is fresh, no API call is made.
   * If cache is stale, shows existing data while refreshing in background.
   */
  loadTrucksWithCache() {
    this.checkTrucksCache();
  }

  // Notifications Actions

  /**
   * Load unread notifications from API
   */
  loadUnreadNotifications() {
    this.store.dispatch(NotificationsActions.loadUnreadNotifications());
  }

  /**
   * Load unread count from API
   */
  loadUnreadCount() {
    this.store.dispatch(NotificationsActions.loadUnreadCount());
  }

  /**
   * Mark a single notification as read
   */
  markNotificationAsRead(notificationId: string) {
    this.store.dispatch(NotificationsActions.markAsRead({ notificationId }));
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead() {
    this.store.dispatch(NotificationsActions.markAllAsRead());
  }

  /**
   * Connect to notifications WebSocket
   */
  connectNotificationsWebSocket() {
    this.store.dispatch(NotificationsActions.connectWebSocket());
  }

  /**
   * Disconnect from notifications WebSocket
   */
  disconnectNotificationsWebSocket() {
    this.store.dispatch(NotificationsActions.disconnectWebSocket());
  }

  /**
   * Get notification by ID (parameterized selector)
   */
  getNotificationById(notificationId: string) {
    return toSignal(this.store.select(NotificationsSelectors.selectNotificationById(notificationId)));
  }

  /**
   * Decrement unread count (when component handles API call directly)
   */
  decrementUnreadCount() {
    this.store.dispatch(NotificationsActions.decrementUnreadCount());
  }

  /**
   * Reset unread count to zero (when component handles API call directly)
   */
  resetUnreadCount() {
    this.store.dispatch(NotificationsActions.resetUnreadCount());
  }

  // Pagination Actions (for Alerts page)

  /**
   * Load first page of notifications (paginated)
   */
  loadNotificationsPaged(page: number = 0, size: number = 20) {
    this.store.dispatch(NotificationsActions.loadNotificationsPaged({ page, size }));
  }

  /**
   * Load more notifications (infinite scroll)
   */
  loadMoreNotifications(page: number, size: number = 20) {
    this.store.dispatch(NotificationsActions.loadMoreNotifications({ page, size }));
  }

  /**
   * Reset pagination state
   */
  resetPagination() {
    this.store.dispatch(NotificationsActions.resetPagination());
  }

  // ============================================
  // Trips Signals
  // ============================================

  // Entity Signals
  readonly trips = toSignal(this.store.select(TripsSelectors.selectAllTrips), {
    initialValue: []
  });
  readonly selectedTrip = toSignal(this.store.select(TripsSelectors.selectSelectedTrip));
  readonly tripEntities = toSignal(this.store.select(TripsSelectors.selectTripEntities));

  // Loading Signals
  readonly tripsLoading = toSignal(this.store.select(TripsSelectors.selectTripsLoading), {
    initialValue: false
  });
  readonly tripLoading = toSignal(this.store.select(TripsSelectors.selectTripLoading), {
    initialValue: false
  });
  readonly tripsSaving = toSignal(this.store.select(TripsSelectors.selectTripsSaving), {
    initialValue: false
  });
  readonly tripsError = toSignal(this.store.select(TripsSelectors.selectTripsError));

  // Pagination Signals
  readonly tripsCurrentPage = toSignal(this.store.select(TripsSelectors.selectCurrentPage), {
    initialValue: 0
  });
  readonly tripsPageSize = toSignal(this.store.select(TripsSelectors.selectPageSize), {
    initialValue: 10
  });
  readonly tripsTotalElements = toSignal(this.store.select(TripsSelectors.selectTotalElements), {
    initialValue: 0
  });
  readonly tripsTotalPages = toSignal(this.store.select(TripsSelectors.selectTotalPages), {
    initialValue: 0
  });
  readonly tripsPagination = toSignal(this.store.select(TripsSelectors.selectPagination));

  // Filter Signals
  readonly tripsStatusFilter = toSignal(this.store.select(TripsSelectors.selectStatusFilter));
  readonly tripsSearchQuery = toSignal(this.store.select(TripsSelectors.selectSearchQuery));
  readonly tripsDriverIdFilter = toSignal(this.store.select(TripsSelectors.selectDriverIdFilter));
  readonly tripsTruckIdFilter = toSignal(this.store.select(TripsSelectors.selectTruckIdFilter));
  readonly tripsStartDateFilter = toSignal(this.store.select(TripsSelectors.selectStartDateFilter));
  readonly tripsEndDateFilter = toSignal(this.store.select(TripsSelectors.selectEndDateFilter));
  readonly tripsHasActiveFilters = toSignal(this.store.select(TripsSelectors.selectHasActiveFilters), {
    initialValue: false
  });

  // Status-based Signals
  readonly pendingTrips = toSignal(this.store.select(TripsSelectors.selectPendingTrips), {
    initialValue: []
  });
  readonly assignedTrips = toSignal(this.store.select(TripsSelectors.selectAssignedTrips), {
    initialValue: []
  });
  readonly inProgressTrips = toSignal(this.store.select(TripsSelectors.selectInProgressTrips), {
    initialValue: []
  });
  readonly completedTrips = toSignal(this.store.select(TripsSelectors.selectCompletedTrips), {
    initialValue: []
  });
  readonly cancelledTrips = toSignal(this.store.select(TripsSelectors.selectCancelledTrips), {
    initialValue: []
  });
  readonly activeTrips = toSignal(this.store.select(TripsSelectors.selectActiveTrips), {
    initialValue: []
  });

  // Stats & Analytics Signals
  readonly tripStats = toSignal(this.store.select(TripsSelectors.selectStats));
  readonly tripAnalytics = toSignal(this.store.select(TripsSelectors.selectAnalytics));
  readonly tripHistory = toSignal(this.store.select(TripsSelectors.selectTripHistory), {
    initialValue: []
  });
  readonly tripCompletionRate = toSignal(this.store.select(TripsSelectors.selectCompletionRate), {
    initialValue: 0
  });
  readonly tripsToday = toSignal(this.store.select(TripsSelectors.selectTripsToday), {
    initialValue: 0
  });

  // View Model Signals (for components)
  readonly tripsListViewModel = toSignal(this.store.select(TripsSelectors.selectTripsListViewModel));
  readonly tripDetailViewModel = toSignal(this.store.select(TripsSelectors.selectTripDetailViewModel));
  readonly tripStatsViewModel = toSignal(this.store.select(TripsSelectors.selectTripStatsViewModel));

  // ============================================
  // Trips Actions
  // ============================================

  /**
   * Load trips with optional filters
   */
  loadTrips(params?: {
    page?: number;
    size?: number;
    status?: TripStatus | null;
    search?: string;
    driverId?: string | null;
    truckId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }) {
    this.store.dispatch(TripsActions.loadTrips(params || {}));
  }

  /**
   * Load single trip by ID
   */
  loadTrip(id: string) {
    this.store.dispatch(TripsActions.loadTrip({ id }));
  }

  /**
   * Create a new trip
   */
  createTrip(request: CreateTripRequest) {
    this.store.dispatch(TripsActions.createTrip({ request }));
  }

  /**
   * Update an existing trip
   */
  updateTrip(id: string, request: UpdateTripRequest) {
    this.store.dispatch(TripsActions.updateTrip({ id, request }));
  }

  /**
   * Assign a trip to a truck/driver
   */
  assignTrip(id: string, request: AssignTripRequest) {
    this.store.dispatch(TripsActions.assignTrip({ id, request }));
  }

  /**
   * Reassign a trip to a different truck/driver
   */
  reassignTrip(id: string, request: AssignTripRequest) {
    this.store.dispatch(TripsActions.reassignTrip({ id, request }));
  }

  /**
   * Cancel a trip
   */
  cancelTrip(id: string, reason?: string) {
    this.store.dispatch(TripsActions.cancelTrip({ id, reason }));
  }

  /**
   * Load trip status history
   */
  loadTripHistory(tripId: string) {
    this.store.dispatch(TripsActions.loadTripHistory({ tripId }));
  }

  /**
   * Load trip analytics
   */
  loadTripAnalytics() {
    this.store.dispatch(TripsActions.loadAnalytics());
  }

  /**
   * Load trip stats (counts by status)
   */
  loadTripStats() {
    this.store.dispatch(TripsActions.loadStats());
  }

  /**
   * Select a trip
   */
  selectTrip(tripId: string) {
    this.store.dispatch(TripsActions.selectTrip({ tripId }));
  }

  /**
   * Clear trip selection
   */
  clearTripSelection() {
    this.store.dispatch(TripsActions.clearSelection());
  }

  /**
   * Set status filter
   */
  setTripsStatusFilter(status: TripStatus | null) {
    this.store.dispatch(TripsActions.setStatusFilter({ status }));
  }

  /**
   * Set search query
   */
  setTripsSearchQuery(query: string) {
    this.store.dispatch(TripsActions.setSearchQuery({ query }));
  }

  /**
   * Set driver filter
   */
  setTripsDriverFilter(driverId: string | null) {
    this.store.dispatch(TripsActions.setDriverFilter({ driverId }));
  }

  /**
   * Set truck filter
   */
  setTripsTruckFilter(truckId: string | null) {
    this.store.dispatch(TripsActions.setTruckFilter({ truckId }));
  }

  /**
   * Set date filter
   */
  setTripsDateFilter(startDate: string | null, endDate: string | null) {
    this.store.dispatch(TripsActions.setDateFilter({ startDate, endDate }));
  }

  /**
   * Clear all filters
   */
  clearTripsFilters() {
    this.store.dispatch(TripsActions.clearFilters());
  }

  /**
   * Get trip by ID using parameterized selector
   */
  getTripById(tripId: string) {
    return toSignal(this.store.select(TripsSelectors.selectTripById(tripId)));
  }

  /**
   * Get trips by status using parameterized selector
   */
  getTripsByStatus(status: TripStatus) {
    return toSignal(this.store.select(TripsSelectors.selectTripsByStatus(status)));
  }

  // ============================================
  // Language Signals (i18n)
  // ============================================

  /** Current language code (fr/en) */
  readonly currentLanguage = toSignal(this.store.select(LanguageSelectors.selectCurrentLanguage), {
    initialValue: 'fr' as SupportedLanguage
  });

  /** Current language display name */
  readonly currentLanguageName = toSignal(this.store.select(LanguageSelectors.selectCurrentLanguageName), {
    initialValue: 'Français'
  });

  /** Whether language is initialized */
  readonly languageInitialized = toSignal(this.store.select(LanguageSelectors.selectLanguageInitialized), {
    initialValue: false
  });

  /** Supported languages list */
  readonly supportedLanguages = toSignal(this.store.select(LanguageSelectors.selectSupportedLanguages), {
    initialValue: ['fr', 'en'] as readonly SupportedLanguage[]
  });

  /** Language names map */
  readonly languageNames = toSignal(this.store.select(LanguageSelectors.selectLanguageNames));

  /** Other languages (excluding current) */
  readonly otherLanguages = toSignal(this.store.select(LanguageSelectors.selectOtherLanguages), {
    initialValue: [] as SupportedLanguage[]
  });

  /** Language dropdown view model (for UI component) */
  readonly languageDropdownViewModel = toSignal(this.store.select(LanguageSelectors.selectLanguageDropdownViewModel));

  // ============================================
  // Language Actions
  // ============================================

  /**
   * Initialize language from localStorage or default
   * Should be called once at app startup
   */
  initLanguage() {
    this.store.dispatch(LanguageActions.initLanguage());
  }

  /**
   * Set language and persist to localStorage
   */
  setLanguage(language: SupportedLanguage) {
    this.store.dispatch(LanguageActions.setLanguage({ language }));
  }
}

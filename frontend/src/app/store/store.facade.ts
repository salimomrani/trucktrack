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
import * as AuthActions from './auth/auth.actions';
import * as TrucksActions from './trucks/trucks.actions';
import * as GpsActions from './gps/gps.actions';
import * as HistoryActions from './history/history.actions';
import * as CacheActions from './cache/cache.actions';
import * as NotificationsActions from './notifications/notifications.actions';
import { LoginRequest } from '../core/models/auth.model';
import { GPSPositionEvent } from '../models/gps-position.model';
import { TruckStatus } from '../models/truck.model';

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
}

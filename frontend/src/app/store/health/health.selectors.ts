import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HealthState, OverallHealthStatus } from './health.state';

// Feature selector
export const selectHealthState = createFeatureSelector<HealthState>('health');

// ============================================
// Basic Selectors
// ============================================

/** Select overall status */
export const selectOverallStatus = createSelector(
  selectHealthState,
  (state) => state?.status ?? 'UNKNOWN'
);

/** Select all services */
export const selectServices = createSelector(
  selectHealthState,
  (state) => state?.services ?? []
);

/** Select last checked timestamp */
export const selectLastChecked = createSelector(
  selectHealthState,
  (state) => state?.lastChecked ?? null
);

/** Select loading state */
export const selectHealthLoading = createSelector(
  selectHealthState,
  (state) => state?.loading ?? false
);

/** Select error */
export const selectHealthError = createSelector(
  selectHealthState,
  (state) => state?.error ?? null
);

/** Select monitoring active state */
export const selectMonitoringActive = createSelector(
  selectHealthState,
  (state) => state?.monitoringActive ?? false
);

/** Select previous status */
export const selectPreviousStatus = createSelector(
  selectHealthState,
  (state) => state?.previousStatus ?? null
);

/** Select changed services */
export const selectChangedServices = createSelector(
  selectHealthState,
  (state) => state?.changedServices ?? []
);

// ============================================
// Computed Selectors
// ============================================

/** Select critical services only */
export const selectCriticalServices = createSelector(
  selectServices,
  (services) => services.filter(s => s.critical)
);

/** Select non-critical services */
export const selectNonCriticalServices = createSelector(
  selectServices,
  (services) => services.filter(s => !s.critical)
);

/** Select services that are down */
export const selectDownServices = createSelector(
  selectServices,
  (services) => services.filter(s => s.status === 'DOWN')
);

/** Select services that are up */
export const selectUpServices = createSelector(
  selectServices,
  (services) => services.filter(s => s.status === 'UP')
);

/** Select count of down services */
export const selectDownServicesCount = createSelector(
  selectDownServices,
  (services) => services.length
);

/** Check if any critical service is down */
export const selectAnyCriticalDown = createSelector(
  selectCriticalServices,
  (services) => services.some(s => s.status === 'DOWN')
);

/** Check if all services are up */
export const selectAllServicesUp = createSelector(
  selectServices,
  (services) => services.length > 0 && services.every(s => s.status === 'UP')
);

/** Select time since last check (human readable) */
export const selectTimeSinceLastCheck = createSelector(
  selectLastChecked,
  (lastChecked) => {
    if (!lastChecked) return null;
    const now = new Date();
    const checked = new Date(lastChecked);
    const diffMs = now.getTime() - checked.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    return `${Math.floor(diffSec / 3600)}h`;
  }
);

/** Select whether status changed from previous check */
export const selectStatusChanged = createSelector(
  selectOverallStatus,
  selectPreviousStatus,
  (current, previous) => previous !== null && previous !== current
);

// ============================================
// View Model Selectors (for StatusIndicatorComponent)
// ============================================

export interface StatusIndicatorViewModel {
  status: OverallHealthStatus;
  services: Array<{
    name: string;
    displayName: string;
    status: 'UP' | 'DOWN';
    responseTimeMs: number | null;
    critical: boolean;
  }>;
  lastChecked: string | null;
  loading: boolean;
  downCount: number;
  totalCount: number;
}

export const selectStatusIndicatorViewModel = createSelector(
  selectOverallStatus,
  selectServices,
  selectLastChecked,
  selectHealthLoading,
  selectDownServicesCount,
  (status, services, lastChecked, loading, downCount): StatusIndicatorViewModel => ({
    status,
    services: services.map(s => ({
      name: s.name,
      displayName: s.displayName,
      status: s.status,
      responseTimeMs: s.responseTimeMs,
      critical: s.critical
    })),
    lastChecked,
    loading,
    downCount,
    totalCount: services.length
  })
);

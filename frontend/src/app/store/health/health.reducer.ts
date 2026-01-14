import { createReducer, on } from '@ngrx/store';
import { HealthState, initialHealthState, OverallHealthStatus } from './health.state';
import * as HealthActions from './health.actions';

/**
 * Health reducer
 */
export const healthReducer = createReducer(
  initialHealthState,

  // Check Health
  on(HealthActions.checkHealth, (state): HealthState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(HealthActions.checkHealthSuccess, (state, { health }): HealthState => {
    // Detect services that changed status
    const changedServices: string[] = [];
    health.services.forEach(newService => {
      const oldService = state.services.find(s => s.name === newService.name);
      if (oldService && oldService.status !== newService.status) {
        changedServices.push(newService.name);
      }
    });

    return {
      ...state,
      status: health.status as OverallHealthStatus,
      services: health.services,
      lastChecked: health.timestamp,
      loading: false,
      error: null,
      previousStatus: state.status,
      changedServices
    };
  }),

  on(HealthActions.checkHealthFailure, (state, { error }): HealthState => ({
    ...state,
    status: 'DOWN',
    loading: false,
    error,
    previousStatus: state.status
  })),

  // Monitoring
  on(HealthActions.startMonitoring, (state): HealthState => ({
    ...state,
    monitoringActive: true
  })),

  on(HealthActions.stopMonitoring, (state): HealthState => ({
    ...state,
    monitoringActive: false
  }))
);

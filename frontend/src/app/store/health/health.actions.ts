import { createAction, props } from '@ngrx/store';
import { HealthAggregate, ServiceHealth } from '../../core/services/health.service';

// ============================================
// Health Check Actions
// ============================================

/** Trigger a health check */
export const checkHealth = createAction(
  '[Health] Check Health'
);

/** Health check completed successfully */
export const checkHealthSuccess = createAction(
  '[Health] Check Health Success',
  props<{ health: HealthAggregate }>()
);

/** Health check failed */
export const checkHealthFailure = createAction(
  '[Health] Check Health Failure',
  props<{ error: string }>()
);

// ============================================
// Monitoring Actions
// ============================================

/** Start health monitoring (polling) */
export const startMonitoring = createAction(
  '[Health] Start Monitoring'
);

/** Stop health monitoring */
export const stopMonitoring = createAction(
  '[Health] Stop Monitoring'
);

// ============================================
// Status Change Actions
// ============================================

/** Service status changed (triggers toast notification) */
export const serviceStatusChanged = createAction(
  '[Health] Service Status Changed',
  props<{ serviceName: string; displayName: string; newStatus: 'UP' | 'DOWN' }>()
);

/** Overall status changed */
export const overallStatusChanged = createAction(
  '[Health] Overall Status Changed',
  props<{ previousStatus: 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'; newStatus: 'UP' | 'DEGRADED' | 'DOWN' }>()
);

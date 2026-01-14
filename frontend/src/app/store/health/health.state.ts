import { ServiceHealth, HealthAggregate } from '../../core/services/health.service';

/**
 * Overall health status enum
 */
export type OverallHealthStatus = 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

/**
 * Health state interface
 */
export interface HealthState {
  /** Overall system status */
  status: OverallHealthStatus;

  /** Individual service health statuses */
  services: ServiceHealth[];

  /** Last successful health check timestamp */
  lastChecked: string | null;

  /** Whether a health check is in progress */
  loading: boolean;

  /** Error message from last failed health check */
  error: string | null;

  /** Whether health monitoring is active (polling) */
  monitoringActive: boolean;

  /** Previous status (to detect changes) */
  previousStatus: OverallHealthStatus | null;

  /** Services that changed status since last check */
  changedServices: string[];
}

/**
 * Initial health state
 */
export const initialHealthState: HealthState = {
  status: 'UNKNOWN',
  services: [],
  lastChecked: null,
  loading: false,
  error: null,
  monitoringActive: false,
  previousStatus: null,
  changedServices: []
};

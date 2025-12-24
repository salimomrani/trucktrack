/**
 * Driver Status Service
 */

import { api } from '@services/api/client';
import type { DriverStatus, DriverStatusType } from '@types/entities';
import type { UpdateStatusRequest } from '@types/api';

/**
 * Get current driver status
 */
export const getStatus = async (): Promise<DriverStatus> => {
  const response = await api.get<DriverStatus>('/drivers/me/status');
  return {
    ...response,
    pendingSync: false,
  };
};

/**
 * Update driver status
 */
export const updateStatus = async (status: DriverStatusType): Promise<DriverStatus> => {
  const request: UpdateStatusRequest = { status };
  const response = await api.put<DriverStatus>('/drivers/me/status', request);
  return {
    ...response,
    pendingSync: false,
  };
};

/**
 * Validate status transition
 * Returns true if the transition is valid
 */
export const isValidTransition = (
  currentStatus: DriverStatusType,
  newStatus: DriverStatusType,
): boolean => {
  // All transitions are allowed except:
  // - Same status (no change)
  if (currentStatus === newStatus) {
    return false;
  }

  // IN_DELIVERY -> OFF_DUTY should prompt for confirmation (handled in UI)
  // All other transitions are valid
  return true;
};

/**
 * Get statuses that require GPS tracking
 */
export const requiresGpsTracking = (status: DriverStatusType): boolean => {
  return status === 'AVAILABLE' || status === 'IN_DELIVERY';
};

/**
 * Get all available statuses
 */
export const getAllStatuses = (): DriverStatusType[] => {
  return ['AVAILABLE', 'IN_DELIVERY', 'ON_BREAK', 'OFF_DUTY'];
};

export default {
  getStatus,
  updateStatus,
  isValidTransition,
  requiresGpsTracking,
  getAllStatuses,
};

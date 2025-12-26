/**
 * Trip admin interfaces.
 * T043: Create Trip admin model
 * Feature: 010-trip-management
 */

export type TripStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TripResponse {
  id: string;
  origin: string;
  destination: string;
  status: TripStatus;
  statusDisplay: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  assignedTruckId: string | null;
  assignedTruckName: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripStatusHistoryResponse {
  id: string;
  tripId: string;
  previousStatus: TripStatus | null;
  previousStatusDisplay: string | null;
  newStatus: TripStatus;
  newStatusDisplay: string;
  changedBy: string;
  changedByName: string | null;
  changedAt: string;
  notes: string | null;
}

export interface CreateTripRequest {
  origin: string;
  destination: string;
  scheduledAt?: string;
  notes?: string;
  assignedTruckId?: string;
  assignedDriverId?: string;
}

export interface UpdateTripRequest {
  origin?: string;
  destination?: string;
  scheduledAt?: string;
  notes?: string;
}

export interface AssignTripRequest {
  truckId: string;
  driverId: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Status display configuration
export const TRIP_STATUS_LABELS: { [key in TripStatus]: string } = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const TRIP_STATUS_COLORS: { [key in TripStatus]: string } = {
  PENDING: '#ff9800',
  ASSIGNED: '#2196f3',
  IN_PROGRESS: '#9c27b0',
  COMPLETED: '#4caf50',
  CANCELLED: '#9e9e9e'
};

export const TRIP_STATUSES = [
  { value: 'PENDING' as TripStatus, label: 'Pending', color: '#ff9800', icon: 'hourglass_empty' },
  { value: 'ASSIGNED' as TripStatus, label: 'Assigned', color: '#2196f3', icon: 'assignment_ind' },
  { value: 'IN_PROGRESS' as TripStatus, label: 'In Progress', color: '#9c27b0', icon: 'local_shipping' },
  { value: 'COMPLETED' as TripStatus, label: 'Completed', color: '#4caf50', icon: 'check_circle' },
  { value: 'CANCELLED' as TripStatus, label: 'Cancelled', color: '#9e9e9e', icon: 'cancel' }
];

/**
 * Trip analytics DTO for dashboard KPIs.
 * T054: TripAnalyticsDTO
 */
export interface TripAnalytics {
  totalTrips: number;
  pendingTrips: number;
  assignedTrips: number;
  inProgressTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  averageDurationMinutes: number | null;
  completionRate: number;
  cancellationRate: number;
  tripsToday: number;
  tripsThisWeek: number;
  tripsThisMonth: number;
  tripsTrendPercent: number | null;
  completionRateTrendPercent: number | null;
  periodStart: string;
  periodEnd: string;
}

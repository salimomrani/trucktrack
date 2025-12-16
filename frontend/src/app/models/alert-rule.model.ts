/**
 * AlertRule model matching backend AlertRule entity
 * T155: Create AlertRule model
 */

export type AlertRuleType = 'OFFLINE' | 'IDLE' | 'SPEED_LIMIT' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT';

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  ruleType: AlertRuleType;
  thresholdValue?: number;
  geofenceId?: string;
  truckGroupId?: string;
  isEnabled: boolean;
  notificationChannels: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  ruleType: AlertRuleType;
  thresholdValue?: number;
  geofenceId?: string;
  truckGroupId?: string;
  isEnabled?: boolean;
  notificationChannels?: string[];
}

export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  ruleType?: AlertRuleType;
  thresholdValue?: number;
  geofenceId?: string;
  truckGroupId?: string;
  isEnabled?: boolean;
  notificationChannels?: string[];
}

import { Component, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { StoreFacade } from '../../store/store.facade';

interface Alert {
  id: string;
  truckId: string;
  type: 'speed' | 'geofence' | 'maintenance' | 'idle' | 'offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
}

interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * AlertsComponent - View for managing alert rules and notifications
 * Angular 17+ with signals, OnPush, Material UI
 */
@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit {
  private readonly facade = inject(StoreFacade);

  // State signals
  trucks = this.facade.trucks;
  isLoading = signal(false);
  alerts = signal<Alert[]>([]);
  selectedSeverity = signal<string | null>(null);
  selectedType = signal<string | null>(null);
  showResolved = signal(false);

  // Computed signals
  stats = computed((): AlertStats => {
    const allAlerts = this.alerts();
    return {
      total: allAlerts.length,
      unread: allAlerts.filter(a => !a.isRead).length,
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length
    };
  });

  filteredAlerts = computed(() => {
    let filtered = this.alerts();
    const severity = this.selectedSeverity();
    const type = this.selectedType();
    const showResolved = this.showResolved();

    if (!showResolved) {
      filtered = filtered.filter(a => !a.isResolved);
    }

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  ngOnInit(): void {
    this.facade.loadTrucks();
    this.generateMockAlerts();
  }

  filterBySeverity(severity: string | null): void {
    this.selectedSeverity.set(severity);
  }

  filterByType(type: string | null): void {
    this.selectedType.set(type);
  }

  toggleShowResolved(): void {
    this.showResolved.set(!this.showResolved());
  }

  markAsRead(alert: Alert): void {
    const alerts = this.alerts();
    const index = alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      alerts[index].isRead = true;
      this.alerts.set([...alerts]);
    }
  }

  markAsResolved(alert: Alert): void {
    const alerts = this.alerts();
    const index = alerts.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      alerts[index].isResolved = true;
      alerts[index].isRead = true;
      this.alerts.set([...alerts]);
    }
  }

  markAllAsRead(): void {
    const alerts = this.alerts().map(a => ({ ...a, isRead: true }));
    this.alerts.set(alerts);
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'check_circle';
      default: return 'info';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'speed': return 'speed';
      case 'geofence': return 'location_on';
      case 'maintenance': return 'build';
      case 'idle': return 'pause_circle';
      case 'offline': return 'cloud_off';
      default: return 'notifications';
    }
  }

  private generateMockAlerts(): void {
    const now = new Date();
    const mockAlerts: Alert[] = [
      {
        id: '1',
        truckId: 'TRUCK-001',
        type: 'speed',
        severity: 'critical',
        title: 'Speed Limit Exceeded',
        message: 'Truck TRUCK-001 exceeded speed limit (95 km/h in 80 km/h zone)',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        isRead: false,
        isResolved: false
      },
      {
        id: '2',
        truckId: 'TRUCK-002',
        type: 'geofence',
        severity: 'high',
        title: 'Geofence Violation',
        message: 'Truck TRUCK-002 left authorized zone',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        isRead: false,
        isResolved: false
      },
      {
        id: '3',
        truckId: 'TRUCK-003',
        type: 'maintenance',
        severity: 'medium',
        title: 'Maintenance Due',
        message: 'Truck TRUCK-003 is due for scheduled maintenance',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000),
        isRead: true,
        isResolved: false
      },
      {
        id: '4',
        truckId: 'TRUCK-001',
        type: 'idle',
        severity: 'low',
        title: 'Extended Idle Time',
        message: 'Truck TRUCK-001 has been idle for 2 hours',
        timestamp: new Date(now.getTime() - 120 * 60 * 1000),
        isRead: true,
        isResolved: true
      },
      {
        id: '5',
        truckId: 'TRUCK-004',
        type: 'offline',
        severity: 'high',
        title: 'Truck Offline',
        message: 'Truck TRUCK-004 has been offline for 15 minutes',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        isRead: false,
        isResolved: false
      }
    ];

    this.alerts.set(mockAlerts);
  }
}

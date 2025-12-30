import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NotificationService,
  NotificationPreference,
  UpdatePreferenceRequest
} from '../../../services/notification.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface PreferenceGroup {
  title: string;
  icon: string;
  eventTypes: string[];
}

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly preferences = signal<NotificationPreference[]>([]);

  readonly preferenceGroups: PreferenceGroup[] = [
    {
      title: 'Livraisons',
      icon: 'local_shipping',
      eventTypes: ['DELIVERY_CONFIRMED', 'ETA_30MIN', 'ETA_10MIN']
    },
    {
      title: 'Trips',
      icon: 'route',
      eventTypes: ['TRIP_ASSIGNED', 'TRIP_REASSIGNED', 'TRIP_CANCELLED']
    },
    {
      title: 'Rapports',
      icon: 'assessment',
      eventTypes: ['DAILY_REPORT']
    },
    {
      title: 'Alertes',
      icon: 'warning',
      eventTypes: ['OFFLINE', 'SPEED_LIMIT', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT']
    }
  ];

  readonly eventTypeLabels: Record<string, string> = {
    'DELIVERY_CONFIRMED': 'Confirmation de livraison',
    'ETA_30MIN': 'ETA 30 minutes',
    'ETA_10MIN': 'ETA 10 minutes',
    'TRIP_ASSIGNED': 'Trip assigné',
    'TRIP_REASSIGNED': 'Trip réassigné',
    'TRIP_CANCELLED': 'Trip annulé',
    'DAILY_REPORT': 'Rapport quotidien',
    'OFFLINE': 'Véhicule hors ligne',
    'SPEED_LIMIT': 'Dépassement de vitesse',
    'GEOFENCE_ENTER': 'Entrée zone géographique',
    'GEOFENCE_EXIT': 'Sortie zone géographique'
  };

  ngOnInit(): void {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    this.loading.set(true);
    this.notificationService.getPreferences().subscribe({
      next: (prefs) => {
        this.preferences.set(prefs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading preferences:', err);
        this.loading.set(false);
        this.toast.error('Erreur lors du chargement des préférences');
      }
    });
  }

  getPreference(eventType: string): NotificationPreference | undefined {
    return this.preferences().find(p => p.eventType === eventType);
  }

  isEmailEnabled(eventType: string): boolean {
    return this.getPreference(eventType)?.emailEnabled ?? true;
  }

  isPushEnabled(eventType: string): boolean {
    return this.getPreference(eventType)?.pushEnabled ?? true;
  }

  onToggleEmail(eventType: string, enabled: boolean): void {
    this.updatePreference(eventType, enabled, this.isPushEnabled(eventType));
  }

  onTogglePush(eventType: string, enabled: boolean): void {
    this.updatePreference(eventType, this.isEmailEnabled(eventType), enabled);
  }

  private updatePreference(eventType: string, emailEnabled: boolean, pushEnabled: boolean): void {
    this.saving.set(true);

    const request: UpdatePreferenceRequest[] = [{
      eventType,
      emailEnabled,
      pushEnabled
    }];

    this.notificationService.updatePreferences(request).subscribe({
      next: (updatedPrefs) => {
        // Update local state
        const currentPrefs = [...this.preferences()];
        const index = currentPrefs.findIndex(p => p.eventType === eventType);
        if (index >= 0) {
          currentPrefs[index] = updatedPrefs.find(p => p.eventType === eventType) || currentPrefs[index];
        } else {
          currentPrefs.push(...updatedPrefs.filter(p => p.eventType === eventType));
        }
        this.preferences.set(currentPrefs);
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error updating preferences:', err);
        this.saving.set(false);
        this.toast.error('Erreur lors de la mise à jour');
        // Reload to get correct state
        this.loadPreferences();
      }
    });
  }

  getEventLabel(eventType: string): string {
    return this.eventTypeLabels[eventType] || eventType;
  }
}

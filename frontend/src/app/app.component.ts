import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './core/components/header/header.component';
import { NotificationService } from './services/notification.service';
import { StoreFacade } from './store/store.facade';
import { Notification } from './models/notification.model';

/**
 * Root application component
 * T166-T167: Real-time notification handling with snackbar alerts
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';

  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly facade = inject(StoreFacade);

  constructor() {
    // Subscribe to new notifications and show snackbar
    this.notificationService.newNotification$
      .pipe(takeUntilDestroyed())
      .subscribe(notification => {
        this.showNotificationSnackbar(notification);
      });

    // T166: Connect/disconnect WebSocket based on auth state
    effect(() => {
      const isAuthenticated = this.facade.isAuthenticated();
      if (isAuthenticated) {
        this.notificationService.connectWebSocket();
      } else {
        this.notificationService.disconnectWebSocket();
      }
    });
  }

  ngOnInit(): void {
    // Initialization handled in constructor via effects
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectWebSocket();
  }

  /**
   * T167: Show snackbar alert for new notification
   */
  private showNotificationSnackbar(notification: Notification): void {
    const snackBarRef = this.snackBar.open(
      `${notification.title}: ${notification.message}`,
      'View',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: this.getSnackbarClass(notification.severity)
      }
    );

    // Navigate to alerts page when "View" is clicked
    snackBarRef.onAction().subscribe(() => {
      window.location.href = '/alerts';
    });
  }

  /**
   * Get snackbar CSS class based on notification severity
   */
  private getSnackbarClass(severity: string): string[] {
    switch (severity) {
      case 'CRITICAL':
        return ['notification-snackbar', 'snackbar-critical'];
      case 'WARNING':
        return ['notification-snackbar', 'snackbar-warning'];
      case 'INFO':
      default:
        return ['notification-snackbar', 'snackbar-info'];
    }
  }
}

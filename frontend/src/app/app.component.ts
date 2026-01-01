import { Component, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayoutShellComponent } from './core/components/layout-shell/layout-shell.component';
import { ConfirmDialogOverlayComponent } from './admin/shared/confirm-dialog/confirm-dialog-overlay.component';
import { ImageViewerOverlayComponent } from './admin/shared/image-viewer/image-viewer-overlay.component';
import { NotificationService } from './services/notification.service';
import { StoreFacade } from './store/store.facade';
import { ToastService } from './shared/components';
import { Notification } from './models/notification.model';

/**
 * Root application component
 * T166-T167: Real-time notification handling with snackbar alerts
 * Feature 021: Sidebar layout with dark navigation
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LayoutShellComponent, ConfirmDialogOverlayComponent, ImageViewerOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {

  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(StoreFacade);

  // Auth state
  isAuthenticated = this.facade.isAuthenticated;

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

  ngOnDestroy(): void {
    this.notificationService.disconnectWebSocket();
  }

  /**
   * T167: Show toast alert for new notification
   */
  private showNotificationSnackbar(notification: Notification): void {
    const message = `${notification.title}: ${notification.message}`;

    switch (notification.severity) {
      case 'CRITICAL':
        this.toast.error(message);
        break;
      case 'WARNING':
        this.toast.warning(message);
        break;
      case 'INFO':
      default:
        this.toast.info(message);
        break;
    }
  }
}

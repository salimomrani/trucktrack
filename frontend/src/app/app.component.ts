import { Component, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { LayoutShellComponent } from './core/components/layout-shell/layout-shell.component';
import { ConfirmDialogOverlayComponent } from './admin/shared/confirm-dialog/confirm-dialog-overlay.component';
import { ImageViewerOverlayComponent } from './admin/shared/image-viewer/image-viewer-overlay.component';
import { StoreFacade } from './store/store.facade';
import { ToastService } from './shared/components';
import { Notification } from './models/notification.model';
import * as NotificationsActions from './store/notifications/notifications.actions';
import { LanguageService } from './core/services/language.service';

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
  private readonly actions$ = inject(Actions);
  private readonly toast = inject(ToastService);
  private readonly facade = inject(StoreFacade);
  private readonly languageService = inject(LanguageService);

  // Auth state
  isAuthenticated = this.facade.isAuthenticated;

  constructor() {
    // Initialize i18n language from localStorage
    this.languageService.init();

    // Subscribe to new notifications from store and show snackbar
    this.actions$
      .pipe(
        ofType(NotificationsActions.newNotificationReceived),
        takeUntilDestroyed()
      )
      .subscribe(({ notification }) => {
        this.showNotificationSnackbar(notification);
      });

    // T166: Connect/disconnect WebSocket based on auth state
    effect(() => {
      const isAuthenticated = this.facade.isAuthenticated();
      if (isAuthenticated) {
        this.facade.connectNotificationsWebSocket();
      } else {
        this.facade.disconnectNotificationsWebSocket();
      }
    });
  }

  ngOnDestroy(): void {
    this.facade.disconnectNotificationsWebSocket();
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

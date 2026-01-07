import { Injectable, inject, ApplicationRef, createComponent, EnvironmentInjector, ComponentRef, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ToastContainerComponent } from './toast-container.component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  /** Optional translation key - if provided, message will be treated as a translation key */
  translationKey?: string;
  /** Optional translation params */
  translationParams?: Record<string, string | number>;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    /** Optional translation key for action label */
    labelKey?: string;
    callback: () => void;
  };
  dismissible?: boolean;
}

export interface Toast extends ToastConfig {
  id: number;
  type: ToastType;
  duration: number;
  visible: boolean;
}

/**
 * Toast Service - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A service for showing toast notifications.
 *
 * @example
 * // Show a success toast
 * this.toastService.success('Item saved successfully');
 *
 * // Show an error toast
 * this.toastService.error('Failed to save item');
 *
 * // Show a toast with action
 * this.toastService.show({
 *   message: 'Item deleted',
 *   type: 'info',
 *   action: { label: 'Undo', callback: () => this.undoDelete() }
 * });
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly translate = inject(TranslateService);

  private toasts: Toast[] = [];
  private toastId = 0;
  private containerRef: ComponentRef<ToastContainerComponent> | null = null;
  private readonly toastsSubject = new Subject<Toast[]>();

  readonly toasts$ = this.toastsSubject.asObservable();

  /**
   * Show a toast notification
   */
  show(config: ToastConfig): void {
    // Resolve message - use translation key if provided
    let message = config.message;
    if (config.translationKey) {
      message = this.translate.instant(config.translationKey, config.translationParams);
    }

    // Resolve action label if translation key provided
    let action = config.action;
    if (action?.labelKey) {
      action = { ...action, label: this.translate.instant(action.labelKey) };
    }

    const toast: Toast = {
      id: ++this.toastId,
      message,
      type: config.type || 'info',
      duration: config.duration ?? 3000,
      action,
      dismissible: config.dismissible ?? true,
      visible: true
    };

    // Ensure container exists
    if (!this.containerRef) {
      this.createContainer();
    }

    // Add toast
    this.toasts.push(toast);
    this.updateContainer();

    // Auto-dismiss
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    }
  }

  /**
   * Show a success toast
   * @param messageOrKey - Message text or translation key (if key starts with uppercase like 'SUCCESS.SAVED')
   */
  success(messageOrKey: string, duration = 3000): void {
    const isTranslationKey = this.isTranslationKey(messageOrKey);
    this.show({
      message: isTranslationKey ? '' : messageOrKey,
      translationKey: isTranslationKey ? messageOrKey : undefined,
      type: 'success',
      duration
    });
  }

  /**
   * Show an error toast
   * @param messageOrKey - Message text or translation key (if key starts with uppercase like 'ERRORS.GENERIC')
   */
  error(messageOrKey: string, duration = 5000): void {
    const isTranslationKey = this.isTranslationKey(messageOrKey);
    this.show({
      message: isTranslationKey ? '' : messageOrKey,
      translationKey: isTranslationKey ? messageOrKey : undefined,
      type: 'error',
      duration
    });
  }

  /**
   * Show a warning toast
   * @param messageOrKey - Message text or translation key
   */
  warning(messageOrKey: string, duration = 4000): void {
    const isTranslationKey = this.isTranslationKey(messageOrKey);
    this.show({
      message: isTranslationKey ? '' : messageOrKey,
      translationKey: isTranslationKey ? messageOrKey : undefined,
      type: 'warning',
      duration
    });
  }

  /**
   * Show an info toast
   * @param messageOrKey - Message text or translation key
   */
  info(messageOrKey: string, duration = 3000): void {
    const isTranslationKey = this.isTranslationKey(messageOrKey);
    this.show({
      message: isTranslationKey ? '' : messageOrKey,
      translationKey: isTranslationKey ? messageOrKey : undefined,
      type: 'info',
      duration
    });
  }

  /**
   * Check if string looks like a translation key (e.g., 'SUCCESS.SAVED', 'ERRORS.GENERIC')
   */
  private isTranslationKey(str: string): boolean {
    return /^[A-Z][A-Z_]+\.[A-Z][A-Z_]+/.test(str);
  }

  /**
   * Dismiss a toast by ID
   */
  dismiss(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      this.updateContainer();

      // Remove after animation
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.updateContainer();

        // Remove container if no more toasts
        if (this.toasts.length === 0 && this.containerRef) {
          this.destroyContainer();
        }
      }, 300);
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.forEach(toast => toast.visible = false);
    this.updateContainer();

    setTimeout(() => {
      this.toasts = [];
      if (this.containerRef) {
        this.destroyContainer();
      }
    }, 300);
  }

  /**
   * Create the toast container
   */
  private createContainer(): void {
    this.containerRef = createComponent(ToastContainerComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector
    });

    this.containerRef.instance.toastService = this;
    this.appRef.attachView(this.containerRef.hostView);
    document.body.appendChild(this.containerRef.location.nativeElement);
  }

  /**
   * Update the container with current toasts
   */
  private updateContainer(): void {
    if (this.containerRef) {
      this.containerRef.instance.toasts = [...this.toasts];
      this.containerRef.instance.cdr.detectChanges();
    }
    this.toastsSubject.next([...this.toasts]);
  }

  /**
   * Destroy the container
   */
  private destroyContainer(): void {
    if (this.containerRef) {
      this.appRef.detachView(this.containerRef.hostView);
      this.containerRef.destroy();
      this.containerRef = null;
    }
  }
}

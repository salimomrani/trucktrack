import { Injectable, inject, ApplicationRef, createComponent, EnvironmentInjector, ComponentRef, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastContainerComponent } from './toast-container.component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
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

  private toasts: Toast[] = [];
  private toastId = 0;
  private containerRef: ComponentRef<ToastContainerComponent> | null = null;
  private readonly toastsSubject = new Subject<Toast[]>();

  readonly toasts$ = this.toastsSubject.asObservable();

  /**
   * Show a toast notification
   */
  show(config: ToastConfig): void {
    const toast: Toast = {
      id: ++this.toastId,
      message: config.message,
      type: config.type || 'info',
      duration: config.duration ?? 3000,
      action: config.action,
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
   */
  success(message: string, duration = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Show an error toast
   */
  error(message: string, duration = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration = 4000): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Show an info toast
   */
  info(message: string, duration = 3000): void {
    this.show({ message, type: 'info', duration });
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

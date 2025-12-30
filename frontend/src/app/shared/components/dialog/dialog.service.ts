import { Injectable, inject, ComponentRef, Type, ApplicationRef, createComponent, Injector, EnvironmentInjector } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { DIALOG_DATA, DialogRef } from './dialog-ref';
import { DialogContainerComponent } from './dialog-container.component';

export interface DialogConfig<T = any> {
  data?: T;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string;
  disableClose?: boolean;
}

/**
 * Dialog Service - Tailwind CSS Implementation
 * Feature 020: Angular Material to Tailwind CSS Migration
 *
 * A service for opening modal dialogs with custom components.
 *
 * @example
 * // Open a dialog
 * const dialogRef = this.dialogService.open(MyDialogComponent, {
 *   data: { title: 'Hello' },
 *   width: '500px'
 * });
 *
 * dialogRef.afterClosed().subscribe(result => {
 *   console.log('Dialog result:', result);
 * });
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly envInjector = inject(EnvironmentInjector);

  private openDialogs: DialogRef<any>[] = [];
  private containerRef: ComponentRef<DialogContainerComponent> | null = null;

  /**
   * Open a dialog with the given component
   */
  open<T, D = any, R = any>(
    component: Type<T>,
    config?: DialogConfig<D>
  ): DialogRef<R> {
    const dialogConfig: DialogConfig<D> = {
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      disableClose: false,
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      ...config
    };

    // Create dialog ref
    const dialogRef = new DialogRef<R>();

    // Create the container if it doesn't exist
    if (!this.containerRef) {
      this.createContainer();
    }

    // Create custom injector with dialog data and ref
    const dialogInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: DIALOG_DATA, useValue: dialogConfig.data },
        { provide: DialogRef, useValue: dialogRef }
      ]
    });

    // Create the component
    const componentRef = createComponent(component, {
      environmentInjector: this.envInjector,
      elementInjector: dialogInjector
    });

    // Attach to container
    if (this.containerRef) {
      this.containerRef.instance.attachComponent(componentRef, dialogConfig, dialogRef);
    }

    // Attach to app
    this.appRef.attachView(componentRef.hostView);

    // Track open dialogs
    this.openDialogs.push(dialogRef);

    // Handle close
    dialogRef.afterClosed().subscribe(() => {
      this.removeDialog(dialogRef, componentRef);
    });

    return dialogRef;
  }

  /**
   * Open a confirm dialog
   */
  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'danger' | 'warning';
  }): Observable<boolean> {
    const result = new Subject<boolean>();

    // Import ConfirmDialogComponent dynamically
    import('./confirm-dialog.component').then(({ ConfirmDialogComponent }) => {
      const dialogRef = this.open(ConfirmDialogComponent, {
        data: {
          title: options.title || 'Confirm',
          message: options.message,
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          confirmColor: options.confirmColor || 'primary'
        },
        width: '400px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        result.next(!!confirmed);
        result.complete();
      });
    });

    return result.asObservable();
  }

  /**
   * Close all open dialogs
   */
  closeAll(): void {
    this.openDialogs.forEach(dialogRef => dialogRef.close());
  }

  /**
   * Create the dialog container element
   */
  private createContainer(): void {
    this.containerRef = createComponent(DialogContainerComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector
    });

    this.appRef.attachView(this.containerRef.hostView);
    document.body.appendChild(this.containerRef.location.nativeElement);
  }

  /**
   * Remove a dialog from tracking
   */
  private removeDialog(dialogRef: DialogRef<any>, componentRef: ComponentRef<any>): void {
    const index = this.openDialogs.indexOf(dialogRef);
    if (index > -1) {
      this.openDialogs.splice(index, 1);
    }

    // Detach component
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();

    // Remove container if no more dialogs
    if (this.openDialogs.length === 0 && this.containerRef) {
      this.appRef.detachView(this.containerRef.hostView);
      this.containerRef.destroy();
      this.containerRef = null;
    }
  }
}

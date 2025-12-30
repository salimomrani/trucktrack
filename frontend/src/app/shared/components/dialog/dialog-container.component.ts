import {
  Component,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef } from './dialog-ref';

interface DialogInstance {
  componentRef: ComponentRef<any>;
  config: any;
  dialogRef: DialogRef<any>;
}

/**
 * Container component for dialogs
 * Feature 020: Angular Material to Tailwind CSS Migration
 */
@Component({
  selector: 'app-dialog-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      @if (hasBackdrop) {
        <div
          class="absolute inset-0 bg-black/50 transition-opacity"
          (click)="onBackdropClick()">
        </div>
      }

      <!-- Dialog Panel -->
      <div
        class="relative bg-white rounded-lg shadow-xl transform transition-all"
        [style.width]="width"
        [style.max-width]="maxWidth"
        [style.min-width]="minWidth"
        [style.height]="height"
        [style.max-height]="maxHeight"
        role="dialog"
        aria-modal="true">
        <ng-container #dialogContent></ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogContainerComponent {
  @ViewChild('dialogContent', { read: ViewContainerRef, static: true })
  dialogContent!: ViewContainerRef;

  private readonly cdr = inject(ChangeDetectorRef);

  private currentInstance: DialogInstance | null = null;

  hasBackdrop = true;
  disableClose = false;
  width = '500px';
  maxWidth = '90vw';
  minWidth?: string;
  height?: string;
  maxHeight = '90vh';

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.disableClose && this.currentInstance) {
      this.currentInstance.dialogRef.close();
    }
  }

  /**
   * Attach a component to the dialog container
   */
  attachComponent(
    componentRef: ComponentRef<any>,
    config: any,
    dialogRef: DialogRef<any>
  ): void {
    this.currentInstance = { componentRef, config, dialogRef };

    // Apply config
    this.hasBackdrop = config.hasBackdrop !== false;
    this.disableClose = config.disableClose === true;
    this.width = config.width || '500px';
    this.maxWidth = config.maxWidth || '90vw';
    this.minWidth = config.minWidth;
    this.height = config.height;
    this.maxHeight = config.maxHeight || '90vh';

    // Insert component
    this.dialogContent.clear();
    this.dialogContent.insert(componentRef.hostView);

    this.cdr.detectChanges();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    if (!this.disableClose && this.currentInstance) {
      this.currentInstance.dialogRef.close();
    }
  }
}

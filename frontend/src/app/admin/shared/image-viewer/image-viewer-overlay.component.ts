import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageViewerService } from './image-viewer.service';

/**
 * Global image viewer overlay component.
 * Should be placed once in app.component.html.
 * Feature: 020-tailwind-migration
 */
@Component({
  selector: 'app-image-viewer-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (viewerService.isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
        (click)="viewerService.close()">
        <!-- Dialog -->
        <div
          class="bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
          (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-medium text-gray-800">{{ viewerService.data()?.title || 'Image' }}</h2>
            <button
              type="button"
              class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              (click)="viewerService.close()">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Image Container -->
          <div class="p-6 bg-gray-100 flex justify-center">
            <img
              [src]="viewerService.data()?.imageUrl"
              alt="Image"
              class="max-w-full max-h-[60vh] bg-white border border-gray-200 rounded-lg object-contain">
          </div>

          <!-- Metadata -->
          @for (item of viewerService.data()?.metadata || []; track item.label) {
            <div class="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border-t border-gray-100">
              @if (item.icon) {
                <span class="material-icons text-lg text-gray-400">{{ item.icon }}</span>
              }
              <span>{{ item.label }}: {{ item.value }}</span>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class ImageViewerOverlayComponent {
  readonly viewerService = inject(ImageViewerService);
}

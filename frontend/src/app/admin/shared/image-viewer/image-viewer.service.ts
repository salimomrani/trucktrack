import { Injectable, signal } from '@angular/core';

export interface ImageViewerData {
  imageUrl: string;
  title?: string;
  metadata?: { label: string; value: string; icon?: string }[];
}

/**
 * Service for showing image viewer modals.
 * Replaces MatDialog for image viewing flows.
 * Feature: 020-tailwind-migration
 */
@Injectable({
  providedIn: 'root'
})
export class ImageViewerService {
  // Viewer state
  readonly isOpen = signal(false);
  readonly data = signal<ImageViewerData | null>(null);

  /**
   * Open image viewer modal.
   */
  open(data: ImageViewerData): void {
    this.data.set(data);
    this.isOpen.set(true);
  }

  /**
   * Close image viewer modal.
   */
  close(): void {
    this.isOpen.set(false);
    this.data.set(null);
  }
}

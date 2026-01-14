import { Injectable, signal, computed } from '@angular/core';

/**
 * Service to manage sidebar state across components
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  /** Whether the sidebar is collapsed */
  readonly isCollapsed = signal(false);

  /** Effective width based on collapsed state */
  readonly effectiveWidth = computed(() => {
    return this.isCollapsed() ? 64 : 260;
  });

  /** Toggle collapsed state */
  toggleCollapsed(): void {
    this.isCollapsed.update(v => !v);
  }
}

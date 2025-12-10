import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * HistoryComponent - View for displaying truck movement history
 * This is a placeholder component that will be fully implemented in Phase 5 (User Story 3)
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <h1>Truck Movement History</h1>
      <p>History component placeholder - will be implemented in Phase 5 (User Story 3)</p>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 24px;
    }
  `]
})
export class HistoryComponent {
}

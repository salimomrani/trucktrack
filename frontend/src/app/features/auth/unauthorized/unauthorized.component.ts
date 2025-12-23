import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * UnauthorizedComponent - Displayed when user tries to access a resource they don't have permission for
 */
@Component({
    selector: 'app-unauthorized',
    imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-content>
          <mat-icon class="unauthorized-icon">block</mat-icon>
          <h1>Access Denied</h1>
          <p>You don't have permission to access this resource.</p>
          <p class="help-text">Please contact your administrator if you believe this is an error.</p>
          <button mat-raised-button color="primary" routerLink="/map">
            Go to Map
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .unauthorized-card {
      max-width: 500px;
      text-align: center;
    }

    .unauthorized-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #f44336;
      margin: 0 auto 20px;
    }

    h1 {
      margin: 0 0 16px;
      color: #333;
    }

    p {
      color: #666;
      margin-bottom: 12px;
    }

    .help-text {
      font-size: 14px;
      margin-bottom: 24px;
    }
  `]
})
export class UnauthorizedComponent {
}

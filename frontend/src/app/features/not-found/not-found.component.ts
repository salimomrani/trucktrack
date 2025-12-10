import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * NotFoundComponent - 404 page displayed when route doesn't exist
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-card class="not-found-card">
        <mat-card-content>
          <mat-icon class="not-found-icon">explore_off</mat-icon>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <button mat-raised-button color="primary" routerLink="/map">
            Go to Map
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .not-found-card {
      max-width: 500px;
      text-align: center;
    }

    .not-found-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ff9800;
      margin: 0 auto 20px;
    }

    h1 {
      margin: 0 0 16px;
      color: #333;
    }

    p {
      color: #666;
      margin-bottom: 24px;
    }
  `]
})
export class NotFoundComponent {
}

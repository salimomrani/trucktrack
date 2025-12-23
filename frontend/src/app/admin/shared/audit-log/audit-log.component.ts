import { Component, input, OnInit, OnChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DEACTIVATE' | 'REACTIVATE' | 'ASSIGN' | 'UNASSIGN';
  entityType: string;
  entityId: string;
  userId: string;
  username: string;
  changes: string | null;
  ipAddress: string | null;
  timestamp: string;
}

/**
 * Audit log page response
 */
interface AuditLogPage {
  content: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Reusable component for displaying audit logs
 * T022: Create reusable AuditLogComponent
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-audit-log',
    imports: [
        CommonModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatExpansionModule,
        MatTooltipModule
    ],
    template: `
    <div class="audit-log-container">
      <h3 class="section-title">
        <mat-icon>history</mat-icon>
        Audit History
      </h3>
    
      <!-- Loading spinner -->
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
      }
    
      <!-- Empty state -->
      @if (!loading() && logs().length === 0) {
        <div class="empty-state">
          <mat-icon>inbox</mat-icon>
          <span>No audit history available</span>
        </div>
      }
    
      <!-- Audit log entries -->
      @if (!loading() && logs().length > 0) {
        <div class="log-entries">
          <mat-accordion>
            @for (log of logs(); track log) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-chip [class]="'action-chip ' + log.action.toLowerCase()">
                      {{ getActionIcon(log.action) }}
                      {{ log.action }}
                    </mat-chip>
                  </mat-panel-title>
                  <mat-panel-description>
                    <span class="log-meta">
                      <span class="username">{{ log.username }}</span>
                      <span class="separator">•</span>
                      <span class="timestamp">{{ log.timestamp | date:'medium' }}</span>
                    </span>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                <div class="log-details">
                  <div class="detail-row">
                    <span class="label">User ID:</span>
                    <span class="value">{{ log.userId }}</span>
                  </div>
                  @if (log.ipAddress) {
                    <div class="detail-row">
                      <span class="label">IP Address:</span>
                      <span class="value">{{ log.ipAddress }}</span>
                    </div>
                  }
                  @if (log.changes) {
                    <div class="detail-row">
                      <span class="label">Changes:</span>
                      <pre class="changes-json">{{ formatChanges(log.changes) }}</pre>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
          <!-- Load more button -->
          @if (hasMore()) {
            <div class="load-more">
              <button mat-stroked-button (click)="loadMore()">
                Load More
              </button>
            </div>
          }
        </div>
      }
    </div>
    `,
    styles: [`
    .audit-log-container {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #424242;
      font-size: 16px;
      font-weight: 500;
    }

    .section-title mat-icon {
      color: #757575;
    }

    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #9e9e9e;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .action-chip {
      font-size: 11px;
      font-weight: 600;
    }

    .action-chip.create {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .action-chip.update {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .action-chip.delete {
      background-color: #f44336 !important;
      color: white !important;
    }

    .action-chip.deactivate {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .action-chip.reactivate {
      background-color: #8bc34a !important;
      color: white !important;
    }

    .action-chip.assign, .action-chip.unassign {
      background-color: #9c27b0 !important;
      color: white !important;
    }

    .log-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #757575;
    }

    .separator {
      color: #bdbdbd;
    }

    .username {
      font-weight: 500;
      color: #424242;
    }

    .log-details {
      padding: 16px 0;
    }

    .detail-row {
      display: flex;
      margin-bottom: 8px;
    }

    .detail-row .label {
      width: 100px;
      font-weight: 500;
      color: #757575;
    }

    .detail-row .value {
      flex: 1;
      font-family: monospace;
    }

    .changes-json {
      flex: 1;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
      margin: 0;
    }

    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    mat-expansion-panel {
      margin-bottom: 8px;
    }
  `]
})
export class AuditLogComponent implements OnInit, OnChanges {
  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  private http = inject(HttpClient);

  loading = signal(true);
  logs = signal<AuditLogEntry[]>([]);
  hasMore = signal(false);
  private currentPage = 0;
  private pageSize = 10;

  ngOnInit() {
    if (this.entityType() && this.entityId()) {
      this.loadLogs();
    }
  }

  ngOnChanges() {
    if (this.entityType() && this.entityId()) {
      this.currentPage = 0;
      this.logs.set([]);
      this.loadLogs();
    }
  }

  loadLogs() {
    this.loading.set(true);
    const url = `${environment.apiUrl}/admin/audit/${this.entityType()}/${this.entityId()}?page=${this.currentPage}&size=${this.pageSize}`;

    this.http.get<AuditLogPage>(url).subscribe({
      next: (response) => {
        const currentLogs = this.logs();
        this.logs.set([...currentLogs, ...response.content]);
        this.hasMore.set(this.currentPage < response.totalPages - 1);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    this.currentPage++;
    this.loadLogs();
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      DEACTIVATE: '⏸️',
      REACTIVATE: '▶️',
      ASSIGN: '🔗',
      UNASSIGN: '🔓'
    };
    return icons[action] || '📝';
  }

  formatChanges(changes: string | null): string {
    if (!changes) return '';
    try {
      const parsed = JSON.parse(changes);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return changes;
    }
  }
}

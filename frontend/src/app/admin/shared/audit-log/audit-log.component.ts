import { Component, input, OnInit, OnChanges, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
    selector: 'app-audit-log',
    imports: [CommonModule, DatePipe],
    templateUrl: './audit-log.component.html',
    styleUrls: ['./audit-log.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogComponent implements OnInit, OnChanges {
  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  private readonly http = inject(HttpClient);

  loading = signal(true);
  logs = signal<AuditLogEntry[]>([]);
  hasMore = signal(false);
  expandedLogId = signal<string | null>(null);
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

  toggleExpand(logId: string): void {
    this.expandedLogId.update(current => current === logId ? null : logId);
  }

  isExpanded(logId: string): boolean {
    return this.expandedLogId() === logId;
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

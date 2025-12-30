import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { AnalyticsService } from './services/analytics.service';
import { ExportService } from './services/export.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { PeriodFilterComponent } from './components/period-filter/period-filter.component';
import { EntityFilterComponent } from './components/entity-filter/entity-filter.component';
import { DistanceChartComponent } from './components/distance-chart/distance-chart.component';
import { AlertsChartComponent } from './components/alerts-chart/alerts-chart.component';
import { TrucksRankingComponent } from './components/trucks-ranking/trucks-ranking.component';
import {
  FleetKPI,
  DailyMetrics,
  AlertBreakdown,
  TruckRanking,
  DailyDataPoint,
  AlertTypeCount,
  TruckRankEntry,
  PeriodType,
  EntityType,
  AnalyticsFilter
} from '../../core/models/analytics.model';

/**
 * Main analytics dashboard component.
 * Feature: 006-fleet-analytics
 * T019-T022: Create analytics dashboard with KPI cards
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KpiCardComponent,
    PeriodFilterComponent,
    EntityFilterComponent,
    DistanceChartComponent,
    AlertsChartComponent,
    TrucksRankingComponent
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly exportService = inject(ExportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly isLoading = signal(false);
  readonly isChartsLoading = signal(false);
  readonly isExporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly kpis = signal<FleetKPI | null>(null);

  // Chart data signals
  readonly dailyMetrics = signal<DailyDataPoint[]>([]);
  readonly alertBreakdown = signal<AlertTypeCount[]>([]);
  readonly truckRanking = signal<TruckRankEntry[]>([]);

  // Responsive chart sizing
  readonly chartWidth = signal(500);

  // Filter state
  readonly selectedPeriod = signal<PeriodType>('WEEK');
  readonly selectedEntityType = signal<EntityType>('FLEET');
  readonly selectedEntityId = signal<string | null>(null);
  readonly customStartDate = signal<string | null>(null);
  readonly customEndDate = signal<string | null>(null);

  // Computed filter
  readonly currentFilter = computed<AnalyticsFilter>(() => ({
    periodType: this.selectedPeriod(),
    entityType: this.selectedEntityType(),
    entityId: this.selectedEntityId() ?? undefined,
    customStartDate: this.customStartDate() ?? undefined,
    customEndDate: this.customEndDate() ?? undefined
  }));

  // Computed KPI display values
  readonly kpiCards = computed(() => {
    const data = this.kpis();
    if (!data) return [];

    return [
      {
        label: 'Distance totale',
        value: data.totalDistanceKm,
        unit: 'km',
        icon: 'route',
        iconClass: 'primary'
      },
      {
        label: 'Temps de conduite',
        value: this.formatMinutesToHours(data.drivingTimeMinutes),
        unit: 'heures',
        icon: 'timer',
        iconClass: 'success'
      },
      {
        label: "Temps d'inactivité",
        value: this.formatMinutesToHours(data.idleTimeMinutes),
        unit: 'heures',
        icon: 'pause_circle',
        iconClass: 'warning'
      },
      {
        label: 'Vitesse moyenne',
        value: data.avgSpeedKmh,
        unit: 'km/h',
        icon: 'speed',
        iconClass: 'info'
      },
      {
        label: 'Vitesse maximale',
        value: data.maxSpeedKmh,
        unit: 'km/h',
        icon: 'trending_up',
        iconClass: 'error'
      },
      {
        label: 'Alertes',
        value: data.alertCount,
        unit: '',
        icon: 'warning',
        iconClass: 'error'
      },
      {
        label: 'Entrées geofence',
        value: data.geofenceEntries,
        unit: '',
        icon: 'login',
        iconClass: 'success'
      },
      {
        label: 'Sorties geofence',
        value: data.geofenceExits,
        unit: '',
        icon: 'logout',
        iconClass: 'warning'
      }
    ];
  });

  ngOnInit(): void {
    // Setup responsive chart sizing
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.chartWidth.set(300);
        } else if (result.breakpoints[Breakpoints.Small]) {
          this.chartWidth.set(400);
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this.chartWidth.set(450);
        } else {
          this.chartWidth.set(500);
        }
      });

    // Load filters from URL query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['period']) {
        this.selectedPeriod.set(params['period'] as PeriodType);
      }
      if (params['entityType']) {
        this.selectedEntityType.set(params['entityType'] as EntityType);
      }
      if (params['entityId']) {
        this.selectedEntityId.set(params['entityId']);
      }
      if (params['startDate']) {
        this.customStartDate.set(params['startDate']);
      }
      if (params['endDate']) {
        this.customEndDate.set(params['endDate']);
      }
      this.loadAllData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPeriodChange(period: PeriodType): void {
    this.selectedPeriod.set(period);
    if (period !== 'CUSTOM') {
      this.customStartDate.set(null);
      this.customEndDate.set(null);
    }
    this.updateUrlParams();
    this.loadAllData();
  }

  onDateRangeChange(range: { startDate: string; endDate: string }): void {
    this.customStartDate.set(range.startDate);
    this.customEndDate.set(range.endDate);
    this.updateUrlParams();
    this.loadAllData();
  }

  onEntityTypeChange(type: EntityType): void {
    this.selectedEntityType.set(type);
    if (type === 'FLEET') {
      this.selectedEntityId.set(null);
    }
    this.updateUrlParams();
    this.loadAllData();
  }

  onEntityChange(entityId: string | null): void {
    this.selectedEntityId.set(entityId);
    this.updateUrlParams();
    this.loadAllData();
  }

  private updateUrlParams(): void {
    const queryParams: any = {
      period: this.selectedPeriod(),
      entityType: this.selectedEntityType()
    };

    if (this.selectedEntityId()) {
      queryParams.entityId = this.selectedEntityId();
    }
    if (this.customStartDate()) {
      queryParams.startDate = this.customStartDate();
    }
    if (this.customEndDate()) {
      queryParams.endDate = this.customEndDate();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  loadAllData(): void {
    this.loadKPIs();
    this.loadChartData();
  }

  loadKPIs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.analyticsService.getFleetKPIs(this.currentFilter()).subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load KPIs:', err);
        this.error.set('Impossible de charger les KPIs. Veuillez réessayer.');
        this.isLoading.set(false);
      }
    });
  }

  loadChartData(): void {
    this.isChartsLoading.set(true);
    const filter = this.currentFilter();

    forkJoin({
      dailyMetrics: this.analyticsService.getDailyMetrics(filter),
      alertBreakdown: this.analyticsService.getAlertBreakdown(filter),
      truckRanking: this.analyticsService.getTruckRanking(filter, 'DISTANCE', 10)
    }).subscribe({
      next: (results) => {
        this.dailyMetrics.set(results.dailyMetrics.dailyData || []);
        this.alertBreakdown.set(results.alertBreakdown.breakdown || []);
        this.truckRanking.set(results.truckRanking.ranking || []);
        this.isChartsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load chart data:', err);
        this.isChartsLoading.set(false);
      }
    });
  }

  private formatMinutesToHours(minutes: number): number {
    return Math.round((minutes / 60) * 10) / 10;
  }

  // Computed property to check if export is possible
  readonly canExport = computed(() => {
    return this.exportService.hasDataToExport(
      this.kpis(),
      this.dailyMetrics(),
      this.alertBreakdown(),
      this.truckRanking()
    );
  });

  async exportToPdf(): Promise<void> {
    if (!this.canExport()) {
      this.toast.warning('Aucune donnée à exporter');
      return;
    }

    this.isExporting.set(true);
    try {
      await this.exportService.exportToPdf('analytics-dashboard', this.kpis());
      this.toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('PDF export failed:', error);
      this.toast.error('Erreur lors de l\'export PDF');
    } finally {
      this.isExporting.set(false);
    }
  }

  exportToExcel(): void {
    if (!this.canExport()) {
      this.toast.warning('Aucune donnée à exporter');
      return;
    }

    this.isExporting.set(true);
    try {
      this.exportService.exportToExcel(
        this.kpis(),
        this.dailyMetrics(),
        this.alertBreakdown(),
        this.truckRanking()
      );
      this.toast.success('Excel exporté avec succès');
    } catch (error) {
      console.error('Excel export failed:', error);
      this.toast.error('Erreur lors de l\'export Excel');
    } finally {
      this.isExporting.set(false);
    }
  }
}

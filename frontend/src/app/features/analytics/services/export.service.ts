import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  FleetKPI,
  DailyDataPoint,
  AlertTypeCount,
  TruckRankEntry
} from '../../../core/models/analytics.model';

/**
 * Service for exporting analytics data to PDF and Excel.
 * Feature: 006-fleet-analytics
 * T037-T039: Create export.service.ts with PDF and Excel export
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // Colors for PDF
  private readonly PRIMARY_COLOR: [number, number, number] = [25, 118, 210];
  private readonly GRAY_COLOR: [number, number, number] = [100, 100, 100];
  private readonly DARK_COLOR: [number, number, number] = [33, 33, 33];
  private readonly LIGHT_GRAY: [number, number, number] = [245, 245, 245];

  /**
   * Export analytics data to PDF using jsPDF directly.
   * Generates a clean, professional report without html2canvas.
   */
  async exportToPdf(
    elementId: string,
    kpis: FleetKPI | null,
    filename: string = 'analytics-report'
  ): Promise<void> {
    if (!kpis) {
      throw new Error('No data available for PDF export');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Header
    pdf.setFillColor(...this.PRIMARY_COLOR);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rapport Analytics', margin, 18);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('TruckTrack Fleet Management', margin, 28);

    y = 50;

    // Entity & Period Info
    pdf.setTextColor(...this.DARK_COLOR);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informations', margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...this.GRAY_COLOR);

    const infoData = [
      ['Entité:', kpis.entity.name],
      ['Type:', kpis.entity.type === 'FLEET' ? 'Flotte complète' : 'Groupe'],
      ['Camions:', kpis.entity.truckCount.toString()],
      ['Période:', `${kpis.period.startDate} - ${kpis.period.endDate}`],
      ['Jours:', kpis.period.daysCount.toString()],
      ['Généré le:', new Date().toLocaleDateString('fr-FR')]
    ];

    infoData.forEach(([label, value]) => {
      pdf.setTextColor(...this.GRAY_COLOR);
      pdf.text(label, margin, y);
      pdf.setTextColor(...this.DARK_COLOR);
      pdf.text(value, margin + 35, y);
      y += 6;
    });

    y += 10;

    // KPIs Section
    pdf.setTextColor(...this.PRIMARY_COLOR);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Indicateurs Clés de Performance', margin, y);
    y += 10;

    // KPI Grid (2 columns)
    const kpiItems = [
      { label: 'Distance totale', value: `${kpis.totalDistanceKm.toLocaleString('fr-FR')} km` },
      { label: 'Temps de conduite', value: this.formatMinutes(kpis.drivingTimeMinutes) },
      { label: 'Temps d\'inactivité', value: this.formatMinutes(kpis.idleTimeMinutes) },
      { label: 'Vitesse moyenne', value: `${kpis.avgSpeedKmh.toFixed(1)} km/h` },
      { label: 'Vitesse maximale', value: `${kpis.maxSpeedKmh.toFixed(1)} km/h` },
      { label: 'Alertes', value: kpis.alertCount.toString() },
      { label: 'Entrées geofence', value: kpis.geofenceEntries.toString() },
      { label: 'Sorties geofence', value: kpis.geofenceExits.toString() }
    ];

    const colWidth = (pageWidth - 2 * margin - 10) / 2;
    const boxHeight = 18;
    let col = 0;
    let startY = y;

    kpiItems.forEach((item, index) => {
      const x = margin + col * (colWidth + 10);
      const boxY = startY + Math.floor(index / 2) * (boxHeight + 5);

      // Box background
      pdf.setFillColor(...this.LIGHT_GRAY);
      pdf.roundedRect(x, boxY, colWidth, boxHeight, 2, 2, 'F');

      // Label
      pdf.setFontSize(9);
      pdf.setTextColor(...this.GRAY_COLOR);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label, x + 5, boxY + 7);

      // Value
      pdf.setFontSize(12);
      pdf.setTextColor(...this.DARK_COLOR);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.value, x + 5, boxY + 14);

      col = (col + 1) % 2;
    });

    y = startY + Math.ceil(kpiItems.length / 2) * (boxHeight + 5) + 15;

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(...this.GRAY_COLOR);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      'Ce rapport a été généré automatiquement par TruckTrack.',
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save
    pdf.save(`${filename}-${this.formatDate(new Date())}.pdf`);
  }

  /**
   * Format minutes to hours and minutes string.
   */
  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  }

  /**
   * Export analytics data to Excel.
   */
  exportToExcel(
    kpis: FleetKPI | null,
    dailyMetrics: DailyDataPoint[],
    alertBreakdown: AlertTypeCount[],
    truckRanking: TruckRankEntry[],
    filename: string = 'analytics-report'
  ): void {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: KPIs Summary
    if (kpis) {
      const kpiData = [
        ['Rapport Analytics - TruckTrack'],
        [''],
        ['Entité', kpis.entity.name],
        ['Type', kpis.entity.type],
        ['Nombre de camions', kpis.entity.truckCount],
        [''],
        ['Période', `${kpis.period.startDate} - ${kpis.period.endDate}`],
        ['Nombre de jours', kpis.period.daysCount],
        [''],
        ['Indicateurs Clés'],
        ['Distance totale (km)', kpis.totalDistanceKm],
        ['Temps de conduite (min)', kpis.drivingTimeMinutes],
        ['Temps d\'inactivité (min)', kpis.idleTimeMinutes],
        ['Vitesse moyenne (km/h)', kpis.avgSpeedKmh],
        ['Vitesse maximale (km/h)', kpis.maxSpeedKmh],
        ['Nombre d\'alertes', kpis.alertCount],
        ['Entrées geofence', kpis.geofenceEntries],
        ['Sorties geofence', kpis.geofenceExits]
      ];
      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'Résumé KPIs');
    }

    // Sheet 2: Daily Metrics
    if (dailyMetrics.length > 0) {
      const dailyData = [
        ['Date', 'Distance (km)', 'Temps conduite (min)', 'Alertes'],
        ...dailyMetrics.map(d => [d.date, d.distanceKm, d.drivingTimeMinutes, d.alertCount])
      ];
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Données Journalières');
    }

    // Sheet 3: Alert Breakdown
    if (alertBreakdown.length > 0) {
      const alertData = [
        ['Type d\'alerte', 'Nombre', 'Pourcentage (%)'],
        ...alertBreakdown.map(a => [this.formatAlertType(a.alertType), a.count, a.percentage.toFixed(1)])
      ];
      const alertSheet = XLSX.utils.aoa_to_sheet(alertData);
      XLSX.utils.book_append_sheet(workbook, alertSheet, 'Répartition Alertes');
    }

    // Sheet 4: Truck Ranking
    if (truckRanking.length > 0) {
      const rankingData = [
        ['Rang', 'Camion', 'Plaque', 'Valeur', 'Unité'],
        ...truckRanking.map(t => [t.rank, t.truckName, t.licensePlate, t.value, t.unit])
      ];
      const rankingSheet = XLSX.utils.aoa_to_sheet(rankingData);
      XLSX.utils.book_append_sheet(workbook, rankingSheet, 'Classement Camions');
    }

    // Save the workbook
    XLSX.writeFile(workbook, `${filename}-${this.formatDate(new Date())}.xlsx`);
  }

  /**
   * Validate that there is data to export.
   */
  hasDataToExport(
    kpis: FleetKPI | null,
    dailyMetrics: DailyDataPoint[],
    alertBreakdown: AlertTypeCount[],
    truckRanking: TruckRankEntry[]
  ): boolean {
    return kpis !== null || dailyMetrics.length > 0 || alertBreakdown.length > 0 || truckRanking.length > 0;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatAlertType(type: string): string {
    const labels: Record<string, string> = {
      'SPEED_LIMIT': 'Excès de vitesse',
      'GEOFENCE_ENTER': 'Entrée zone',
      'GEOFENCE_EXIT': 'Sortie zone',
      'IDLE': 'Inactivité',
      'OFFLINE': 'Hors ligne'
    };
    return labels[type] || type;
  }
}

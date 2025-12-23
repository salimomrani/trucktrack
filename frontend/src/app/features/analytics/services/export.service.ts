import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import {
  FleetKPI,
  DailyDataPoint,
  AlertTypeCount,
  TruckRankEntry,
  PeriodInfo,
  EntityInfo
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

  /**
   * Export dashboard to PDF using html2canvas.
   */
  async exportToPdf(
    elementId: string,
    kpis: FleetKPI | null,
    filename: string = 'analytics-report'
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(33, 33, 33);
    pdf.text('Rapport Analytics - TruckTrack', 10, 15);

    // Add metadata if KPIs available
    if (kpis) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Entité: ${kpis.entity.name}`, 10, 22);
      pdf.text(`Période: ${kpis.period.startDate} - ${kpis.period.endDate}`, 10, 27);
      pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 10, 32);
    }

    // Add the captured image
    const startY = kpis ? 38 : 22;

    // Check if image fits on page, scale if necessary
    let finalImgHeight = imgHeight;
    let finalImgWidth = imgWidth;

    if (startY + imgHeight > pageHeight - 10) {
      const availableHeight = pageHeight - startY - 10;
      const scale = availableHeight / imgHeight;
      finalImgHeight = availableHeight;
      finalImgWidth = imgWidth * scale;
    }

    pdf.addImage(imgData, 'PNG', 10, startY, finalImgWidth, finalImgHeight);

    // Save the PDF
    pdf.save(`${filename}-${this.formatDate(new Date())}.pdf`);
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

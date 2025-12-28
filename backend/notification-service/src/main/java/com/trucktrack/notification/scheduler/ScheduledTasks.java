package com.trucktrack.notification.scheduler;

import com.trucktrack.notification.service.DailyReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final DailyReportService dailyReportService;

    /**
     * Generate and send daily reports at 7:00 AM every day
     * Cron expression: 0 0 7 * * * (second minute hour day month dayOfWeek)
     */
    @Scheduled(cron = "0 0 7 * * *")
    public void sendDailyReports() {
        log.info("Executing scheduled daily report generation");
        dailyReportService.generateAndSendDailyReports();
    }
}

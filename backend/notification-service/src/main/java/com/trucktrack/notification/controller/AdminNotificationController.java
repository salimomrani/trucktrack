package com.trucktrack.notification.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.notification.dto.NotificationLogDTO;
import com.trucktrack.notification.dto.NotificationStatsDTO;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.NotificationStatus;
import com.trucktrack.notification.service.DailyReportService;
import com.trucktrack.notification.service.NotificationLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationController {

    private final NotificationLogService notificationLogService;
    private final DailyReportService dailyReportService;

    @GetMapping
    public ResponseEntity<Page<NotificationLogDTO>> getAllNotifications(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Admin {} listing notifications (channel: {}, status: {})",
                principal.username(), channel, status);

        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationLogDTO> notifications = notificationLogService.getAllLogs(pageable);

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/stats")
    public ResponseEntity<NotificationStatsDTO> getNotificationStats(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("Admin {} requesting notification stats", principal.username());

        NotificationStatsDTO stats = notificationLogService.getStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/trigger-daily-report")
    public ResponseEntity<Map<String, String>> triggerDailyReport(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("Admin {} triggering manual daily report", principal.username());

        dailyReportService.generateAndSendDailyReports();

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Daily report generation triggered"
        ));
    }

    @PostMapping("/{notificationId}/resend")
    public ResponseEntity<Map<String, String>> resendNotification(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable String notificationId) {

        log.info("Admin {} resending notification {}", principal.username(), notificationId);

        // TODO: Implement resend logic
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification resend queued"
        ));
    }
}

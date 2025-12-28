package com.trucktrack.notification.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.notification.dto.NotificationLogDTO;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.NotificationStatus;
import com.trucktrack.notification.service.NotificationLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications/history")
@RequiredArgsConstructor
@Slf4j
public class NotificationHistoryController {

    private final NotificationLogService notificationLogService;

    @GetMapping
    public ResponseEntity<Page<NotificationLogDTO>> getMyNotificationHistory(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = UUID.fromString(principal.userId());
        log.debug("Getting notification history for user: {}", userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationLogDTO> history = notificationLogService.getByRecipientId(userId, pageable);

        return ResponseEntity.ok(history);
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable UUID notificationId) {

        log.debug("Marking notification {} as read", notificationId);
        notificationLogService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }
}

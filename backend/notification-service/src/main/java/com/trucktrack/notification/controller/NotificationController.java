package com.trucktrack.notification.controller;

import com.trucktrack.notification.model.Notification;
import com.trucktrack.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for notifications
 * T146: Create NotificationController
 */
@Slf4j
@RestController
@RequestMapping("/notification/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get notifications for current user (paginated)
     * GET /notification/v1/notifications?page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Getting notifications for user: {}, page: {}, size: {}", userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getNotificationsForUser(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for current user
     * GET /notification/v1/notifications/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @RequestHeader("X-User-Id") UUID userId) {

        log.debug("Getting unread notifications for user: {}", userId);
        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count for current user
     * GET /notification/v1/notifications/unread/count
     */
    @GetMapping("/unread/count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {

        log.debug("Getting unread count for user: {}", userId);
        long count = notificationService.countUnreadNotifications(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    /**
     * Get notification stats for current user
     * GET /notification/v1/notifications/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<NotificationService.NotificationStats> getStats(
            @RequestHeader("X-User-Id") UUID userId) {

        log.debug("Getting notification stats for user: {}", userId);
        NotificationService.NotificationStats stats = notificationService.getNotificationStats(userId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get notification by ID
     * GET /notification/v1/notifications/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable UUID id) {
        log.debug("Getting notification: {}", id);
        return notificationService.getNotificationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark notification as read
     * PATCH /notification/v1/notifications/{id}/read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable UUID id) {
        log.info("Marking notification as read: {}", id);
        return notificationService.markAsRead(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark all notifications as read for current user
     * POST /notification/v1/notifications/mark-all-read
     */
    @PostMapping("/mark-all-read")
    public ResponseEntity<MarkAllReadResponse> markAllAsRead(
            @RequestHeader("X-User-Id") UUID userId) {

        log.info("Marking all notifications as read for user: {}", userId);
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(new MarkAllReadResponse(count));
    }

    /**
     * Get recent notifications (last 24 hours)
     * GET /notification/v1/notifications/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<Notification>> getRecentNotifications(
            @RequestHeader("X-User-Id") UUID userId) {

        log.debug("Getting recent notifications for user: {}", userId);
        List<Notification> notifications = notificationService.getRecentNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get notifications for a specific truck
     * GET /notification/v1/notifications/truck/{truckId}
     */
    @GetMapping("/truck/{truckId}")
    public ResponseEntity<List<Notification>> getNotificationsForTruck(@PathVariable UUID truckId) {
        log.debug("Getting notifications for truck: {}", truckId);
        List<Notification> notifications = notificationService.getNotificationsForTruck(truckId);
        return ResponseEntity.ok(notifications);
    }

    // Response DTOs
    public record UnreadCountResponse(long count) {}
    public record MarkAllReadResponse(int markedCount) {}
}

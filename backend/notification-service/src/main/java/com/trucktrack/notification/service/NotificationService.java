package com.trucktrack.notification.service;

import com.trucktrack.notification.model.Notification;
import com.trucktrack.notification.model.NotificationSeverity;
import com.trucktrack.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for notification operations
 * T151: Create NotificationService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Get all notifications for a user (paginated)
     */
    public Page<Notification> getNotificationsForUser(UUID userId, Pageable pageable) {
        log.debug("Getting notifications for user: {}", userId);
        return notificationRepository.findByUserIdOrderByTriggeredAtDesc(userId, pageable);
    }

    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(UUID userId) {
        log.debug("Getting unread notifications for user: {}", userId);
        return notificationRepository.findByUserIdAndIsReadFalseOrderByTriggeredAtDesc(userId);
    }

    /**
     * Get notification by ID
     */
    public Optional<Notification> getNotificationById(UUID notificationId) {
        return notificationRepository.findById(notificationId);
    }

    /**
     * Count unread notifications for a user
     */
    public long countUnreadNotifications(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Get notification stats for a user
     */
    public NotificationStats getNotificationStats(UUID userId) {
        long total = notificationRepository.countByUserIdAndIsReadFalse(userId);
        long critical = notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.CRITICAL);
        long warning = notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.WARNING);
        long info = notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.INFO);

        return new NotificationStats(total, critical, warning, info);
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public Optional<Notification> markAsRead(UUID notificationId) {
        log.debug("Marking notification as read: {}", notificationId);
        return notificationRepository.findById(notificationId)
                .map(notification -> {
                    notification.markAsRead();
                    return notificationRepository.save(notification);
                });
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(UUID userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        return notificationRepository.markAllAsReadForUser(userId, Instant.now());
    }

    /**
     * Create and save a new notification
     */
    @Transactional
    public Notification createNotification(Notification notification) {
        log.info("Creating notification for user: {}, truck: {}, type: {}",
                notification.getUserId(), notification.getTruckId(), notification.getNotificationType());
        return notificationRepository.save(notification);
    }

    /**
     * Get notifications for a truck
     */
    public List<Notification> getNotificationsForTruck(UUID truckId) {
        return notificationRepository.findByTruckIdOrderByTriggeredAtDesc(truckId);
    }

    /**
     * Get recent notifications (last 24 hours) - LIMITED to prevent memory issues
     * Default limit: 100 notifications max
     */
    public List<Notification> getRecentNotifications(UUID userId) {
        return getRecentNotifications(userId, 100);
    }

    /**
     * Get recent notifications with custom limit
     */
    public List<Notification> getRecentNotifications(UUID userId, int limit) {
        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        Pageable pageable = PageRequest.of(0, Math.min(limit, 500)); // Cap at 500 max
        return notificationRepository.findRecentByUserId(userId, since, pageable);
    }

    /**
     * Get recent notifications - paginated for infinite scroll
     */
    public Page<Notification> getRecentNotificationsPaged(UUID userId, int page, int size) {
        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50)); // Cap page size at 50
        return notificationRepository.findRecentByUserIdPaged(userId, since, pageable);
    }

    /**
     * Delete old notifications (cleanup)
     */
    @Transactional
    public int deleteOldNotifications(int daysOld) {
        Instant threshold = Instant.now().minus(daysOld, ChronoUnit.DAYS);
        log.info("Deleting notifications older than {} days", daysOld);
        return notificationRepository.deleteOlderThan(threshold);
    }

    /**
     * Notification statistics record
     */
    public record NotificationStats(long unread, long critical, long warning, long info) {}
}

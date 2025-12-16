package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.Notification;
import com.trucktrack.notification.model.NotificationSeverity;
import com.trucktrack.notification.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Notification entity
 * T143: Create NotificationRepository
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Find notifications for a user (paginated, sorted by triggered_at DESC)
     */
    Page<Notification> findByUserIdOrderByTriggeredAtDesc(UUID userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByTriggeredAtDesc(UUID userId);

    /**
     * Find notifications for a truck
     */
    List<Notification> findByTruckIdOrderByTriggeredAtDesc(UUID truckId);

    /**
     * Find notifications by type
     */
    List<Notification> findByNotificationTypeOrderByTriggeredAtDesc(NotificationType type);

    /**
     * Find notifications by severity
     */
    List<Notification> findBySeverityOrderByTriggeredAtDesc(NotificationSeverity severity);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(UUID userId);

    /**
     * Count notifications by severity for a user
     */
    long countByUserIdAndSeverity(UUID userId, NotificationSeverity severity);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") UUID userId, @Param("readAt") Instant readAt);

    /**
     * Find recent notifications for a user (last 24 hours)
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.triggeredAt >= :since ORDER BY n.triggeredAt DESC")
    List<Notification> findRecentByUserId(@Param("userId") UUID userId, @Param("since") Instant since);

    /**
     * Find notifications triggered within a time range
     */
    List<Notification> findByTriggeredAtBetweenOrderByTriggeredAtDesc(Instant startTime, Instant endTime);

    /**
     * Delete old notifications (for cleanup job)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.triggeredAt < :threshold")
    int deleteOlderThan(@Param("threshold") Instant threshold);
}

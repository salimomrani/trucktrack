package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.NotificationLog;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {

    Page<NotificationLog> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<NotificationLog> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);

    Page<NotificationLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<NotificationLog> findByStatusAndRetryCountLessThan(NotificationStatus status, int maxRetries);

    @Query("SELECT n FROM NotificationLog n WHERE " +
           "(:type IS NULL OR n.notificationType = :type) AND " +
           "(:channel IS NULL OR n.channel = :channel) AND " +
           "(:status IS NULL OR n.status = :status) AND " +
           "(:recipientEmail IS NULL OR n.recipientEmail = :recipientEmail) AND " +
           "(:from IS NULL OR n.createdAt >= :from) AND " +
           "(:to IS NULL OR n.createdAt <= :to) " +
           "ORDER BY n.createdAt DESC")
    Page<NotificationLog> findWithFilters(
            @Param("type") NotificationType type,
            @Param("channel") NotificationChannel channel,
            @Param("status") NotificationStatus status,
            @Param("recipientEmail") String recipientEmail,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM NotificationLog n WHERE n.createdAt >= :from AND n.createdAt <= :to")
    long countByPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT n.channel, COUNT(n) FROM NotificationLog n WHERE n.createdAt >= :from AND n.createdAt <= :to GROUP BY n.channel")
    List<Object[]> countByChannelAndPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT n.status, COUNT(n) FROM NotificationLog n WHERE n.createdAt >= :from AND n.createdAt <= :to GROUP BY n.status")
    List<Object[]> countByStatusAndPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT n.notificationType, COUNT(n) FROM NotificationLog n WHERE n.createdAt >= :from AND n.createdAt <= :to GROUP BY n.notificationType")
    List<Object[]> countByTypeAndPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}

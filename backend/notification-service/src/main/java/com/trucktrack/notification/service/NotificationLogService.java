package com.trucktrack.notification.service;

import com.trucktrack.notification.dto.NotificationLogDTO;
import com.trucktrack.notification.dto.NotificationStatsDTO;
import com.trucktrack.notification.model.NotificationLog;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.NotificationStatus;
import com.trucktrack.notification.model.enums.RecipientType;
import com.trucktrack.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationLogService {

    private final NotificationLogRepository notificationLogRepository;

    @Transactional
    public NotificationLog createLog(NotificationType type, NotificationChannel channel,
                                     UUID recipientId, String recipientEmail,
                                     RecipientType recipientType, String subject,
                                     String contentPreview, Map<String, Object> metadata) {
        NotificationLog logEntry = NotificationLog.builder()
                .notificationType(type)
                .channel(channel)
                .recipientId(recipientId)
                .recipientEmail(recipientEmail)
                .recipientType(recipientType)
                .subject(subject)
                .contentPreview(contentPreview)
                .status(NotificationStatus.PENDING)
                .metadata(metadata)
                .build();

        return notificationLogRepository.save(logEntry);
    }

    @Transactional
    public void markAsSent(UUID logId) {
        notificationLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(NotificationStatus.SENT);
            log.setSentAt(LocalDateTime.now());
            notificationLogRepository.save(log);
        });
    }

    @Transactional
    public void markAsDelivered(UUID logId) {
        notificationLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(NotificationStatus.DELIVERED);
            log.setDeliveredAt(LocalDateTime.now());
            notificationLogRepository.save(log);
        });
    }

    @Transactional
    public void markAsRead(UUID logId) {
        notificationLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(NotificationStatus.READ);
            log.setReadAt(LocalDateTime.now());
            notificationLogRepository.save(log);
        });
    }

    @Transactional
    public void markAsFailed(UUID logId, String errorMessage) {
        notificationLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(NotificationStatus.FAILED);
            log.setErrorMessage(errorMessage);
            log.setRetryCount(log.getRetryCount() + 1);
            notificationLogRepository.save(log);
        });
    }

    @Transactional
    public void markAsBounced(UUID logId, String reason) {
        notificationLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(NotificationStatus.BOUNCED);
            log.setErrorMessage(reason);
            notificationLogRepository.save(log);
        });
    }

    public Page<NotificationLogDTO> getByRecipientId(UUID recipientId, Pageable pageable) {
        return notificationLogRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable)
                .map(NotificationLogDTO::fromEntity);
    }

    public Page<NotificationLogDTO> getAllLogs(Pageable pageable) {
        return notificationLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(NotificationLogDTO::fromEntity);
    }

    public NotificationStatsDTO getStats() {
        // Default to last 24 hours
        LocalDateTime to = LocalDateTime.now();
        LocalDateTime from = to.minusDays(1);
        return getStats(from, to);
    }

    public Page<NotificationLogDTO> findWithFilters(NotificationType type, NotificationChannel channel,
                                                     NotificationStatus status, String recipientEmail,
                                                     LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return notificationLogRepository.findWithFilters(type, channel, status, recipientEmail, from, to, pageable)
                .map(NotificationLogDTO::fromEntity);
    }

    public NotificationStatsDTO getStats(LocalDateTime from, LocalDateTime to) {
        long total = notificationLogRepository.countByPeriod(from, to);

        Map<String, Long> byChannel = new HashMap<>();
        notificationLogRepository.countByChannelAndPeriod(from, to)
                .forEach(row -> byChannel.put(row[0].toString(), (Long) row[1]));

        Map<String, Long> byStatus = new HashMap<>();
        notificationLogRepository.countByStatusAndPeriod(from, to)
                .forEach(row -> byStatus.put(row[0].toString(), (Long) row[1]));

        Map<String, Long> byType = new HashMap<>();
        notificationLogRepository.countByTypeAndPeriod(from, to)
                .forEach(row -> byType.put(row[0].toString(), (Long) row[1]));

        long delivered = byStatus.getOrDefault("DELIVERED", 0L) + byStatus.getOrDefault("READ", 0L);
        long bounced = byStatus.getOrDefault("BOUNCED", 0L);
        long read = byStatus.getOrDefault("READ", 0L);

        return NotificationStatsDTO.builder()
                .period(NotificationStatsDTO.PeriodDTO.builder().from(from).to(to).build())
                .totalSent(total)
                .byChannel(byChannel)
                .byStatus(byStatus)
                .byType(byType)
                .deliveryRate(total > 0 ? (double) delivered / total : 0.0)
                .bounceRate(total > 0 ? (double) bounced / total : 0.0)
                .openRate(delivered > 0 ? (double) read / delivered : 0.0)
                .build();
    }

    public List<NotificationLog> getFailedNotificationsForRetry(int maxRetries) {
        return notificationLogRepository.findByStatusAndRetryCountLessThan(NotificationStatus.FAILED, maxRetries);
    }
}

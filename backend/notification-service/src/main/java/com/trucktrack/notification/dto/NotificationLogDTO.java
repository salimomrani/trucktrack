package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.NotificationLog;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.NotificationStatus;
import com.trucktrack.notification.model.enums.RecipientType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class NotificationLogDTO {
    private UUID id;
    private NotificationType notificationType;
    private NotificationChannel channel;
    private UUID recipientId;
    private String recipientEmail;
    private RecipientType recipientType;
    private String subject;
    private String contentPreview;
    private NotificationStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private String errorMessage;
    private Integer retryCount;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;

    public static NotificationLogDTO fromEntity(NotificationLog entity) {
        return NotificationLogDTO.builder()
                .id(entity.getId())
                .notificationType(entity.getNotificationType())
                .channel(entity.getChannel())
                .recipientId(entity.getRecipientId())
                .recipientEmail(entity.getRecipientEmail())
                .recipientType(entity.getRecipientType())
                .subject(entity.getSubject())
                .contentPreview(entity.getContentPreview())
                .status(entity.getStatus())
                .sentAt(entity.getSentAt())
                .deliveredAt(entity.getDeliveredAt())
                .readAt(entity.getReadAt())
                .errorMessage(entity.getErrorMessage())
                .retryCount(entity.getRetryCount())
                .metadata(entity.getMetadata())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.UserNotificationPreference;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationPreferenceDTO {
    private UUID id;
    private NotificationType eventType;
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NotificationPreferenceDTO fromEntity(UserNotificationPreference entity) {
        return NotificationPreferenceDTO.builder()
                .id(entity.getId())
                .eventType(entity.getEventType())
                .emailEnabled(entity.getEmailEnabled())
                .pushEnabled(entity.getPushEnabled())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

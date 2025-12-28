package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.RecipientType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotNull(message = "Notification type is required")
    private NotificationType notificationType;

    @NotNull(message = "Recipient type is required")
    private RecipientType recipientType;

    private UUID recipientId;

    private String recipientEmail;

    private String recipientName;

    private List<NotificationChannel> channels;

    private Map<String, Object> variables;

    private String locale;
}

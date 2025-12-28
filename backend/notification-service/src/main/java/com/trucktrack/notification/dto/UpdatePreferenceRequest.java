package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferenceRequest {

    @NotNull(message = "Event type is required")
    private NotificationType eventType;

    private Boolean emailEnabled;

    private Boolean pushEnabled;
}

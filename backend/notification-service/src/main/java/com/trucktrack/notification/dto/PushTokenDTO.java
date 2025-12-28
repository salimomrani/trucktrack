package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.PushToken;
import com.trucktrack.notification.model.enums.DeviceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PushTokenDTO {
    private UUID id;
    private String token;
    private DeviceType deviceType;
    private String deviceName;
    private Boolean isActive;
    private LocalDateTime lastUsedAt;
    private LocalDateTime createdAt;

    public static PushTokenDTO fromEntity(PushToken entity) {
        return PushTokenDTO.builder()
                .id(entity.getId())
                .token(entity.getToken())
                .deviceType(entity.getDeviceType())
                .deviceName(entity.getDeviceName())
                .isActive(entity.getIsActive())
                .lastUsedAt(entity.getLastUsedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

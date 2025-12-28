package com.trucktrack.notification.dto;

import com.trucktrack.notification.model.enums.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterPushTokenRequest {

    @NotBlank(message = "Token is required")
    @Size(min = 10, max = 500, message = "Token must be between 10 and 500 characters")
    private String token;

    @NotNull(message = "Device type is required")
    private DeviceType deviceType;

    @Size(max = 100, message = "Device name must be at most 100 characters")
    private String deviceName;
}

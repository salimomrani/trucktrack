package com.trucktrack.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating user's Expo push notification token.
 * Feature: 010-trip-management (US3: Push Notifications)
 */
public class UpdatePushTokenRequest {

    @NotBlank(message = "Push token is required")
    @Size(max = 100, message = "Push token must not exceed 100 characters")
    private String pushToken;

    public UpdatePushTokenRequest() {
    }

    public UpdatePushTokenRequest(String pushToken) {
        this.pushToken = pushToken;
    }

    public String getPushToken() {
        return pushToken;
    }

    public void setPushToken(String pushToken) {
        this.pushToken = pushToken;
    }
}

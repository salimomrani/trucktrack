package com.trucktrack.notification.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.notification.dto.NotificationPreferenceDTO;
import com.trucktrack.notification.dto.UpdatePreferenceRequest;
import com.trucktrack.notification.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
@Slf4j
public class PreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<List<NotificationPreferenceDTO>> getMyPreferences(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        UUID userId = UUID.fromString(principal.userId());
        log.debug("Getting preferences for user: {}", userId);

        List<NotificationPreferenceDTO> preferences = preferenceService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping
    public ResponseEntity<List<NotificationPreferenceDTO>> updateMyPreferences(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @Valid @RequestBody List<UpdatePreferenceRequest> requests) {

        UUID userId = UUID.fromString(principal.userId());
        log.info("Updating preferences for user: {} with {} items", userId, requests.size());

        List<NotificationPreferenceDTO> updated = preferenceService.updatePreferences(userId, requests);
        return ResponseEntity.ok(updated);
    }
}

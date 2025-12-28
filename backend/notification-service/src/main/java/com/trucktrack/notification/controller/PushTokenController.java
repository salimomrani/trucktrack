package com.trucktrack.notification.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.notification.dto.PushTokenDTO;
import com.trucktrack.notification.dto.RegisterPushTokenRequest;
import com.trucktrack.notification.model.PushToken;
import com.trucktrack.notification.repository.PushTokenRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications/push-tokens")
@RequiredArgsConstructor
@Slf4j
public class PushTokenController {

    private final PushTokenRepository pushTokenRepository;

    @GetMapping
    public ResponseEntity<List<PushTokenDTO>> getMyPushTokens(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        UUID userId = UUID.fromString(principal.userId());
        log.debug("Getting push tokens for user: {}", userId);

        List<PushTokenDTO> tokens = pushTokenRepository.findByUserIdAndIsActiveTrue(userId).stream()
                .map(PushTokenDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(tokens);
    }

    @PostMapping
    public ResponseEntity<PushTokenDTO> registerPushToken(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @Valid @RequestBody RegisterPushTokenRequest request) {

        UUID userId = UUID.fromString(principal.userId());
        log.info("Registering push token for user: {} (device: {})", userId, request.getDeviceType());

        // Check if token already exists
        if (pushTokenRepository.existsByToken(request.getToken())) {
            // Update existing token to this user
            pushTokenRepository.findByToken(request.getToken()).ifPresent(existing -> {
                existing.setUserId(userId);
                existing.setDeviceType(request.getDeviceType());
                existing.setDeviceName(request.getDeviceName());
                existing.setIsActive(true);
                pushTokenRepository.save(existing);
            });

            PushToken updated = pushTokenRepository.findByToken(request.getToken()).orElseThrow();
            return ResponseEntity.ok(PushTokenDTO.fromEntity(updated));
        }

        // Create new token
        PushToken pushToken = PushToken.builder()
                .userId(userId)
                .token(request.getToken())
                .deviceType(request.getDeviceType())
                .deviceName(request.getDeviceName())
                .isActive(true)
                .build();

        PushToken saved = pushTokenRepository.save(pushToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(PushTokenDTO.fromEntity(saved));
    }

    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> unregisterPushToken(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable UUID tokenId) {

        UUID userId = UUID.fromString(principal.userId());
        log.info("Unregistering push token {} for user: {}", tokenId, userId);

        pushTokenRepository.findById(tokenId).ifPresent(token -> {
            if (token.getUserId().equals(userId)) {
                token.setIsActive(false);
                pushTokenRepository.save(token);
            }
        });

        return ResponseEntity.noContent().build();
    }
}

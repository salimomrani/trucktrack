package com.trucktrack.notification.service;

import com.trucktrack.notification.dto.NotificationPreferenceDTO;
import com.trucktrack.notification.dto.UpdatePreferenceRequest;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.UserNotificationPreference;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.repository.UserNotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceService {

    private final UserNotificationPreferenceRepository preferenceRepository;

    public List<NotificationPreferenceDTO> getPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId).stream()
                .map(NotificationPreferenceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<NotificationPreferenceDTO> updatePreferences(UUID userId, List<UpdatePreferenceRequest> requests) {
        for (UpdatePreferenceRequest request : requests) {
            UserNotificationPreference preference = preferenceRepository
                    .findByUserIdAndEventType(userId, request.getEventType())
                    .orElseGet(() -> UserNotificationPreference.builder()
                            .userId(userId)
                            .eventType(request.getEventType())
                            .build());

            if (request.getEmailEnabled() != null) {
                preference.setEmailEnabled(request.getEmailEnabled());
            }
            if (request.getPushEnabled() != null) {
                preference.setPushEnabled(request.getPushEnabled());
            }

            preferenceRepository.save(preference);
        }

        return getPreferences(userId);
    }

    public boolean isChannelEnabled(UUID userId, NotificationType eventType, NotificationChannel channel) {
        return preferenceRepository.findByUserIdAndEventType(userId, eventType)
                .map(pref -> {
                    if (channel == NotificationChannel.EMAIL) {
                        return pref.getEmailEnabled();
                    } else if (channel == NotificationChannel.PUSH) {
                        return pref.getPushEnabled();
                    }
                    return true;
                })
                .orElse(true); // Default to enabled if no preference exists
    }

    public boolean shouldSendNotification(UUID userId, NotificationType eventType, NotificationChannel channel) {
        // If user has no account (null userId), use default (send everything)
        if (userId == null) {
            return true;
        }
        return isChannelEnabled(userId, eventType, channel);
    }
}

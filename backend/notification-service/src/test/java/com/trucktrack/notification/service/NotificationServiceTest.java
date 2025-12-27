package com.trucktrack.notification.service;

import com.trucktrack.notification.model.Notification;
import com.trucktrack.notification.model.NotificationSeverity;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService - notification CRUD and queries.
 * Tests notification creation, marking as read, and statistics.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;
    private UUID truckId;
    private UUID alertRuleId;
    private UUID notificationId;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        truckId = UUID.randomUUID();
        alertRuleId = UUID.randomUUID();
        notificationId = UUID.randomUUID();

        testNotification = Notification.builder()
            .id(notificationId)
            .userId(userId)
            .truckId(truckId)
            .alertRuleId(alertRuleId)
            .notificationType(NotificationType.SPEED_LIMIT)
            .title("Speed Limit Alert")
            .message("Truck exceeded speed limit: 130 km/h")
            .severity(NotificationSeverity.WARNING)
            .latitude(BigDecimal.valueOf(48.8566))
            .longitude(BigDecimal.valueOf(2.3522))
            .triggeredAt(Instant.now())
            .isRead(false)
            .build();
    }

    @Nested
    @DisplayName("getNotificationsForUser")
    class GetNotificationsForUser {

        @Test
        @DisplayName("should return paginated notifications for user")
        void should_returnPaginatedNotifications() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Notification> page = new PageImpl<>(List.of(testNotification));
            when(notificationRepository.findByUserIdOrderByTriggeredAtDesc(userId, pageable))
                .thenReturn(page);

            // When
            Page<Notification> result = notificationService.getNotificationsForUser(userId, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getUserId()).isEqualTo(userId);
        }
    }

    @Nested
    @DisplayName("getUnreadNotifications")
    class GetUnreadNotifications {

        @Test
        @DisplayName("should return only unread notifications")
        void should_returnOnlyUnread() {
            // Given
            when(notificationRepository.findByUserIdAndIsReadFalseOrderByTriggeredAtDesc(userId))
                .thenReturn(List.of(testNotification));

            // When
            List<Notification> result = notificationService.getUnreadNotifications(userId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsRead()).isFalse();
        }
    }

    @Nested
    @DisplayName("countUnreadNotifications")
    class CountUnreadNotifications {

        @Test
        @DisplayName("should return correct unread count")
        void should_returnCorrectCount() {
            // Given
            when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(5L);

            // When
            long count = notificationService.countUnreadNotifications(userId);

            // Then
            assertThat(count).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("getNotificationStats")
    class GetNotificationStats {

        @Test
        @DisplayName("should return stats by severity")
        void should_returnStatsBySeverity() {
            // Given
            when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(10L);
            when(notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.CRITICAL))
                .thenReturn(2L);
            when(notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.WARNING))
                .thenReturn(5L);
            when(notificationRepository.countByUserIdAndSeverity(userId, NotificationSeverity.INFO))
                .thenReturn(3L);

            // When
            NotificationService.NotificationStats stats = notificationService.getNotificationStats(userId);

            // Then
            assertThat(stats.unread()).isEqualTo(10L);
            assertThat(stats.critical()).isEqualTo(2L);
            assertThat(stats.warning()).isEqualTo(5L);
            assertThat(stats.info()).isEqualTo(3L);
        }
    }

    @Nested
    @DisplayName("markAsRead")
    class MarkAsRead {

        @Test
        @DisplayName("should mark notification as read and set readAt")
        void should_markAsRead() {
            // Given
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(testNotification));
            when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

            // When
            Instant before = Instant.now();
            Optional<Notification> result = notificationService.markAsRead(notificationId);
            Instant after = Instant.now();

            // Then
            assertThat(result).isPresent();
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getIsRead()).isTrue();
            assertThat(saved.getReadAt()).isAfterOrEqualTo(before);
            assertThat(saved.getReadAt()).isBeforeOrEqualTo(after);
        }

        @Test
        @DisplayName("should return empty when notification not found")
        void should_returnEmpty_when_notFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(notificationRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When
            Optional<Notification> result = notificationService.markAsRead(unknownId);

            // Then
            assertThat(result).isEmpty();
            verify(notificationRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("markAllAsRead")
    class MarkAllAsRead {

        @Test
        @DisplayName("should call repository to mark all as read")
        void should_markAllAsRead() {
            // Given
            when(notificationRepository.markAllAsReadForUser(eq(userId), any(Instant.class)))
                .thenReturn(5);

            // When
            int count = notificationService.markAllAsRead(userId);

            // Then
            assertThat(count).isEqualTo(5);
            verify(notificationRepository).markAllAsReadForUser(eq(userId), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("createNotification")
    class CreateNotification {

        @Test
        @DisplayName("should save and return notification")
        void should_saveNotification() {
            // Given
            Notification newNotification = Notification.builder()
                .userId(userId)
                .truckId(truckId)
                .alertRuleId(alertRuleId)
                .notificationType(NotificationType.GEOFENCE_ENTER)
                .title("Geofence Entry Alert")
                .message("Truck entered zone")
                .severity(NotificationSeverity.INFO)
                .triggeredAt(Instant.now())
                .build();

            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(UUID.randomUUID());
                return n;
            });

            // When
            Notification result = notificationService.createNotification(newNotification);

            // Then
            assertThat(result.getId()).isNotNull();
            verify(notificationRepository).save(newNotification);
        }
    }

    @Nested
    @DisplayName("getNotificationsForTruck")
    class GetNotificationsForTruck {

        @Test
        @DisplayName("should return notifications for specific truck")
        void should_returnTruckNotifications() {
            // Given
            when(notificationRepository.findByTruckIdOrderByTriggeredAtDesc(truckId))
                .thenReturn(List.of(testNotification));

            // When
            List<Notification> result = notificationService.getNotificationsForTruck(truckId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo(truckId);
        }
    }

    @Nested
    @DisplayName("getRecentNotifications")
    class GetRecentNotifications {

        @Test
        @DisplayName("should return recent notifications with default limit")
        void should_returnRecentWithDefaultLimit() {
            // Given
            when(notificationRepository.findRecentByUserId(eq(userId), any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(testNotification));

            // When
            List<Notification> result = notificationService.getRecentNotifications(userId);

            // Then
            assertThat(result).hasSize(1);
            verify(notificationRepository).findRecentByUserId(
                eq(userId),
                any(Instant.class),
                argThat(pageable -> pageable.getPageSize() == 100)
            );
        }

        @Test
        @DisplayName("should respect custom limit")
        void should_respectCustomLimit() {
            // Given
            when(notificationRepository.findRecentByUserId(eq(userId), any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(testNotification));

            // When
            notificationService.getRecentNotifications(userId, 50);

            // Then
            verify(notificationRepository).findRecentByUserId(
                eq(userId),
                any(Instant.class),
                argThat(pageable -> pageable.getPageSize() == 50)
            );
        }

        @Test
        @DisplayName("should cap limit at 500")
        void should_capLimitAt500() {
            // Given
            when(notificationRepository.findRecentByUserId(eq(userId), any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of());

            // When
            notificationService.getRecentNotifications(userId, 1000);

            // Then
            verify(notificationRepository).findRecentByUserId(
                eq(userId),
                any(Instant.class),
                argThat(pageable -> pageable.getPageSize() == 500)
            );
        }
    }

    @Nested
    @DisplayName("deleteOldNotifications")
    class DeleteOldNotifications {

        @Test
        @DisplayName("should delete notifications older than specified days")
        void should_deleteOldNotifications() {
            // Given
            when(notificationRepository.deleteOlderThan(any(Instant.class))).thenReturn(10);

            // When
            int deleted = notificationService.deleteOldNotifications(30);

            // Then
            assertThat(deleted).isEqualTo(10);
            verify(notificationRepository).deleteOlderThan(any(Instant.class));
        }
    }
}

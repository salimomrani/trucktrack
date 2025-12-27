package com.trucktrack.notification.service;

import com.trucktrack.common.event.AlertTriggeredEvent;
import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.notification.client.LocationServiceClient;
import com.trucktrack.notification.model.AlertRule;
import com.trucktrack.notification.model.AlertRuleType;
import com.trucktrack.notification.model.Notification;
import com.trucktrack.notification.websocket.NotificationWebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AlertRuleEngine - alert evaluation and processing.
 * Tests speed limit rules, geofence rules, and alert generation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AlertRuleEngine")
class AlertRuleEngineTest {

    @Mock
    private AlertRuleService alertRuleService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private LocationServiceClient locationServiceClient;

    @Mock
    private GeofenceStateCache geofenceStateCache;

    @Mock
    private KafkaTemplate<String, AlertTriggeredEvent> kafkaTemplate;

    @Mock
    private NotificationWebSocketService webSocketService;

    @Mock
    private TruckLookupService truckLookupService;

    @Mock
    private AlertCooldownCache alertCooldownCache;

    @InjectMocks
    private AlertRuleEngine alertRuleEngine;

    private GPSPositionEvent testEvent;
    private UUID truckId;
    private UUID ruleId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(alertRuleEngine, "alertTopic", "test-alert-topic");
        ReflectionTestUtils.setField(alertRuleEngine, "defaultSpeedLimit", 120);

        truckId = UUID.randomUUID();
        ruleId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testEvent = new GPSPositionEvent();
        testEvent.setEventId(UUID.randomUUID().toString());
        testEvent.setTruckId(truckId.toString());
        testEvent.setTruckIdReadable("TRK-001");
        testEvent.setLatitude(48.8566);
        testEvent.setLongitude(2.3522);
        testEvent.setSpeed(60.0);
        testEvent.setTimestamp(Instant.now());
    }

    @Nested
    @DisplayName("evaluateSpeedLimitRules")
    class EvaluateSpeedLimitRules {

        @Test
        @DisplayName("should not trigger alert when speed is below threshold")
        void should_notTrigger_when_speedBelowThreshold() {
            // Given
            testEvent.setSpeed(100.0);
            AlertRule rule = createSpeedLimitRule(120);
            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of(rule));
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of());

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(AlertTriggeredEvent.class));
        }

        @Test
        @DisplayName("should trigger alert when speed exceeds threshold")
        void should_triggerAlert_when_speedExceedsThreshold() {
            // Given
            testEvent.setSpeed(130.0);
            AlertRule rule = createSpeedLimitRule(120);
            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of(rule));
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of());
            when(alertCooldownCache.checkAndRecord(anyString(), any(UUID.class))).thenReturn(true);

            CompletableFuture<SendResult<String, AlertTriggeredEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(AlertTriggeredEvent.class)))
                .thenReturn(future);

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            ArgumentCaptor<AlertTriggeredEvent> captor = ArgumentCaptor.forClass(AlertTriggeredEvent.class);
            verify(kafkaTemplate).send(eq("test-alert-topic"), eq(truckId.toString()), captor.capture());

            AlertTriggeredEvent event = captor.getValue();
            assertThat(event.getAlertType()).isEqualTo(AlertTriggeredEvent.AlertType.SPEED_LIMIT);
            assertThat(event.getSeverity()).isEqualTo(AlertTriggeredEvent.Severity.WARNING);
            assertThat(event.getMessage()).contains("130");
        }

        @Test
        @DisplayName("should use default speed limit when rule has no threshold")
        void should_useDefaultSpeedLimit_when_noThreshold() {
            // Given
            testEvent.setSpeed(125.0); // Above default 120
            AlertRule rule = createSpeedLimitRule(null);
            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of(rule));
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of());
            when(alertCooldownCache.checkAndRecord(anyString(), any(UUID.class))).thenReturn(true);

            CompletableFuture<SendResult<String, AlertTriggeredEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(AlertTriggeredEvent.class)))
                .thenReturn(future);

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            verify(kafkaTemplate).send(anyString(), anyString(), any(AlertTriggeredEvent.class));
        }

        @Test
        @DisplayName("should not trigger alert when cooldown is active")
        void should_notTrigger_when_cooldownActive() {
            // Given
            testEvent.setSpeed(130.0);
            AlertRule rule = createSpeedLimitRule(120);
            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of(rule));
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of());
            when(alertCooldownCache.checkAndRecord(anyString(), any(UUID.class))).thenReturn(false);

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(AlertTriggeredEvent.class));
        }

        @Test
        @DisplayName("should skip evaluation when speed is null")
        void should_skipEvaluation_when_speedNull() {
            // Given
            testEvent.setSpeed(null);
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of());

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then - no speed limit rules are evaluated when speed is null
            verify(alertCooldownCache, never()).checkAndRecord(anyString(), any());
        }
    }

    @Nested
    @DisplayName("evaluateGeofenceRules")
    class EvaluateGeofenceRules {

        @Test
        @DisplayName("should trigger GEOFENCE_ENTER alert when truck enters geofence")
        void should_triggerEnterAlert_when_truckEntersGeofence() {
            // Given
            UUID geofenceId = UUID.randomUUID();
            AlertRule rule = createGeofenceRule(AlertRuleType.GEOFENCE_ENTER, geofenceId);

            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of());
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of(rule));
            when(locationServiceClient.isPointInsideGeofence(geofenceId, 48.8566, 2.3522))
                .thenReturn(true);
            when(geofenceStateCache.checkStateChange(any(UUID.class), eq(geofenceId), eq(true)))
                .thenReturn(new GeofenceStateCache.StateChange(
                    truckId, geofenceId, GeofenceStateCache.StateChangeType.ENTERED, Instant.now()));
            when(alertCooldownCache.checkAndRecord(anyString(), any(UUID.class))).thenReturn(true);

            CompletableFuture<SendResult<String, AlertTriggeredEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(AlertTriggeredEvent.class)))
                .thenReturn(future);

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            ArgumentCaptor<AlertTriggeredEvent> captor = ArgumentCaptor.forClass(AlertTriggeredEvent.class);
            verify(kafkaTemplate).send(eq("test-alert-topic"), eq(truckId.toString()), captor.capture());

            AlertTriggeredEvent event = captor.getValue();
            assertThat(event.getAlertType()).isEqualTo(AlertTriggeredEvent.AlertType.GEOFENCE_ENTER);
            assertThat(event.getMessage()).contains("entered");
        }

        @Test
        @DisplayName("should trigger GEOFENCE_EXIT alert when truck exits geofence")
        void should_triggerExitAlert_when_truckExitsGeofence() {
            // Given
            UUID geofenceId = UUID.randomUUID();
            AlertRule rule = createGeofenceRule(AlertRuleType.GEOFENCE_EXIT, geofenceId);

            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of());
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of(rule));
            when(locationServiceClient.isPointInsideGeofence(geofenceId, 48.8566, 2.3522))
                .thenReturn(false);
            when(geofenceStateCache.checkStateChange(any(UUID.class), eq(geofenceId), eq(false)))
                .thenReturn(new GeofenceStateCache.StateChange(
                    truckId, geofenceId, GeofenceStateCache.StateChangeType.EXITED, Instant.now()));
            when(alertCooldownCache.checkAndRecord(anyString(), any(UUID.class))).thenReturn(true);

            CompletableFuture<SendResult<String, AlertTriggeredEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(AlertTriggeredEvent.class)))
                .thenReturn(future);

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            ArgumentCaptor<AlertTriggeredEvent> captor = ArgumentCaptor.forClass(AlertTriggeredEvent.class);
            verify(kafkaTemplate).send(eq("test-alert-topic"), eq(truckId.toString()), captor.capture());

            AlertTriggeredEvent event = captor.getValue();
            assertThat(event.getAlertType()).isEqualTo(AlertTriggeredEvent.AlertType.GEOFENCE_EXIT);
            assertThat(event.getMessage()).contains("exited");
        }

        @Test
        @DisplayName("should not trigger alert when no state change")
        void should_notTrigger_when_noStateChange() {
            // Given
            UUID geofenceId = UUID.randomUUID();
            AlertRule rule = createGeofenceRule(AlertRuleType.GEOFENCE_ENTER, geofenceId);

            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of());
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of(rule));
            when(locationServiceClient.isPointInsideGeofence(geofenceId, 48.8566, 2.3522))
                .thenReturn(true);
            when(geofenceStateCache.checkStateChange(any(UUID.class), eq(geofenceId), eq(true)))
                .thenReturn(null); // No state change

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(AlertTriggeredEvent.class));
        }

        @Test
        @DisplayName("should skip geofence rule with null geofenceId")
        void should_skipRule_when_geofenceIdNull() {
            // Given
            AlertRule rule = AlertRule.builder()
                .id(ruleId)
                .name("Invalid Rule")
                .ruleType(AlertRuleType.GEOFENCE_ENTER)
                .geofenceId(null)
                .isEnabled(true)
                .createdBy(userId)
                .build();

            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of());
            when(alertRuleService.getEnabledGeofenceRules()).thenReturn(List.of(rule));

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then
            verify(locationServiceClient, never()).isPointInsideGeofence(any(), anyDouble(), anyDouble());
        }

        @Test
        @DisplayName("should skip evaluation when coordinates are null")
        void should_skipEvaluation_when_coordinatesNull() {
            // Given
            testEvent.setLatitude(null);
            testEvent.setLongitude(null);

            when(alertRuleService.getEnabledSpeedLimitRules()).thenReturn(List.of());

            // When
            alertRuleEngine.evaluateRules(testEvent);

            // Then - geofence rules are skipped when coordinates are null
            verify(geofenceStateCache, never()).checkStateChange(any(), any(), anyBoolean());
        }
    }

    @Nested
    @DisplayName("processAlertEvent")
    class ProcessAlertEvent {

        @Test
        @DisplayName("should create notification for each affected user")
        void should_createNotification_forEachUser() {
            // Given
            AlertTriggeredEvent alertEvent = createAlertTriggeredEvent();
            alertEvent.setAffectedUserIds(List.of(userId.toString(), UUID.randomUUID().toString()));

            when(notificationService.createNotification(any(Notification.class)))
                .thenReturn(Notification.builder().id(UUID.randomUUID()).build());

            // When
            alertRuleEngine.processAlertEvent(alertEvent);

            // Then
            verify(notificationService, times(2)).createNotification(any(Notification.class));
            verify(webSocketService, times(2)).sendToUser(anyString(), any(Notification.class));
            verify(webSocketService, times(2)).broadcastNotification(any(Notification.class));
        }

        @Test
        @DisplayName("should not create notification when no affected users")
        void should_notCreate_when_noAffectedUsers() {
            // Given
            AlertTriggeredEvent alertEvent = createAlertTriggeredEvent();
            alertEvent.setAffectedUserIds(null);

            // When
            alertRuleEngine.processAlertEvent(alertEvent);

            // Then
            verify(notificationService, never()).createNotification(any());
        }

        @Test
        @DisplayName("should skip invalid user IDs")
        void should_skipInvalidUserIds() {
            // Given
            AlertTriggeredEvent alertEvent = createAlertTriggeredEvent();
            alertEvent.setAffectedUserIds(List.of("invalid-uuid", userId.toString()));

            when(notificationService.createNotification(any(Notification.class)))
                .thenReturn(Notification.builder().id(UUID.randomUUID()).build());

            // When
            alertRuleEngine.processAlertEvent(alertEvent);

            // Then - only one notification created (valid UUID)
            verify(notificationService, times(1)).createNotification(any(Notification.class));
        }

        @Test
        @DisplayName("should map alert type to notification type correctly")
        void should_mapAlertTypeCorrectly() {
            // Given
            AlertTriggeredEvent alertEvent = createAlertTriggeredEvent();
            alertEvent.setAlertType(AlertTriggeredEvent.AlertType.GEOFENCE_ENTER);
            alertEvent.setAffectedUserIds(List.of(userId.toString()));

            when(notificationService.createNotification(any(Notification.class)))
                .thenReturn(Notification.builder().id(UUID.randomUUID()).build());

            // When
            alertRuleEngine.processAlertEvent(alertEvent);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationService).createNotification(captor.capture());
            assertThat(captor.getValue().getTitle()).isEqualTo("Geofence Entry Alert");
        }
    }

    private AlertRule createSpeedLimitRule(Integer threshold) {
        return AlertRule.builder()
            .id(ruleId)
            .name("Speed Limit Rule")
            .ruleType(AlertRuleType.SPEED_LIMIT)
            .thresholdValue(threshold)
            .isEnabled(true)
            .createdBy(userId)
            .notificationChannels(List.of("IN_APP"))
            .build();
    }

    private AlertRule createGeofenceRule(AlertRuleType type, UUID geofenceId) {
        return AlertRule.builder()
            .id(ruleId)
            .name("Geofence Rule")
            .ruleType(type)
            .geofenceId(geofenceId)
            .isEnabled(true)
            .createdBy(userId)
            .notificationChannels(List.of("IN_APP"))
            .build();
    }

    private AlertTriggeredEvent createAlertTriggeredEvent() {
        AlertTriggeredEvent event = new AlertTriggeredEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setAlertRuleId(ruleId.toString());
        event.setTruckId(truckId.toString());
        event.setTruckIdReadable("TRK-001");
        event.setAlertType(AlertTriggeredEvent.AlertType.SPEED_LIMIT);
        event.setSeverity(AlertTriggeredEvent.Severity.WARNING);
        event.setMessage("Test alert message");
        event.setLatitude(48.8566);
        event.setLongitude(2.3522);
        event.setTriggeredAt(Instant.now());
        return event;
    }
}

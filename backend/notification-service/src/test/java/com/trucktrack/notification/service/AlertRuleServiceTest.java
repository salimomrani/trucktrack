package com.trucktrack.notification.service;

import com.trucktrack.notification.model.AlertRule;
import com.trucktrack.notification.model.AlertRuleType;
import com.trucktrack.notification.repository.AlertRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AlertRuleService - alert rule CRUD operations.
 * Tests rule creation, updates, filtering, and enable/disable logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AlertRuleService")
class AlertRuleServiceTest {

    @Mock
    private AlertRuleRepository alertRuleRepository;

    @InjectMocks
    private AlertRuleService alertRuleService;

    private UUID ruleId;
    private UUID userId;
    private AlertRule testRule;

    @BeforeEach
    void setUp() {
        ruleId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testRule = AlertRule.builder()
            .id(ruleId)
            .name("Speed Alert")
            .description("Alert when speed exceeds limit")
            .ruleType(AlertRuleType.SPEED_LIMIT)
            .thresholdValue(120)
            .isEnabled(true)
            .createdBy(userId)
            .notificationChannels(List.of("IN_APP", "PUSH"))
            .build();
    }

    @Nested
    @DisplayName("getAlertRuleById")
    class GetAlertRuleById {

        @Test
        @DisplayName("should return rule when found")
        void should_returnRule_when_found() {
            // Given
            when(alertRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));

            // When
            Optional<AlertRule> result = alertRuleService.getAlertRuleById(ruleId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Speed Alert");
        }

        @Test
        @DisplayName("should return empty when rule not found")
        void should_returnEmpty_when_notFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(alertRuleRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When
            Optional<AlertRule> result = alertRuleService.getAlertRuleById(unknownId);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getEnabledAlertRules")
    class GetEnabledAlertRules {

        @Test
        @DisplayName("should return only enabled rules")
        void should_returnOnlyEnabledRules() {
            // Given
            List<AlertRule> enabledRules = List.of(testRule);
            when(alertRuleRepository.findByIsEnabledTrue()).thenReturn(enabledRules);

            // When
            List<AlertRule> result = alertRuleService.getEnabledAlertRules();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsEnabled()).isTrue();
        }
    }

    @Nested
    @DisplayName("getAlertRulesByType")
    class GetAlertRulesByType {

        @Test
        @DisplayName("should filter rules by type")
        void should_filterByType() {
            // Given
            when(alertRuleRepository.findByRuleType(AlertRuleType.SPEED_LIMIT))
                .thenReturn(List.of(testRule));

            // When
            List<AlertRule> result = alertRuleService.getAlertRulesByType(AlertRuleType.SPEED_LIMIT);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRuleType()).isEqualTo(AlertRuleType.SPEED_LIMIT);
        }
    }

    @Nested
    @DisplayName("getAlertRulesForUser")
    class GetAlertRulesForUser {

        @Test
        @DisplayName("should return rules created by user")
        void should_returnUserRules() {
            // Given
            when(alertRuleRepository.findByCreatedByOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(testRule));

            // When
            List<AlertRule> result = alertRuleService.getAlertRulesForUser(userId);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCreatedBy()).isEqualTo(userId);
        }
    }

    @Nested
    @DisplayName("createAlertRule")
    class CreateAlertRule {

        @Test
        @DisplayName("should save and return new rule")
        void should_saveNewRule() {
            // Given
            AlertRule newRule = AlertRule.builder()
                .name("Geofence Alert")
                .ruleType(AlertRuleType.GEOFENCE_ENTER)
                .geofenceId(UUID.randomUUID())
                .isEnabled(true)
                .createdBy(userId)
                .build();

            when(alertRuleRepository.save(any(AlertRule.class))).thenAnswer(inv -> {
                AlertRule r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            // When
            AlertRule result = alertRuleService.createAlertRule(newRule);

            // Then
            assertThat(result.getId()).isNotNull();
            verify(alertRuleRepository).save(newRule);
        }
    }

    @Nested
    @DisplayName("updateAlertRule")
    class UpdateAlertRule {

        @Test
        @DisplayName("should update existing rule")
        void should_updateExistingRule() {
            // Given
            when(alertRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(alertRuleRepository.save(any(AlertRule.class))).thenReturn(testRule);

            AlertRule updates = AlertRule.builder()
                .name("Updated Speed Alert")
                .description("Updated description")
                .ruleType(AlertRuleType.SPEED_LIMIT)
                .thresholdValue(100)
                .isEnabled(true)
                .notificationChannels(List.of("IN_APP"))
                .build();

            // When
            Optional<AlertRule> result = alertRuleService.updateAlertRule(ruleId, updates);

            // Then
            assertThat(result).isPresent();
            ArgumentCaptor<AlertRule> captor = ArgumentCaptor.forClass(AlertRule.class);
            verify(alertRuleRepository).save(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Updated Speed Alert");
            assertThat(captor.getValue().getThresholdValue()).isEqualTo(100);
        }

        @Test
        @DisplayName("should return empty when rule not found")
        void should_returnEmpty_when_ruleNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(alertRuleRepository.findById(unknownId)).thenReturn(Optional.empty());

            AlertRule updates = AlertRule.builder().name("Update").build();

            // When
            Optional<AlertRule> result = alertRuleService.updateAlertRule(unknownId, updates);

            // Then
            assertThat(result).isEmpty();
            verify(alertRuleRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("setEnabled")
    class SetEnabled {

        @Test
        @DisplayName("should enable rule")
        void should_enableRule() {
            // Given
            testRule.setIsEnabled(false);
            when(alertRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(alertRuleRepository.save(any(AlertRule.class))).thenReturn(testRule);

            // When
            Optional<AlertRule> result = alertRuleService.setEnabled(ruleId, true);

            // Then
            assertThat(result).isPresent();
            ArgumentCaptor<AlertRule> captor = ArgumentCaptor.forClass(AlertRule.class);
            verify(alertRuleRepository).save(captor.capture());
            assertThat(captor.getValue().getIsEnabled()).isTrue();
        }

        @Test
        @DisplayName("should disable rule")
        void should_disableRule() {
            // Given
            testRule.setIsEnabled(true);
            when(alertRuleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
            when(alertRuleRepository.save(any(AlertRule.class))).thenReturn(testRule);

            // When
            Optional<AlertRule> result = alertRuleService.setEnabled(ruleId, false);

            // Then
            assertThat(result).isPresent();
            ArgumentCaptor<AlertRule> captor = ArgumentCaptor.forClass(AlertRule.class);
            verify(alertRuleRepository).save(captor.capture());
            assertThat(captor.getValue().getIsEnabled()).isFalse();
        }
    }

    @Nested
    @DisplayName("deleteAlertRule")
    class DeleteAlertRule {

        @Test
        @DisplayName("should delete existing rule")
        void should_deleteExistingRule() {
            // Given
            when(alertRuleRepository.existsById(ruleId)).thenReturn(true);

            // When
            boolean result = alertRuleService.deleteAlertRule(ruleId);

            // Then
            assertThat(result).isTrue();
            verify(alertRuleRepository).deleteById(ruleId);
        }

        @Test
        @DisplayName("should return false when rule not found")
        void should_returnFalse_when_ruleNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(alertRuleRepository.existsById(unknownId)).thenReturn(false);

            // When
            boolean result = alertRuleService.deleteAlertRule(unknownId);

            // Then
            assertThat(result).isFalse();
            verify(alertRuleRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("getEnabledSpeedLimitRules")
    class GetEnabledSpeedLimitRules {

        @Test
        @DisplayName("should return enabled speed limit rules")
        void should_returnEnabledSpeedLimitRules() {
            // Given
            when(alertRuleRepository.findEnabledSpeedLimitRules()).thenReturn(List.of(testRule));

            // When
            List<AlertRule> result = alertRuleService.getEnabledSpeedLimitRules();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRuleType()).isEqualTo(AlertRuleType.SPEED_LIMIT);
        }
    }

    @Nested
    @DisplayName("getEnabledGeofenceRules")
    class GetEnabledGeofenceRules {

        @Test
        @DisplayName("should return both enter and exit geofence rules")
        void should_returnBothGeofenceRuleTypes() {
            // Given
            AlertRule enterRule = AlertRule.builder()
                .id(UUID.randomUUID())
                .name("Enter Zone")
                .ruleType(AlertRuleType.GEOFENCE_ENTER)
                .geofenceId(UUID.randomUUID())
                .isEnabled(true)
                .build();

            AlertRule exitRule = AlertRule.builder()
                .id(UUID.randomUUID())
                .name("Exit Zone")
                .ruleType(AlertRuleType.GEOFENCE_EXIT)
                .geofenceId(UUID.randomUUID())
                .isEnabled(true)
                .build();

            when(alertRuleRepository.findEnabledGeofenceRules())
                .thenReturn(List.of(enterRule, exitRule));

            // When
            List<AlertRule> result = alertRuleService.getEnabledGeofenceRules();

            // Then
            assertThat(result).hasSize(2);
        }
    }
}

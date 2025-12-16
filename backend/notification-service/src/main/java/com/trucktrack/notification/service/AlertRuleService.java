package com.trucktrack.notification.service;

import com.trucktrack.notification.model.AlertRule;
import com.trucktrack.notification.model.AlertRuleType;
import com.trucktrack.notification.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for alert rule operations
 * T148: Create AlertRuleService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;

    /**
     * Get all alert rules
     */
    public List<AlertRule> getAllAlertRules() {
        return alertRuleRepository.findAll();
    }

    /**
     * Get enabled alert rules
     */
    public List<AlertRule> getEnabledAlertRules() {
        return alertRuleRepository.findByIsEnabledTrue();
    }

    /**
     * Get alert rule by ID
     */
    public Optional<AlertRule> getAlertRuleById(UUID id) {
        return alertRuleRepository.findById(id);
    }

    /**
     * Get alert rules by type
     */
    public List<AlertRule> getAlertRulesByType(AlertRuleType type) {
        return alertRuleRepository.findByRuleType(type);
    }

    /**
     * Get enabled alert rules by type
     */
    public List<AlertRule> getEnabledAlertRulesByType(AlertRuleType type) {
        return alertRuleRepository.findByRuleTypeAndIsEnabledTrue(type);
    }

    /**
     * Get alert rules for a user
     */
    public List<AlertRule> getAlertRulesForUser(UUID userId) {
        return alertRuleRepository.findByCreatedByOrderByCreatedAtDesc(userId);
    }

    /**
     * Create a new alert rule
     */
    @Transactional
    public AlertRule createAlertRule(AlertRule alertRule) {
        log.info("Creating alert rule: {} of type {}", alertRule.getName(), alertRule.getRuleType());
        return alertRuleRepository.save(alertRule);
    }

    /**
     * Update an alert rule
     */
    @Transactional
    public Optional<AlertRule> updateAlertRule(UUID id, AlertRule updates) {
        return alertRuleRepository.findById(id)
                .map(existing -> {
                    existing.setName(updates.getName());
                    existing.setDescription(updates.getDescription());
                    existing.setRuleType(updates.getRuleType());
                    existing.setThresholdValue(updates.getThresholdValue());
                    existing.setGeofenceId(updates.getGeofenceId());
                    existing.setTruckGroupId(updates.getTruckGroupId());
                    existing.setIsEnabled(updates.getIsEnabled());
                    existing.setNotificationChannels(updates.getNotificationChannels());
                    log.info("Updated alert rule: {}", id);
                    return alertRuleRepository.save(existing);
                });
    }

    /**
     * Enable or disable an alert rule
     */
    @Transactional
    public Optional<AlertRule> setEnabled(UUID id, boolean enabled) {
        return alertRuleRepository.findById(id)
                .map(rule -> {
                    rule.setIsEnabled(enabled);
                    log.info("Alert rule {} set to enabled={}", id, enabled);
                    return alertRuleRepository.save(rule);
                });
    }

    /**
     * Delete an alert rule
     */
    @Transactional
    public boolean deleteAlertRule(UUID id) {
        if (alertRuleRepository.existsById(id)) {
            alertRuleRepository.deleteById(id);
            log.info("Deleted alert rule: {}", id);
            return true;
        }
        return false;
    }

    /**
     * Get enabled offline rules
     */
    public List<AlertRule> getEnabledOfflineRules() {
        return alertRuleRepository.findEnabledOfflineRules();
    }

    /**
     * Get enabled speed limit rules
     */
    public List<AlertRule> getEnabledSpeedLimitRules() {
        return alertRuleRepository.findEnabledSpeedLimitRules();
    }

    /**
     * Get enabled geofence enter rules
     */
    public List<AlertRule> getEnabledGeofenceEnterRules() {
        return alertRuleRepository.findEnabledGeofenceEnterRules();
    }

    /**
     * Get enabled geofence exit rules
     */
    public List<AlertRule> getEnabledGeofenceExitRules() {
        return alertRuleRepository.findEnabledGeofenceExitRules();
    }

    /**
     * Get all enabled geofence rules (enter and exit)
     */
    public List<AlertRule> getEnabledGeofenceRules() {
        return alertRuleRepository.findEnabledGeofenceRules();
    }
}

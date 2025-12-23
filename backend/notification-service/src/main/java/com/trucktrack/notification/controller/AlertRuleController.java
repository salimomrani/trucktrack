package com.trucktrack.notification.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.notification.model.AlertRule;
import com.trucktrack.notification.model.AlertRuleType;
import com.trucktrack.notification.service.AlertRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for alert rules
 * T145: Create AlertRuleController
 */
@Slf4j
@RestController
@RequestMapping("/notification/v1/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleService alertRuleService;

    /**
     * Get all alert rules
     * GET /notification/v1/alert-rules
     */
    @GetMapping
    public ResponseEntity<List<AlertRule>> getAllAlertRules(
            @RequestParam(required = false) AlertRuleType type,
            @RequestParam(required = false) Boolean enabled) {

        log.debug("Getting alert rules - type: {}, enabled: {}", type, enabled);

        List<AlertRule> rules;
        if (type != null && enabled != null && enabled) {
            rules = alertRuleService.getEnabledAlertRulesByType(type);
        } else if (type != null) {
            rules = alertRuleService.getAlertRulesByType(type);
        } else if (enabled != null && enabled) {
            rules = alertRuleService.getEnabledAlertRules();
        } else {
            rules = alertRuleService.getAllAlertRules();
        }

        return ResponseEntity.ok(rules);
    }

    /**
     * Get alert rule by ID
     * GET /notification/v1/alert-rules/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AlertRule> getAlertRuleById(@PathVariable UUID id) {
        log.debug("Getting alert rule: {}", id);
        return alertRuleService.getAlertRuleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new alert rule
     * POST /notification/v1/alert-rules
     */
    @PostMapping
    public ResponseEntity<AlertRule> createAlertRule(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestBody AlertRule alertRule) {
        UUID userId = UUID.fromString(principal.userId());
        log.info("Creating alert rule '{}' for user: {}", alertRule.getName(), userId);
        // Set the createdBy from authenticated user
        alertRule.setCreatedBy(userId);
        AlertRule created = alertRuleService.createAlertRule(alertRule);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an alert rule
     * PUT /notification/v1/alert-rules/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<AlertRule> updateAlertRule(
            @PathVariable UUID id,
            @Valid @RequestBody AlertRule alertRule) {

        log.info("Updating alert rule: {}", id);
        return alertRuleService.updateAlertRule(id, alertRule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Enable or disable an alert rule
     * PATCH /notification/v1/alert-rules/{id}/enabled
     */
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<AlertRule> setEnabled(
            @PathVariable UUID id,
            @RequestParam boolean enabled) {

        log.info("Setting alert rule {} enabled={}", id, enabled);
        return alertRuleService.setEnabled(id, enabled)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete an alert rule
     * DELETE /notification/v1/alert-rules/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlertRule(@PathVariable UUID id) {
        log.info("Deleting alert rule: {}", id);
        if (alertRuleService.deleteAlertRule(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get alert rules for current user
     * GET /notification/v1/alert-rules/my-rules
     */
    @GetMapping("/my-rules")
    public ResponseEntity<List<AlertRule>> getMyAlertRules(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        UUID userId = UUID.fromString(principal.userId());
        log.debug("Getting alert rules for user: {}", userId);
        List<AlertRule> rules = alertRuleService.getAlertRulesForUser(userId);
        return ResponseEntity.ok(rules);
    }
}

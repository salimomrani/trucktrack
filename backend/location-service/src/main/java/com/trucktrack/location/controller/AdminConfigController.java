package com.trucktrack.location.controller;

import com.trucktrack.location.dto.ConfigHistoryResponse;
import com.trucktrack.location.dto.ConfigResponse;
import com.trucktrack.location.dto.UpdateConfigRequest;
import com.trucktrack.location.service.SystemConfigService;
import jakarta.persistence.OptimisticLockException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * T110-T113: Admin configuration controller
 * Feature: 002-admin-panel (US4 - Config)
 */
@RestController
@RequestMapping("/admin/config")
@PreAuthorize("hasRole('ADMIN')")
public class AdminConfigController {

    private final SystemConfigService configService;

    public AdminConfigController(SystemConfigService configService) {
        this.configService = configService;
    }

    /**
     * T111: GET /admin/config
     * Get all configurations
     */
    @GetMapping
    public ResponseEntity<List<ConfigResponse>> getAllConfig(
            @RequestParam(required = false) String category) {
        List<ConfigResponse> configs;
        if (category != null && !category.isBlank()) {
            configs = configService.getConfigByCategory(category);
        } else {
            configs = configService.getAllConfig();
        }
        return ResponseEntity.ok(configs);
    }

    /**
     * GET /admin/config/{key}
     * Get single configuration
     */
    @GetMapping("/{key}")
    public ResponseEntity<ConfigResponse> getConfig(@PathVariable String key) {
        return configService.getConfigByKey(key)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * T112: PUT /admin/config/{key}
     * Update configuration with version check
     */
    @PutMapping("/{key}")
    public ResponseEntity<?> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateConfigRequest request,
            @RequestHeader(value = "X-Username", defaultValue = "system") String username) {
        try {
            ConfigResponse updated = configService.updateConfig(key, request, username);
            return ResponseEntity.ok(updated);
        } catch (OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                    "error", "CONFLICT",
                    "message", e.getMessage()
                ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * T113: GET /admin/config/{key}/history
     * Get configuration change history
     */
    @GetMapping("/{key}/history")
    public ResponseEntity<List<ConfigHistoryResponse>> getConfigHistory(@PathVariable String key) {
        List<ConfigHistoryResponse> history = configService.getConfigHistory(key);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /admin/config/recent-changes
     * Get recent configuration changes across all keys
     */
    @GetMapping("/recent-changes")
    public ResponseEntity<List<ConfigHistoryResponse>> getRecentChanges() {
        List<ConfigHistoryResponse> changes = configService.getRecentChanges();
        return ResponseEntity.ok(changes);
    }
}

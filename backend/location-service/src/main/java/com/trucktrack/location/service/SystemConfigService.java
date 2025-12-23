package com.trucktrack.location.service;

import com.trucktrack.location.dto.ConfigHistoryResponse;
import com.trucktrack.location.dto.ConfigResponse;
import com.trucktrack.location.dto.UpdateConfigRequest;
import com.trucktrack.location.model.ConfigHistory;
import com.trucktrack.location.model.SystemConfig;
import com.trucktrack.location.repository.ConfigHistoryRepository;
import com.trucktrack.location.repository.SystemConfigRepository;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * T106-T109: System configuration service
 * Feature: 002-admin-panel (US4 - Config)
 */
@Service
public class SystemConfigService {

    private static final Logger log = LoggerFactory.getLogger(SystemConfigService.class);

    private final SystemConfigRepository configRepository;
    private final ConfigHistoryRepository historyRepository;

    public SystemConfigService(
            SystemConfigRepository configRepository,
            ConfigHistoryRepository historyRepository) {
        this.configRepository = configRepository;
        this.historyRepository = historyRepository;
    }

    /**
     * T107: Get all configurations
     */
    public List<ConfigResponse> getAllConfig() {
        return configRepository.findAllByOrderByCategoryAscKeyAsc()
            .stream()
            .map(ConfigResponse::fromEntity)
            .toList();
    }

    /**
     * Get configurations by category
     */
    public List<ConfigResponse> getConfigByCategory(String category) {
        return configRepository.findByCategory(category)
            .stream()
            .map(ConfigResponse::fromEntity)
            .toList();
    }

    /**
     * Get single configuration by key
     */
    public Optional<ConfigResponse> getConfigByKey(String key) {
        return configRepository.findByKey(key)
            .map(ConfigResponse::fromEntity);
    }

    /**
     * T108: Update configuration with optimistic locking and history
     */
    @Transactional
    public ConfigResponse updateConfig(String key, UpdateConfigRequest request, String username) {
        SystemConfig config = configRepository.findByKey(key)
            .orElseThrow(() -> new IllegalArgumentException("Configuration not found: " + key));

        // Check version for optimistic locking
        if (!config.getVersion().equals(request.version())) {
            throw new OptimisticLockException(
                "Configuration was modified by another user. Please refresh and try again.");
        }

        String oldValue = config.getValue();
        String newValue = request.value();

        // Only update if value changed
        if (!oldValue.equals(newValue)) {
            // Create history record
            ConfigHistory history = new ConfigHistory();
            history.setConfigKey(key);
            history.setOldValue(oldValue);
            history.setNewValue(newValue);
            history.setChangedBy(username);
            history.setReason(request.reason());
            historyRepository.save(history);

            // Update config
            config.setValue(newValue);
            config.setUpdatedBy(username);
            config = configRepository.save(config);

            // ConfigHistory already provides audit trail for config changes

            log.info("Configuration {} updated by {}: {} -> {}", key, username, oldValue, newValue);
        }

        return ConfigResponse.fromEntity(config);
    }

    /**
     * T109: Get configuration history
     */
    public List<ConfigHistoryResponse> getConfigHistory(String key) {
        return historyRepository.findByConfigKeyOrderByChangedAtDesc(key)
            .stream()
            .map(ConfigHistoryResponse::fromEntity)
            .toList();
    }

    /**
     * Get recent configuration changes
     */
    public List<ConfigHistoryResponse> getRecentChanges() {
        return historyRepository.findTop10ByOrderByChangedAtDesc()
            .stream()
            .map(ConfigHistoryResponse::fromEntity)
            .toList();
    }

    /**
     * Get configuration value as String
     */
    public String getString(String key, String defaultValue) {
        return configRepository.findByKey(key)
            .map(SystemConfig::getValue)
            .orElse(defaultValue);
    }

    /**
     * Get configuration value as Integer
     */
    public int getInt(String key, int defaultValue) {
        return configRepository.findByKey(key)
            .map(config -> {
                try {
                    return Integer.parseInt(config.getValue());
                } catch (NumberFormatException e) {
                    log.warn("Invalid integer config value for {}: {}", key, config.getValue());
                    return defaultValue;
                }
            })
            .orElse(defaultValue);
    }

    /**
     * Get configuration value as Boolean
     */
    public boolean getBoolean(String key, boolean defaultValue) {
        return configRepository.findByKey(key)
            .map(config -> Boolean.parseBoolean(config.getValue()))
            .orElse(defaultValue);
    }
}

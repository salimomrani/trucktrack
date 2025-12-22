-- Admin Panel - System Configuration
-- Version: 6.0.0
-- Created: 2025-12-21
-- Feature: 002-admin-panel
-- Description: Global system configuration with version history

-- System configuration table with optimistic locking
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    version INT NOT NULL DEFAULT 1,
    updated_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configuration change history for audit trail
CREATE TABLE config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL,
    old_value VARCHAR(500),
    new_value VARCHAR(500) NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO system_config (config_key, config_value, description, updated_by)
VALUES
    ('alert.speed_limit_default', '120', 'Default speed limit in km/h for speed alerts', '00000000-0000-0000-0000-000000000000'),
    ('alert.offline_threshold_minutes', '5', 'Minutes without GPS signal before truck marked offline', '00000000-0000-0000-0000-000000000000'),
    ('alert.idle_threshold_minutes', '10', 'Minutes stationary before idle alert triggered', '00000000-0000-0000-0000-000000000000'),
    ('pagination.default_page_size', '25', 'Default number of items per page in admin lists', '00000000-0000-0000-0000-000000000000'),
    ('audit.retention_days', '90', 'Number of days to retain audit logs', '00000000-0000-0000-0000-000000000000');

-- Indexes for efficient queries
CREATE INDEX idx_system_config_key ON system_config(config_key);
CREATE INDEX idx_config_history_key ON config_history(config_key);
CREATE INDEX idx_config_history_time ON config_history(changed_at DESC);

COMMENT ON TABLE system_config IS 'Global system configuration parameters';
COMMENT ON TABLE config_history IS 'Audit trail for configuration changes';
COMMENT ON COLUMN system_config.version IS 'Optimistic locking version for concurrent update protection';

-- Admin Panel - Audit Logs
-- Version: 7.0.0
-- Created: 2025-12-21
-- Feature: 002-admin-panel
-- Description: Audit logging for all administrative actions

-- Create audit action enum
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'REACTIVATE', 'ASSIGN', 'UNASSIGN');

-- Audit logs table for tracking administrative actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL,
    username VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient audit queries
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Note: Retention policy (90 days) will be enforced via scheduled job, not partial index
-- Partial indexes with NOW() are not allowed in PostgreSQL

COMMENT ON TABLE audit_logs IS 'Audit trail for administrative actions (90 day retention)';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object containing before/after values for UPDATE actions';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type: USER, TRUCK, GROUP, CONFIG, ALERT_RULE, GEOFENCE';

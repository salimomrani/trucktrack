-- Admin Panel - Add ADMIN and DRIVER roles to user_role enum
-- Version: 4.0.0
-- Created: 2025-12-21
-- Feature: 002-admin-panel

-- Add ADMIN and DRIVER roles to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DRIVER';

-- Note: truck_status was converted to VARCHAR in V3, no enum modification needed
-- OUT_OF_SERVICE is now just a string value that can be used directly

COMMENT ON TYPE user_role IS 'User roles: ADMIN (full access), FLEET_MANAGER (manage assigned groups), DISPATCHER, DRIVER, VIEWER';

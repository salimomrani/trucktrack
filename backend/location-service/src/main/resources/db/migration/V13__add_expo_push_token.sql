-- V13: Add expo_push_token column to users table for push notifications
-- Feature: 010-trip-management (US3: Push Notifications)

ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(100);

COMMENT ON COLUMN users.expo_push_token IS 'Expo push notification token for mobile app';

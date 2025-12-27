-- RBAC Permissions - Test Users for each role
-- Version: 10.0.0
-- Created: 2025-12-23
-- Feature: 008-rbac-permissions, T039

-- ====================
-- ADMIN USER (Development Only)
-- ====================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'sysadmin@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'System',
    'Administrator',
    'ADMIN',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Admin access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM user_truck_groups
    WHERE user_id = '00000000-0000-0000-0000-000000000100'
    AND truck_group_id = '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- FLEET MANAGER USER (Development Only)
-- ====================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    'fleetmanager@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Marie',
    'Fleet Manager',
    'FLEET_MANAGER',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Fleet manager access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM user_truck_groups
    WHERE user_id = '00000000-0000-0000-0000-000000000101'
    AND truck_group_id = '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- DRIVER USER (Development Only)
-- ====================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000102',
    'driver@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Pierre',
    'Driver',
    'DRIVER',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Driver access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM user_truck_groups
    WHERE user_id = '00000000-0000-0000-0000-000000000102'
    AND truck_group_id = '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- VIEWER USER (Development Only)
-- ====================

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000103',
    'viewer@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Claude',
    'Observer',
    'VIEWER',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Viewer access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
    SELECT 1 FROM user_truck_groups
    WHERE user_id = '00000000-0000-0000-0000-000000000103'
    AND truck_group_id = '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- SUMMARY
-- ====================
-- Test users for RBAC testing. See DEVELOPMENT.md for test credentials.
-- | Role          | Email                        |
-- |---------------|------------------------------|
-- | ADMIN         | sysadmin@trucktrack.com      |
-- | FLEET_MANAGER | fleetmanager@trucktrack.com  |
-- | DISPATCHER    | dispatcher@trucktrack.com    |
-- | DRIVER        | driver@trucktrack.com        |
-- | VIEWER        | viewer@trucktrack.com        |

COMMENT ON TABLE users IS 'Updated with RBAC test users for each role (Feature: 008-rbac-permissions)';

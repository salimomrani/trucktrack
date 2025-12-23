-- RBAC Permissions - Test Users for each role
-- Version: 10.0.0
-- Created: 2025-12-23
-- Feature: 008-rbac-permissions, T039

-- ====================
-- ADMIN USER
-- ====================
-- Email: sysadmin@trucktrack.com
-- Password: AdminPass123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'sysadmin@trucktrack.com',
    '$2a$10$xqKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
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
-- FLEET MANAGER USER
-- ====================
-- Email: fleetmanager@trucktrack.com
-- Password: FleetPass123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    'fleetmanager@trucktrack.com',
    '$2a$10$yxKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
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
-- DRIVER USER
-- ====================
-- Email: driver@trucktrack.com
-- Password: DriverPass123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000102',
    'driver@trucktrack.com',
    '$2a$10$zxKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
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
-- VIEWER USER
-- ====================
-- Email: viewer@trucktrack.com
-- Password: ViewerPass123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000103',
    'viewer@trucktrack.com',
    '$2a$10$axKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
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
-- Test users for RBAC testing:
-- | Role          | Email                        | Password        |
-- |---------------|------------------------------|-----------------|
-- | ADMIN         | sysadmin@trucktrack.com      | AdminPass123!   |
-- | FLEET_MANAGER | fleetmanager@trucktrack.com  | FleetPass123!   |
-- | DISPATCHER    | dispatcher@trucktrack.com    | DispatcherPass123! (from V2) |
-- | DRIVER        | driver@trucktrack.com        | DriverPass123!  |
-- | VIEWER        | viewer@trucktrack.com        | ViewerPass123!  |

COMMENT ON TABLE users IS 'Updated with RBAC test users for each role (Feature: 008-rbac-permissions)';

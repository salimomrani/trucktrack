-- Reseed test users (V10 ran before users table existed)
-- NOTE: Test credentials - See DEVELOPMENT.md for passwords

-- ADMIN
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    'sysadmin@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'System',
    'Administrator',
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- FLEET_MANAGER
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    'fleetmanager@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Marie',
    'Fleet Manager',
    'FLEET_MANAGER',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- DISPATCHER
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000104',
    'dispatcher@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Jean',
    'Dispatcher',
    'DISPATCHER',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- DRIVER
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000102',
    'driver@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Pierre',
    'Driver',
    'DRIVER',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- VIEWER
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000103',
    'viewer@trucktrack.com',
    '$2a$12$zVIn7ZVtoqcG2EKxh4xxjOt2wjUIOuOY4PvvlvEa5AAyVFSwRqr1m',
    'Claude',
    'Observer',
    'VIEWER',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Assign all test users to "All Trucks" group
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT u.id, '00000000-0000-0000-0000-000000000001'
FROM users u
WHERE u.email IN (
    'sysadmin@trucktrack.com',
    'fleetmanager@trucktrack.com',
    'dispatcher@trucktrack.com',
    'driver@trucktrack.com',
    'viewer@trucktrack.com'
)
ON CONFLICT DO NOTHING;

-- ====================
-- TEST USERS SUMMARY
-- ====================
-- See DEVELOPMENT.md for test account credentials
-- | Role          | Email                        |
-- |---------------|------------------------------|
-- | ADMIN         | sysadmin@trucktrack.com      |
-- | FLEET_MANAGER | fleetmanager@trucktrack.com  |
-- | DISPATCHER    | dispatcher@trucktrack.com    |
-- | DRIVER        | driver@trucktrack.com        |
-- | VIEWER        | viewer@trucktrack.com        |

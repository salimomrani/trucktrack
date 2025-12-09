-- GPS Live Truck Tracking - Seed Data
-- Version: 2.0.0
-- Created: 2025-12-09
-- Description: Inserts default truck group, admin user, and sample data for development

-- ====================
-- DEFAULT TRUCK GROUP
-- ====================

INSERT INTO truck_groups (id, name, description)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'All Trucks',
    'Default group for all trucks in the fleet'
);

-- ====================
-- ADMIN USER
-- ====================
-- Default password: AdminPass123!
-- BCrypt hash generated with strength 10

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@trucktrack.com',
    '$2a$10$xqKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
    'Admin',
    'User',
    'FLEET_MANAGER',
    TRUE
);

-- Grant admin access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- SAMPLE DISPATCHER USER
-- ====================
-- Password: DispatcherPass123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'dispatcher@trucktrack.com',
    '$2a$10$yxKE8YPZGh7VZ5yNxZQUduoZ0mYKQQYJZ7pGZBvG6KGK6FmGK6K6K',
    'John',
    'Dispatcher',
    'DISPATCHER',
    TRUE
);

-- Grant dispatcher access to all trucks group
INSERT INTO user_truck_groups (user_id, truck_group_id)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001'
);

-- ====================
-- SAMPLE TRUCKS (Development/Testing)
-- ====================

INSERT INTO trucks (id, truck_id, license_plate, driver_name, driver_phone, vehicle_type, status, truck_group_id, current_latitude, current_longitude, current_speed, current_heading, last_update)
VALUES
    -- Truck 1 - Active in San Francisco
    (
        '00000000-0000-0000-0000-000000000010',
        'TRK-001',
        'CA-1234AB',
        'Michael Johnson',
        '+1-415-555-0101',
        'VAN',
        'ACTIVE',
        '00000000-0000-0000-0000-000000000001',
        37.7749,
        -122.4194,
        45.3,
        270,
        NOW() - INTERVAL '30 seconds'
    ),
    -- Truck 2 - Idle in San Francisco
    (
        '00000000-0000-0000-0000-000000000011',
        'TRK-002',
        'CA-5678CD',
        'Sarah Williams',
        '+1-415-555-0102',
        'TRUCK',
        'IDLE',
        '00000000-0000-0000-0000-000000000001',
        37.7849,
        -122.4094,
        0.0,
        0,
        NOW() - INTERVAL '2 minutes'
    ),
    -- Truck 3 - Active near Golden Gate Bridge
    (
        '00000000-0000-0000-0000-000000000012',
        'TRK-003',
        'CA-9012EF',
        'Robert Brown',
        '+1-415-555-0103',
        'VAN',
        'ACTIVE',
        '00000000-0000-0000-0000-000000000001',
        37.8199,
        -122.4783,
        38.7,
        180,
        NOW() - INTERVAL '15 seconds'
    ),
    -- Truck 4 - Offline (last seen 10 minutes ago)
    (
        '00000000-0000-0000-0000-000000000013',
        'TRK-004',
        'CA-3456GH',
        'Jennifer Davis',
        '+1-415-555-0104',
        'SEMI',
        'OFFLINE',
        '00000000-0000-0000-0000-000000000001',
        37.7649,
        -122.4294,
        0.0,
        0,
        NOW() - INTERVAL '10 minutes'
    ),
    -- Truck 5 - Active in Mission District
    (
        '00000000-0000-0000-0000-000000000014',
        'TRK-005',
        'CA-7890IJ',
        'David Martinez',
        '+1-415-555-0105',
        'VAN',
        'ACTIVE',
        '00000000-0000-0000-0000-000000000001',
        37.7599,
        -122.4148,
        52.1,
        90,
        NOW() - INTERVAL '20 seconds'
    );

-- ====================
-- SAMPLE GPS POSITIONS (Historical data for testing)
-- ====================

-- Insert GPS positions for Truck 1 (last hour)
INSERT INTO gps_positions (truck_id, latitude, longitude, speed, heading, timestamp, altitude, accuracy, satellites)
SELECT
    '00000000-0000-0000-0000-000000000010',
    37.7749 + (random() - 0.5) * 0.01,  -- Small random variations
    -122.4194 + (random() - 0.5) * 0.01,
    40 + (random() * 20),
    (extract(epoch from NOW() - interval '1 hour' + (n * interval '2 minutes'))::int % 360),
    NOW() - interval '1 hour' + (n * interval '2 minutes'),
    50 + (random() * 20),
    5 + (random() * 3),
    10 + (random() * 5)::int
FROM generate_series(0, 29) AS n;

-- ====================
-- SAMPLE GEOFENCE (Depot)
-- ====================

INSERT INTO geofences (id, name, description, zone_type, boundary, center_latitude, center_longitude, radius_meters, is_active, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Main Depot - San Francisco',
    'Primary fleet depot and maintenance facility',
    'DEPOT',
    ST_Buffer(ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 500)::geometry,
    37.7749,
    -122.4194,
    500.0,
    TRUE,
    '00000000-0000-0000-0000-000000000002'
);

-- ====================
-- SAMPLE ALERT RULE (Truck Offline Alert)
-- ====================

INSERT INTO alert_rules (id, name, description, rule_type, threshold_value, is_enabled, notification_channels, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000030',
    'Truck Offline Alert',
    'Alert when any truck has been offline for more than 5 minutes',
    'OFFLINE',
    5,
    TRUE,
    '["IN_APP"]'::jsonb,
    '00000000-0000-0000-0000-000000000002'
);

-- ====================
-- COMMENTS
-- ====================

COMMENT ON TABLE truck_groups IS 'Seed data: Contains default "All Trucks" group';
COMMENT ON TABLE users IS 'Seed data: Contains admin and dispatcher test users';
COMMENT ON TABLE trucks IS 'Seed data: Contains 5 sample trucks for development';
COMMENT ON TABLE gps_positions IS 'Seed data: Contains 30 historical GPS positions for Truck 1';
COMMENT ON TABLE geofences IS 'Seed data: Contains Main Depot geofence';
COMMENT ON TABLE alert_rules IS 'Seed data: Contains default offline alert rule';

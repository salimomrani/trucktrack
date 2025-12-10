-- Test Data for Truck Track Application
-- Run this after all services are started

-- Insert test trucks in different locations and statuses
INSERT INTO trucks (id, truck_id, license_plate, driver_name, driver_phone, vehicle_type, status, current_latitude, current_longitude, current_speed, current_heading, last_update, truck_group_id)
VALUES
-- San Francisco area trucks (ACTIVE)
('11111111-1111-1111-1111-111111111111', 'TRK-001', 'CA-1234-AB', 'John Smith', '+1-555-0101', 'Volvo FH16', 'ACTIVE', 37.7749, -122.4194, 65.5, 90, NOW(), (SELECT id FROM truck_groups LIMIT 1)),
('22222222-2222-2222-2222-222222222222', 'TRK-002', 'CA-5678-CD', 'Jane Doe', '+1-555-0102', 'Scania R500', 'ACTIVE', 37.7849, -122.4094, 55.2, 180, NOW(), (SELECT id FROM truck_groups LIMIT 1)),

-- Oakland area trucks (IDLE)
('33333333-3333-3333-3333-333333333333', 'TRK-003', 'CA-9012-EF', 'Mike Johnson', '+1-555-0103', 'Mercedes Actros', 'IDLE', 37.8044, -122.2711, 0.0, 270, NOW(), (SELECT id FROM truck_groups LIMIT 1)),
('44444444-4444-4444-4444-444444444444', 'TRK-004', 'CA-3456-GH', 'Sarah Wilson', '+1-555-0104', 'MAN TGX', 'IDLE', 37.8144, -122.2611, 2.1, 0, NOW(), (SELECT id FROM truck_groups LIMIT 1)),

-- Berkeley area truck (ACTIVE)
('55555555-5555-5555-5555-555555555555', 'TRK-005', 'CA-7890-IJ', 'Robert Brown', '+1-555-0105', 'Volvo FH16', 'ACTIVE', 37.8715, -122.2730, 70.3, 45, NOW(), (SELECT id FROM truck_groups LIMIT 1)),

-- San Jose area trucks (ACTIVE and OFFLINE)
('66666666-6666-6666-6666-666666666666', 'TRK-006', 'CA-2468-KL', 'Emily Davis', '+1-555-0106', 'Scania S650', 'ACTIVE', 37.3382, -121.8863, 80.5, 135, NOW(), (SELECT id FROM truck_groups LIMIT 1)),
('77777777-7777-7777-7777-777777777777', 'TRK-007', 'CA-1357-MN', 'David Martinez', '+1-555-0107', 'DAF XF', 'OFFLINE', 37.3482, -121.8763, 0.0, 0, NOW() - INTERVAL '10 minutes', (SELECT id FROM truck_groups LIMIT 1));

-- Insert some GPS position history for TRUCK TRK-001
INSERT INTO gps_positions (truck_id, latitude, longitude, altitude, speed, heading, accuracy, satellites, timestamp)
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    37.7749 + (random() * 0.01),
    -122.4194 + (random() * 0.01),
    10.0 + (random() * 5),
    60.0 + (random() * 20),
    (random() * 360)::integer,
    5.0,
    8,
    NOW() - (n || ' minutes')::interval
FROM generate_series(1, 30) n;

-- Verify data
SELECT COUNT(*) as truck_count FROM trucks;
SELECT COUNT(*) as position_count FROM gps_positions;
SELECT truck_id, status, current_latitude, current_longitude, current_speed FROM trucks ORDER BY truck_id;

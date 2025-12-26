-- V14: Add sample trips for testing
-- T072: Add seed data for test trips
-- Feature: 010-trip-management

-- Only insert if the trips table is empty
INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Montreal, QC',
    'Toronto, ON',
    'COMPLETED',
    'Regular weekly delivery',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM trips LIMIT 1);

INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Vancouver, BC',
    'Calgary, AB',
    'COMPLETED',
    'Urgent express shipment',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE origin = 'Vancouver, BC' LIMIT 1);

INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Ottawa, ON',
    'Quebec City, QC',
    'IN_PROGRESS',
    'In transit',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE origin = 'Ottawa, ON' LIMIT 1);

INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Edmonton, AB',
    'Winnipeg, MB',
    'PENDING',
    'Scheduled for tomorrow',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() + INTERVAL '1 day',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE origin = 'Edmonton, AB' LIMIT 1);

INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Halifax, NS',
    'Moncton, NB',
    'PENDING',
    'Awaiting assignment',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() + INTERVAL '2 days',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE origin = 'Halifax, NS' LIMIT 1);

INSERT INTO trips (id, origin, destination, status, notes, created_by, scheduled_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Regina, SK',
    'Saskatoon, SK',
    'CANCELLED',
    'Order cancelled by customer',
    (SELECT id FROM users WHERE email = 'admin@trucktrack.com' LIMIT 1),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE origin = 'Regina, SK' LIMIT 1);

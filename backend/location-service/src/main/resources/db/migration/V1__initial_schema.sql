-- GPS Live Truck Tracking - Initial Database Schema
-- Version: 1.0.0
-- Created: 2025-12-09
-- Description: Creates all tables, ENUMs, indexes, and foreign key constraints

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ====================
-- ENUM TYPES
-- ====================

CREATE TYPE user_role AS ENUM ('FLEET_MANAGER', 'DISPATCHER', 'VIEWER');
CREATE TYPE truck_status AS ENUM ('ACTIVE', 'IDLE', 'OFFLINE');
CREATE TYPE geofence_zone_type AS ENUM ('DEPOT', 'DELIVERY_AREA', 'RESTRICTED_ZONE', 'CUSTOM');
CREATE TYPE alert_rule_type AS ENUM ('OFFLINE', 'IDLE', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'SPEED_LIMIT');
CREATE TYPE notification_type AS ENUM ('OFFLINE', 'IDLE', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'SPEED_LIMIT');
CREATE TYPE notification_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- ====================
-- TABLES
-- ====================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Truck groups table (for authorization)
CREATE TABLE truck_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User-TruckGroup many-to-many join table
CREATE TABLE user_truck_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    truck_group_id UUID NOT NULL REFERENCES truck_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, truck_group_id)
);

-- Trucks table
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id VARCHAR(50) UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_type VARCHAR(50) NOT NULL,
    status truck_status NOT NULL DEFAULT 'OFFLINE',
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    current_speed DECIMAL(5,2),
    current_heading INTEGER CHECK (current_heading >= 0 AND current_heading <= 359),
    last_update TIMESTAMP,
    truck_group_id UUID NOT NULL REFERENCES truck_groups(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_latitude CHECK (current_latitude >= -90 AND current_latitude <= 90),
    CONSTRAINT check_longitude CHECK (current_longitude >= -180 AND current_longitude <= 180),
    CONSTRAINT check_speed CHECK (current_speed >= 0 AND current_speed <= 200),
    CONSTRAINT check_truck_id_pattern CHECK (truck_id ~* '^[A-Z]{3}-[0-9]{3}$')
);

-- GPS Positions table (partitioned by timestamp)
CREATE TABLE gps_positions (
    id BIGSERIAL,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11,8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    altitude DECIMAL(7,2),
    speed DECIMAL(5,2) NOT NULL CHECK (speed >= 0 AND speed <= 200),
    heading INTEGER NOT NULL CHECK (heading >= 0 AND heading <= 359),
    accuracy DECIMAL(5,2) CHECK (accuracy > 0),
    satellites INTEGER CHECK (satellites >= 0 AND satellites <= 30),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    geom GEOMETRY(Point, 4326) NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create initial partitions for GPS positions (current month + next 2 months)
CREATE TABLE gps_positions_2025_12 PARTITION OF gps_positions
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE gps_positions_2026_01 PARTITION OF gps_positions
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE gps_positions_2026_02 PARTITION OF gps_positions
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Geofences table
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    zone_type geofence_zone_type NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    radius_meters DECIMAL(10,2) CHECK (radius_meters >= 10 AND radius_meters <= 50000),
    center_latitude DECIMAL(10,8) CHECK (center_latitude >= -90 AND center_latitude <= 90),
    center_longitude DECIMAL(11,8) CHECK (center_longitude >= -180 AND center_longitude <= 180),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Alert rules table
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type alert_rule_type NOT NULL,
    threshold_value INTEGER CHECK (threshold_value > 0),
    geofence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
    truck_group_id UUID REFERENCES truck_groups(id) ON DELETE SET NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notification_channels JSONB NOT NULL DEFAULT '["IN_APP"]'::jsonb,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_geofence_rules CHECK (
        (rule_type IN ('GEOFENCE_ENTER', 'GEOFENCE_EXIT') AND geofence_id IS NOT NULL) OR
        (rule_type NOT IN ('GEOFENCE_ENTER', 'GEOFENCE_EXIT'))
    )
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity notification_severity NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    triggered_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    CONSTRAINT check_triggered_before_sent CHECK (triggered_at <= sent_at)
);

-- ====================
-- INDEXES
-- ====================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Truck groups indexes
CREATE INDEX idx_truck_groups_name ON truck_groups(name);

-- User-TruckGroup join table indexes
CREATE INDEX idx_user_truck_groups_user ON user_truck_groups(user_id);
CREATE INDEX idx_user_truck_groups_group ON user_truck_groups(truck_group_id);

-- Trucks indexes
CREATE INDEX idx_trucks_truck_id ON trucks(truck_id);
CREATE INDEX idx_trucks_driver_name ON trucks(driver_name);
CREATE INDEX idx_trucks_status ON trucks(status);
CREATE INDEX idx_trucks_truck_group ON trucks(truck_group_id);
CREATE INDEX idx_trucks_location ON trucks USING GIST (
    ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326)
) WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- GPS Positions indexes (on partitioned table)
CREATE INDEX idx_gps_positions_truck_id ON gps_positions(truck_id);
CREATE INDEX idx_gps_positions_timestamp ON gps_positions(timestamp DESC);
CREATE INDEX idx_gps_positions_geom ON gps_positions USING GIST (geom);
CREATE INDEX idx_gps_positions_truck_time ON gps_positions(truck_id, timestamp DESC);

-- Geofences indexes
CREATE INDEX idx_geofences_name ON geofences(name);
CREATE INDEX idx_geofences_zone_type ON geofences(zone_type);
CREATE INDEX idx_geofences_boundary ON geofences USING GIST (boundary);
CREATE INDEX idx_geofences_is_active ON geofences(is_active);

-- Alert rules indexes
CREATE INDEX idx_alert_rules_rule_type ON alert_rules(rule_type);
CREATE INDEX idx_alert_rules_geofence ON alert_rules(geofence_id);
CREATE INDEX idx_alert_rules_truck_group ON alert_rules(truck_group_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(is_enabled);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, triggered_at DESC);
CREATE INDEX idx_notifications_truck ON notifications(truck_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_triggered_at ON notifications(triggered_at DESC);

-- ====================
-- FUNCTIONS & TRIGGERS
-- ====================

-- Trigger function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_groups_updated_at BEFORE UPDATE ON truck_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set geom from latitude/longitude in gps_positions
CREATE OR REPLACE FUNCTION set_gps_position_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_gps_positions_geom BEFORE INSERT OR UPDATE ON gps_positions
    FOR EACH ROW EXECUTE FUNCTION set_gps_position_geom();

-- ====================
-- COMMENTS
-- ====================

COMMENT ON TABLE users IS 'Fleet managers, dispatchers, and viewers using the application';
COMMENT ON TABLE truck_groups IS 'Authorization groups for access control';
COMMENT ON TABLE user_truck_groups IS 'Many-to-many relationship between users and truck groups';
COMMENT ON TABLE trucks IS 'Fleet vehicles with current position and status';
COMMENT ON TABLE gps_positions IS 'GPS coordinate readings from trucks (partitioned by month)';
COMMENT ON TABLE geofences IS 'Geographical boundaries for alerts';
COMMENT ON TABLE alert_rules IS 'User-configured notification triggers';
COMMENT ON TABLE notifications IS 'Alert notifications sent to users';

COMMENT ON COLUMN trucks.status IS 'Derived from last_update: ACTIVE (moving), IDLE (stationary), OFFLINE (no updates >5min)';
COMMENT ON COLUMN gps_positions.geom IS 'PostGIS geometry point (automatically set from lat/lng)';
COMMENT ON COLUMN notifications.severity IS 'Derived from notification_type per business rules';

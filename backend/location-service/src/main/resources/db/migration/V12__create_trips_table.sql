-- V12: Create trips table for Trip Management System
-- Feature: 010-trip-management

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin VARCHAR(500) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    assigned_truck_id UUID REFERENCES trucks(id),
    assigned_driver_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_trip_status CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Indexes for trips
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_driver ON trips(assigned_driver_id);
CREATE INDEX idx_trips_truck ON trips(assigned_truck_id);
CREATE INDEX idx_trips_scheduled ON trips(scheduled_at);
CREATE INDEX idx_trips_created ON trips(created_at DESC);

-- Trip status history table for audit trail
CREATE TABLE trip_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes VARCHAR(500),

    CONSTRAINT chk_history_status CHECK (
        (previous_status IS NULL OR previous_status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
        AND new_status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    )
);

CREATE INDEX idx_trip_history_trip ON trip_status_history(trip_id, changed_at DESC);

-- Add comment for documentation
COMMENT ON TABLE trips IS 'Delivery trips with origin/destination and driver assignment';
COMMENT ON TABLE trip_status_history IS 'Audit trail for trip status changes';

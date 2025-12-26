-- V15: Add GPS coordinates to trips table
-- Feature: Location picker for origin/destination

-- Origin coordinates
ALTER TABLE trips ADD COLUMN origin_lat NUMERIC(10,8);
ALTER TABLE trips ADD COLUMN origin_lng NUMERIC(11,8);

-- Destination coordinates
ALTER TABLE trips ADD COLUMN destination_lat NUMERIC(10,8);
ALTER TABLE trips ADD COLUMN destination_lng NUMERIC(11,8);

-- Add indexes for potential geospatial queries
CREATE INDEX idx_trips_origin_coords ON trips(origin_lat, origin_lng) WHERE origin_lat IS NOT NULL;
CREATE INDEX idx_trips_destination_coords ON trips(destination_lat, destination_lng) WHERE destination_lat IS NOT NULL;

COMMENT ON COLUMN trips.origin_lat IS 'Latitude of trip origin (-90 to 90)';
COMMENT ON COLUMN trips.origin_lng IS 'Longitude of trip origin (-180 to 180)';
COMMENT ON COLUMN trips.destination_lat IS 'Latitude of trip destination (-90 to 90)';
COMMENT ON COLUMN trips.destination_lng IS 'Longitude of trip destination (-180 to 180)';

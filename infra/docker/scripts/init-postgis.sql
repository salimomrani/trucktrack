-- GPS Live Truck Tracking - PostGIS Initialization Script
-- This script enables PostGIS extension for spatial data support

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS version
SELECT PostGIS_version();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trucktrack;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trucktrack;
GRANT ALL PRIVILEGES ON SCHEMA public TO trucktrack;

-- V19: Make heading column nullable in gps_positions
-- GPS data from mobile devices may not always include heading information

-- Remove NOT NULL constraint from heading column
ALTER TABLE gps_positions ALTER COLUMN heading DROP NOT NULL;

-- Also drop the check constraint and recreate it to allow NULL
ALTER TABLE gps_positions DROP CONSTRAINT IF EXISTS gps_positions_heading_check;
ALTER TABLE gps_positions ADD CONSTRAINT gps_positions_heading_check
    CHECK (heading IS NULL OR (heading >= 0 AND heading <= 359));

COMMENT ON COLUMN gps_positions.heading IS 'Direction of travel in degrees (0-359), nullable when device does not provide heading';

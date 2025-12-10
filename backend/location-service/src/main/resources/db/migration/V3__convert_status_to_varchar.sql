-- Convert trucks.status from truck_status ENUM to VARCHAR
ALTER TABLE trucks ALTER COLUMN status TYPE VARCHAR(20) USING status::TEXT;

-- Drop the truck_status ENUM type (no longer needed)
DROP TYPE IF EXISTS truck_status CASCADE;

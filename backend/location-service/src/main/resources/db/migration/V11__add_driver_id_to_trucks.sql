-- V11: Add driver_id column to trucks table
-- Links trucks to drivers (users) for driver-truck assignment

ALTER TABLE trucks ADD COLUMN driver_id UUID;

-- Add index for faster lookups by driver
CREATE INDEX idx_trucks_driver_id ON trucks(driver_id);

-- Optional: Add foreign key constraint if referencing auth-service users table
-- Note: This is commented out as users table is in auth-service schema
-- ALTER TABLE trucks ADD CONSTRAINT fk_trucks_driver FOREIGN KEY (driver_id) REFERENCES users(id);

COMMENT ON COLUMN trucks.driver_id IS 'UUID of the assigned driver (references users.id in auth-service)';

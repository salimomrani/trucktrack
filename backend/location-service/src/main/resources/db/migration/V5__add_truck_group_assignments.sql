-- Admin Panel - Truck Group Assignments (many-to-many)
-- Version: 5.0.0
-- Created: 2025-12-21
-- Feature: 002-admin-panel
-- Description: Allows trucks to belong to multiple groups

-- Create new join table for truck-group many-to-many relationship
CREATE TABLE truck_group_assignments (
    truck_id UUID NOT NULL,
    truck_group_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (truck_id, truck_group_id),
    CONSTRAINT fk_truck_assign_truck FOREIGN KEY (truck_id)
        REFERENCES trucks(id) ON DELETE CASCADE,
    CONSTRAINT fk_truck_assign_group FOREIGN KEY (truck_group_id)
        REFERENCES truck_groups(id) ON DELETE CASCADE
);

-- Migrate existing assignments from trucks.truck_group_id to new table
INSERT INTO truck_group_assignments (truck_id, truck_group_id, assigned_at)
SELECT id, truck_group_id, created_at
FROM trucks
WHERE truck_group_id IS NOT NULL;

-- Create indexes for efficient lookups
CREATE INDEX idx_truck_group_assign_truck ON truck_group_assignments(truck_id);
CREATE INDEX idx_truck_group_assign_group ON truck_group_assignments(truck_group_id);

-- Make truck_group_id nullable (keeping for backward compatibility during migration)
ALTER TABLE trucks ALTER COLUMN truck_group_id DROP NOT NULL;

COMMENT ON TABLE truck_group_assignments IS 'Many-to-many relationship between trucks and groups';

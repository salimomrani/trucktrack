-- Fix truck_group_assignments schema to match JPA entity
-- Version: 8.0.0
-- Created: 2025-12-22
-- Feature: 002-admin-panel
-- Description: Adds missing columns and fixes column names

-- Add id column as new primary key
ALTER TABLE truck_group_assignments DROP CONSTRAINT truck_group_assignments_pkey;

ALTER TABLE truck_group_assignments ADD COLUMN id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE truck_group_assignments ADD PRIMARY KEY (id);

-- Rename truck_group_id to group_id to match entity
ALTER TABLE truck_group_assignments RENAME COLUMN truck_group_id TO group_id;

-- Add assigned_by column
ALTER TABLE truck_group_assignments ADD COLUMN assigned_by UUID;

-- Add unique constraint for truck_id + group_id combination
ALTER TABLE truck_group_assignments ADD CONSTRAINT uq_truck_group UNIQUE (truck_id, group_id);

-- Update foreign key constraint name
ALTER TABLE truck_group_assignments DROP CONSTRAINT fk_truck_assign_group;
ALTER TABLE truck_group_assignments ADD CONSTRAINT fk_truck_assign_group
    FOREIGN KEY (group_id) REFERENCES truck_groups(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS idx_truck_group_assign_group;
CREATE INDEX idx_tga_group_id ON truck_group_assignments(group_id);

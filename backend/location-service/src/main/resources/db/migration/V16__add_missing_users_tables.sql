-- Repair migration: Add missing users and user_truck_groups tables
-- These tables were added to V1 after initial migration was applied

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    expo_push_token VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User-TruckGroup many-to-many join table (if not exists)
CREATE TABLE IF NOT EXISTS user_truck_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    truck_group_id UUID NOT NULL REFERENCES truck_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, truck_group_id)
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_truck_groups_user ON user_truck_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_truck_groups_group ON user_truck_groups(truck_group_id);

-- Insert default admin user if users table was just created and is empty
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
SELECT
    '18110e28-a924-47cf-a8e0-bc38c385cf98'::UUID,
    'admin@trucktrack.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBOvQH.r0FkBqVNcpR0SGML.5Ey',
    'Admin',
    'User',
    'FLEET_MANAGER',
    true
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- Assign admin to all truck groups
INSERT INTO user_truck_groups (user_id, truck_group_id)
SELECT
    '18110e28-a924-47cf-a8e0-bc38c385cf98'::UUID,
    tg.id
FROM truck_groups tg
WHERE NOT EXISTS (
    SELECT 1 FROM user_truck_groups
    WHERE user_id = '18110e28-a924-47cf-a8e0-bc38c385cf98'::UUID
);

COMMENT ON TABLE users IS 'System users with authentication and authorization data';
COMMENT ON TABLE user_truck_groups IS 'Many-to-many relationship between users and truck groups';

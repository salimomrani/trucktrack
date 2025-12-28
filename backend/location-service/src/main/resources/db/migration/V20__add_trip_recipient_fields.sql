-- Feature 016: Add recipient fields to trips for client notifications
-- These fields store the delivery recipient's contact information

ALTER TABLE trips ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);

-- Index for querying by recipient email (for notification history)
CREATE INDEX IF NOT EXISTS idx_trips_recipient_email ON trips(recipient_email) WHERE recipient_email IS NOT NULL;

COMMENT ON COLUMN trips.recipient_email IS 'Email address of the delivery recipient for notifications';
COMMENT ON COLUMN trips.recipient_name IS 'Name of the delivery recipient';
COMMENT ON COLUMN trips.recipient_phone IS 'Phone number of the delivery recipient';

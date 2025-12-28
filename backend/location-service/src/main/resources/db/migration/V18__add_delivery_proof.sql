-- Feature 015: Proof of Delivery (POD)
-- Electronic signature system for delivery confirmation

-- Create ProofStatus enum type
CREATE TYPE proof_status AS ENUM ('SIGNED', 'REFUSED');

-- Create delivery_proofs table
CREATE TABLE delivery_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE RESTRICT,
    status proof_status NOT NULL,
    signature_image TEXT NOT NULL,
    signer_name VARCHAR(200),
    refusal_reason VARCHAR(500),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    gps_accuracy DECIMAL(6, 2) NOT NULL,
    integrity_hash VARCHAR(64) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_gps_accuracy CHECK (gps_accuracy > 0),
    CONSTRAINT chk_refusal_reason CHECK (
        (status = 'REFUSED' AND refusal_reason IS NOT NULL AND refusal_reason != '')
        OR status = 'SIGNED'
    )
);

-- Create proof_photos table
CREATE TABLE proof_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID NOT NULL REFERENCES delivery_proofs(id) ON DELETE CASCADE,
    photo_image TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_display_order CHECK (display_order BETWEEN 1 AND 3),
    CONSTRAINT chk_photo_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_photo_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT unique_proof_order UNIQUE (proof_id, display_order)
);

-- Add has_proof column to trips
ALTER TABLE trips ADD COLUMN has_proof BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes
CREATE INDEX idx_delivery_proofs_trip_id ON delivery_proofs(trip_id);
CREATE INDEX idx_delivery_proofs_created_at ON delivery_proofs(created_at);
CREATE INDEX idx_delivery_proofs_created_by ON delivery_proofs(created_by);
CREATE INDEX idx_proof_photos_proof_id ON proof_photos(proof_id);
CREATE INDEX idx_trips_has_proof ON trips(has_proof) WHERE has_proof = TRUE;

-- Add comments
COMMENT ON TABLE delivery_proofs IS 'Proof of delivery records with electronic signatures - Feature 015';
COMMENT ON TABLE proof_photos IS 'Optional photos attached to delivery proofs - Feature 015';
COMMENT ON COLUMN delivery_proofs.signature_image IS 'PNG signature as Base64, max 100KB';
COMMENT ON COLUMN delivery_proofs.integrity_hash IS 'SHA-256 hash for tamper detection';
COMMENT ON COLUMN proof_photos.photo_image IS 'JPEG photo as Base64, max 500KB';

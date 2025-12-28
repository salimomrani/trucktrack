# Data Model: Proof of Delivery (POD)

**Feature**: 015-proof-of-delivery
**Date**: 2025-12-28

## Entity Relationship Diagram

```
┌─────────────┐       1:1        ┌─────────────────┐       1:N        ┌─────────────┐
│    Trip     │─────────────────▶│  DeliveryProof  │◀────────────────▶│ ProofPhoto  │
└─────────────┘                  └─────────────────┘                  └─────────────┘
      │                                  │
      │ N:1                              │
      ▼                                  ▼
┌─────────────┐                  ┌─────────────────┐
│    User     │                  │  ProofStatus    │
│  (driver)   │                  │    (ENUM)       │
└─────────────┘                  └─────────────────┘
```

## Entities

### DeliveryProof

Preuve de livraison principale associée à un trip.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| trip_id | UUID | FK → trips.id, UNIQUE, NOT NULL | Trip associé (1:1) |
| status | ENUM | NOT NULL | SIGNED ou REFUSED |
| signature_image | TEXT | NOT NULL | Image PNG en Base64 (max 100KB) |
| signer_name | VARCHAR(200) | NULLABLE | Nom du signataire (optionnel) |
| refusal_reason | VARCHAR(500) | NULLABLE | Motif si REFUSED |
| latitude | DECIMAL(10,8) | NOT NULL | Latitude GPS capture |
| longitude | DECIMAL(11,8) | NOT NULL | Longitude GPS capture |
| gps_accuracy | DECIMAL(6,2) | NOT NULL | Précision GPS en mètres |
| integrity_hash | VARCHAR(64) | NOT NULL | SHA-256 du payload |
| captured_at | TIMESTAMP | NOT NULL | Heure de capture (device) |
| synced_at | TIMESTAMP | NOT NULL | Heure de synchronisation serveur |
| created_by | UUID | FK → users.id, NOT NULL | Chauffeur qui a créé |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date création serveur |

**Indexes**:
- `idx_delivery_proofs_trip_id` on `trip_id` (UNIQUE)
- `idx_delivery_proofs_created_at` on `created_at`
- `idx_delivery_proofs_created_by` on `created_by`

**Validation Rules**:
- `signature_image` doit contenir un PNG Base64 valide ≤ 100KB
- `signature_image` doit couvrir ≥ 15% du canvas
- `status` REFUSED nécessite `refusal_reason` non vide
- `latitude` entre -90 et 90
- `longitude` entre -180 et 180
- `gps_accuracy` > 0

---

### ProofPhoto

Photos optionnelles associées à une preuve.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| proof_id | UUID | FK → delivery_proofs.id, NOT NULL | Preuve parente |
| photo_image | TEXT | NOT NULL | Image JPEG en Base64 (max 500KB) |
| display_order | INTEGER | NOT NULL | Ordre d'affichage (1, 2, 3) |
| latitude | DECIMAL(10,8) | NOT NULL | Latitude GPS photo |
| longitude | DECIMAL(11,8) | NOT NULL | Longitude GPS photo |
| captured_at | TIMESTAMP | NOT NULL | Heure de capture |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date création serveur |

**Indexes**:
- `idx_proof_photos_proof_id` on `proof_id`
- `idx_proof_photos_order` on `(proof_id, display_order)`

**Validation Rules**:
- `photo_image` doit contenir un JPEG Base64 valide ≤ 500KB
- `display_order` entre 1 et 3
- Maximum 3 photos par proof (enforcé côté application)

---

### ProofStatus (Enum)

| Value | Description |
|-------|-------------|
| SIGNED | Client a signé la livraison |
| REFUSED | Client a refusé de signer |

---

### Trip (Modified)

Ajout d'un indicateur de présence POD.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ... | ... | ... | Champs existants |
| has_proof | BOOLEAN | NOT NULL, DEFAULT FALSE | Indique si un POD existe |

**Note**: Le champ `has_proof` est dénormalisé pour optimiser les requêtes de filtrage sans JOIN.

---

## State Transitions

### DeliveryProof Lifecycle

```
                    ┌─────────────────────┐
                    │    Trip.status =    │
                    │    IN_PROGRESS      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
        ┌──────────│    POD Creation     │──────────┐
        │          └─────────────────────┘          │
        │                                           │
        ▼                                           ▼
┌───────────────┐                           ┌───────────────┐
│    SIGNED     │                           │    REFUSED    │
│               │                           │               │
│ • signature   │                           │ • reason      │
│ • photos opt. │                           │   required    │
│ • signer name │                           │ • no signature│
│   optional    │                           │               │
└───────────────┘                           └───────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Trip.status = COMPLETED                  │
│                 Trip.has_proof = TRUE                    │
└─────────────────────────────────────────────────────────┘
```

**Rules**:
1. Un POD ne peut être créé que pour un trip en statut `IN_PROGRESS`
2. La création du POD déclenche automatiquement `Trip.status = COMPLETED`
3. Un POD est immutable après création (pas de modification)
4. Un trip ne peut avoir qu'un seul POD (relation 1:1)

---

## Database Migration (Flyway)

**File**: `V8__add_delivery_proof.sql`

```sql
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

-- Add comment
COMMENT ON TABLE delivery_proofs IS 'Proof of delivery records with electronic signatures - Feature 015';
COMMENT ON TABLE proof_photos IS 'Optional photos attached to delivery proofs - Feature 015';
```

---

## Retention & Archival

### Strategy

| Age | Storage | Action |
|-----|---------|--------|
| 0-2 years | `delivery_proofs` | Active, full access |
| 2-7 years | `delivery_proofs_archive` | Read-only, on-demand |
| > 7 years | Deleted | Legal retention expired |

### Archive Table (Future)

```sql
-- Created by scheduled job, not in initial migration
CREATE TABLE delivery_proofs_archive (
    -- Same structure as delivery_proofs
    archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

# Quickstart: Proof of Delivery (POD)

**Feature**: 015-proof-of-delivery
**Date**: 2025-12-28

## Prerequisites

- Backend services running (`./scripts/start-all.sh`)
- Mobile Expo dev environment (`cd mobile-expo && npx expo start`)
- User logged in as DRIVER role
- At least one trip in `IN_PROGRESS` status assigned to the driver

## Test Scenarios

### Scenario 1: Capture Signature (Happy Path)

**Steps**:
1. Open mobile app as driver
2. Navigate to Trips screen
3. Select a trip with status `IN_PROGRESS`
4. Tap "Complete Delivery" button
5. On signature screen, sign with finger covering at least 15% of canvas
6. Tap "Confirm" button
7. Trip status changes to `COMPLETED`

**Expected API Call**:
```bash
curl -X POST "http://localhost:8000/location/v1/trips/{tripId}/proof" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SIGNED",
    "signatureImage": "data:image/png;base64,iVBORw0KGgo...",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "gpsAccuracy": 5.0,
    "capturedAt": "2025-12-28T14:30:00Z"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": "uuid-of-proof",
  "tripId": "uuid-of-trip",
  "status": "SIGNED",
  "statusDisplay": "Signé",
  "integrityHash": "a3f2b1c4d5e6...",
  "capturedAt": "2025-12-28T14:30:00Z",
  "syncedAt": "2025-12-28T14:30:05Z",
  "hasPhotos": false,
  "photoCount": 0
}
```

---

### Scenario 2: Signature with Photo

**Steps**:
1. Same as Scenario 1 until signature screen
2. After signing, tap "Add Photo"
3. Capture photo of delivered package
4. Confirm photo
5. Tap "Confirm" to submit

**Expected API Call**:
```bash
curl -X POST "http://localhost:8000/location/v1/trips/{tripId}/proof" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SIGNED",
    "signatureImage": "data:image/png;base64,...",
    "signerName": "Jean Dupont",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "gpsAccuracy": 5.0,
    "capturedAt": "2025-12-28T14:30:00Z",
    "photos": [
      {
        "photoImage": "data:image/jpeg;base64,...",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "capturedAt": "2025-12-28T14:29:45Z"
      }
    ]
  }'
```

---

### Scenario 3: Client Refuses to Sign

**Steps**:
1. Navigate to trip detail
2. Tap "Complete Delivery"
3. Tap "Client Refuses" button
4. Enter refusal reason: "Client absent, voisin a refusé"
5. Confirm

**Expected API Call**:
```bash
curl -X POST "http://localhost:8000/location/v1/trips/{tripId}/proof" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REFUSED",
    "signatureImage": "",
    "refusalReason": "Client absent, voisin a refusé",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "gpsAccuracy": 5.0,
    "capturedAt": "2025-12-28T14:30:00Z"
  }'
```

---

### Scenario 4: Admin Views POD

**Steps**:
1. Log in to web admin as FLEET_MANAGER
2. Navigate to Trips list
3. Filter by "Completed with POD"
4. Click on a trip
5. View POD section with signature and photos

**Expected API Call**:
```bash
curl -X GET "http://localhost:8000/location/v1/admin/proofs?status=SIGNED&page=0&size=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "content": [
    {
      "id": "uuid",
      "tripId": "uuid",
      "status": "SIGNED",
      "signerName": "Jean Dupont",
      "capturedAt": "2025-12-28T14:30:00Z",
      "hasPhotos": true,
      "photoCount": 1
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

---

### Scenario 5: Download PDF

**Steps**:
1. View POD details in admin panel
2. Click "Download PDF" button
3. PDF file downloads

**Expected API Call**:
```bash
curl -X GET "http://localhost:8000/location/v1/admin/proofs/{proofId}/pdf" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o proof-of-delivery.pdf
```

---

### Scenario 6: Offline Capture + Sync

**Steps**:
1. Enable airplane mode on mobile device
2. Complete delivery with signature
3. See "Pending sync" indicator
4. Disable airplane mode
5. POD automatically syncs within 5 minutes

**Expected Behavior**:
- Signature saved locally in AsyncStorage
- Trip marked as COMPLETED locally
- On reconnect, sync automatically triggered
- Server receives POD with original `capturedAt` timestamp

---

## Validation Rules to Test

### Signature Validation

| Test | Input | Expected |
|------|-------|----------|
| Empty signature | Empty canvas | 400: "Signature required" |
| Too small | < 15% coverage | 400: "Signature too small" |
| Valid | ≥ 15% coverage | 201: Success |
| Too large | > 100KB | 400: "Signature exceeds size limit" |

### Photo Validation

| Test | Input | Expected |
|------|-------|----------|
| Valid photo | ≤ 500KB JPEG | 201: Success |
| Too large | > 500KB | 400: "Photo exceeds size limit" |
| Wrong format | PNG instead of JPEG | 400: "Invalid photo format" |
| Too many | 4 photos | 400: "Maximum 3 photos allowed" |

### Trip State Validation

| Test | Trip Status | Expected |
|------|-------------|----------|
| Valid | IN_PROGRESS | 201: Success |
| Not started | ASSIGNED | 409: "Trip must be IN_PROGRESS" |
| Already complete | COMPLETED | 409: "Trip already has proof" |
| Wrong driver | IN_PROGRESS (other driver) | 403: "Not assigned to this trip" |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| PROOF_REQUIRED | 400 | Signature is required |
| SIGNATURE_TOO_SMALL | 400 | Signature must cover at least 15% |
| SIGNATURE_TOO_LARGE | 400 | Signature exceeds 100KB |
| PHOTO_TOO_LARGE | 400 | Photo exceeds 500KB |
| TOO_MANY_PHOTOS | 400 | Maximum 3 photos allowed |
| REFUSAL_REASON_REQUIRED | 400 | Reason required when refusing |
| TRIP_NOT_IN_PROGRESS | 409 | Trip must be IN_PROGRESS |
| PROOF_ALREADY_EXISTS | 409 | Trip already has a proof |
| NOT_ASSIGNED_TO_TRIP | 403 | Driver not assigned to this trip |
| TRIP_NOT_FOUND | 404 | Trip does not exist |
| PROOF_NOT_FOUND | 404 | Proof does not exist |

---

## Test Data Setup

```sql
-- Create a test trip in IN_PROGRESS status
INSERT INTO trips (id, origin, destination, status, assigned_driver_id, created_by, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '123 Rue de Paris',
  '456 Avenue des Champs',
  'IN_PROGRESS',
  'driver-uuid-here',
  'admin-uuid-here',
  NOW()
);
```

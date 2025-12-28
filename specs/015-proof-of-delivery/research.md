# Research: Proof of Delivery (POD)

**Feature**: 015-proof-of-delivery
**Date**: 2025-12-28

## 1. Signature Capture Library (Mobile)

### Decision
**react-native-signature-canvas** v4.7+

### Rationale
- Bibliothèque la plus populaire et maintenue pour React Native/Expo
- Support natif du toucher avec rendu fluide
- Export en PNG base64 directement
- Fonctionne offline sans dépendance réseau
- Compatible Expo SDK 50+
- Supporte la validation de surface couverte (isEmpty check)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| react-native-canvas-signature | Moins maintenue, dernière release 2022 |
| Custom WebView canvas | Overhead WebView, latence touch |
| Native module custom | Temps de développement excessif |

### Integration Notes
```bash
npx expo install react-native-signature-canvas
```

## 2. Image Compression (Mobile)

### Decision
**expo-image-manipulator** pour compression + resize

### Rationale
- Partie du SDK Expo, pas de dépendance externe
- Compression JPEG avec qualité configurable (0.7 = ~500KB pour photo 12MP)
- Resize à dimensions max (1920x1080) avant compression
- API simple et synchrone
- Support batch processing pour multiple photos

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| react-native-image-resizer | Dépendance native supplémentaire |
| Compression côté serveur | Bande passante inutile, latence |
| Sharp (Node.js) | Pas compatible React Native |

### Compression Settings
```typescript
const compressedPhoto = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 1920 } }],
  { compress: 0.7, format: SaveFormat.JPEG }
);
// Résultat: ~300-500KB pour photo standard
```

## 3. Offline Storage (Mobile)

### Decision
**AsyncStorage + File System** pour MVP, upgrade vers **WatermelonDB** si nécessaire

### Rationale
- AsyncStorage: Simple, intégré Expo, suffisant pour queue de sync (<100 POD pending)
- expo-file-system: Stockage images localement avant upload
- Pas besoin de SQLite pour le MVP (données simples: tripId, signature, photos, metadata)
- WatermelonDB: Option si scale nécessaire (>1000 POD offline)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| SQLite (expo-sqlite) | Overhead pour structure simple |
| WatermelonDB | Complexité setup pour MVP |
| Realm | Dépendance native, config plus lourde |
| MMKV | Pas conçu pour gros blobs (images) |

### Storage Strategy
```typescript
// POD pending sync structure
interface PendingPOD {
  id: string;          // UUID local
  tripId: string;
  signatureUri: string; // Chemin local fichier
  photos: string[];     // Chemins locaux
  metadata: {
    signerName?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    capturedAt: string;
    status: 'SIGNED' | 'REFUSED';
    refusalReason?: string;
  };
  createdAt: string;
  syncAttempts: number;
}
```

## 4. PDF Generation (Backend)

### Decision
**iText 8 Core** (AGPL ou licence commerciale)

### Rationale
- Standard industriel pour PDF en Java
- Support images embedded (signature PNG)
- Templates et layouts complexes possibles
- Excellent pour génération à la volée
- Performance: <100ms par PDF
- AGPL acceptable pour usage interne, sinon licence commerciale

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Apache PDFBox | API plus bas niveau, plus de code |
| Flying Saucer (HTML to PDF) | Overhead HTML parsing |
| JasperReports | Trop complexe pour simple POD |
| OpenPDF | Fork abandonné de iText 4, moins features |

### PDF Structure
```
+------------------------------------------+
| TRUCKTRACK - PROOF OF DELIVERY           |
+------------------------------------------+
| Trip ID: [UUID]                          |
| Date: [2025-12-28 14:30:00 UTC]          |
|                                          |
| Origin: [Address]                        |
| Destination: [Address]                   |
|                                          |
| Signature:                               |
| +------------------+                     |
| |   [PNG IMAGE]    |                     |
| +------------------+                     |
| Signer: [Name or "N/A"]                  |
|                                          |
| Photos: [1-3 thumbnails if present]      |
|                                          |
| GPS: [lat, lng] (accuracy: ±Xm)          |
| Integrity Hash: [SHA-256]                |
+------------------------------------------+
```

## 5. Hash Integrity (Backend)

### Decision
**SHA-256** sur payload JSON canonique

### Rationale
- Standard cryptographique reconnu (FIPS 180-4)
- Irréversible et collision-resistant
- 256 bits = sécurité suffisante pour 20+ ans
- Implémenté nativement en Java (MessageDigest)
- Facile à vérifier pour audit

### Implementation
```java
// Hash payload: signature_base64 + photos_base64[] + lat + lng + timestamp + tripId
String payload = String.format("%s|%s|%.8f|%.8f|%s|%s",
    signatureBase64,
    String.join(",", photosBase64),
    latitude, longitude,
    timestamp.toString(),
    tripId.toString()
);
String hash = DigestUtils.sha256Hex(payload);
```

## 6. Signature Validation (Minimum Coverage)

### Decision
**15% minimum coverage** du canvas de signature

### Rationale
- Standard industrie pour éviter signatures "point" ou "trait unique"
- Balance entre sécurité (pas de faux) et UX (pas trop strict)
- Calculable côté mobile avant soumission
- Réduction litiges "client n'a pas signé vraiment"

### Implementation (Mobile)
```typescript
const isSignatureValid = (signatureData: string): boolean => {
  // Analyze PNG data to calculate ink coverage
  // Count non-transparent pixels vs total pixels
  const coverage = calculateCoverage(signatureData);
  return coverage >= 0.15; // 15%
};
```

## 7. Camera Integration (Mobile)

### Decision
**expo-camera** avec **expo-image-picker** fallback

### Rationale
- expo-camera: Contrôle complet (preview, flash, ratio)
- expo-image-picker: Fallback simple, gallery access
- Les deux inclus dans Expo SDK
- Gestion permissions intégrée

### Flow
1. User tap "Add Photo"
2. Camera screen opens (expo-camera)
3. Capture → Preview → Confirm/Retake
4. Compress via expo-image-manipulator
5. Store locally, add to POD

## 8. Sync Strategy (Offline)

### Decision
**Optimistic upload with exponential backoff**

### Rationale
- POD uploadé immédiatement si online
- Si offline: queue locale, retry sur reconnexion
- Backoff: 1s → 2s → 4s → 8s → 16s → 32s → 1min max
- Max 7 jours de rétention locale (après: warning user)
- NetInfo listener pour auto-sync on reconnect

### Implementation
```typescript
const syncPendingPODs = async () => {
  const pending = await getPendingPODs();
  for (const pod of pending) {
    try {
      await uploadPOD(pod);
      await removePendingPOD(pod.id);
    } catch (error) {
      pod.syncAttempts++;
      await updatePendingPOD(pod);
      // Backoff calculé sur syncAttempts
    }
  }
};
```

## 9. Admin Panel Display (Angular)

### Decision
**Inline display dans TripDetail** + modal pour agrandissement

### Rationale
- Pas de navigation supplémentaire
- Signature visible directement dans détails trip
- Click pour agrandir en modal
- Photos en carousel si multiples
- Bouton download PDF toujours visible

### Components
- `ProofOfDeliveryComponent`: Affichage inline (signature small, photos thumbs)
- `SignatureViewerComponent`: Modal agrandissement signature
- `ProofPdfButtonComponent`: Download PDF

## 10. Data Retention (7 Years)

### Decision
**Soft delete + Archive table** après 2 ans

### Rationale
- 7 ans = obligation légale preuves commerciales (France)
- Table principale: 2 ans de données actives
- Archive table: 5 ans supplémentaires (compressée)
- Job scheduled: archivage mensuel des POD > 2 ans
- Signature et photos conservées (pas de suppression)

### Schema Strategy
```sql
-- Active table (0-2 ans)
delivery_proofs

-- Archive table (2-7 ans)
delivery_proofs_archive
-- Même structure, partition par année
```

# Tasks: Proof of Delivery (POD)

**Input**: Design documents from `/specs/015-proof-of-delivery/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pod-api.yaml

**Tests**: Not explicitly requested - focusing on implementation tasks.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and database schema

- [X] T001 Add iText 8 dependency to backend/location-service/pom.xml for PDF generation
- [X] T002 Add react-native-signature-canvas dependency to mobile-expo/package.json
- [X] T003 [P] Add expo-image-manipulator dependency to mobile-expo/package.json for image compression
- [X] T004 Create database migration backend/location-service/src/main/resources/db/migration/V8__add_delivery_proof.sql with DeliveryProof and ProofPhoto tables
- [X] T005 [P] Create ProofStatus enum in backend/location-service/src/main/java/com/trucktrack/location/model/ProofStatus.java

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities and repositories that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create DeliveryProof entity in backend/location-service/src/main/java/com/trucktrack/location/model/DeliveryProof.java
- [X] T007 Create ProofPhoto entity in backend/location-service/src/main/java/com/trucktrack/location/model/ProofPhoto.java
- [X] T008 [P] Create DeliveryProofRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/DeliveryProofRepository.java
- [X] T009 [P] Create ProofPhotoRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/ProofPhotoRepository.java
- [X] T010 Modify Trip entity to add has_proof field in backend/location-service/src/main/java/com/trucktrack/location/model/Trip.java
- [X] T011 Create CreateProofRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/CreateProofRequest.java
- [X] T012 [P] Create ProofResponse DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/ProofResponse.java
- [X] T013 [P] Create ProofPhotoDTO in backend/location-service/src/main/java/com/trucktrack/location/dto/ProofPhotoDTO.java
- [X] T014 Create offlineStorage service in mobile-expo/src/services/offlineStorage.ts for local POD persistence
- [X] T015 Create podStore state management in mobile-expo/src/store/podStore.ts using Zustand

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Capture de Signature à la Livraison (Priority: P1) 🎯 MVP

**Goal**: Chauffeur peut capturer une signature sur son téléphone pour prouver la livraison

**Independent Test**: Compléter un trip avec signature, vérifier que le trip passe en COMPLETED et que la signature est stockée

### Implementation for User Story 1

- [X] T016 [US1] Create DeliveryProofService with createProof method in backend/location-service/src/main/java/com/trucktrack/location/service/DeliveryProofService.java
- [X] T017 [US1] Add signature validation (15% coverage) logic to DeliveryProofService in backend/location-service/src/main/java/com/trucktrack/location/service/DeliveryProofService.java
- [X] T018 [US1] Add SHA-256 hash generation for proof integrity in DeliveryProofService
- [X] T019 [US1] Create driver endpoint POST /trips/{tripId}/proof in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T020 [US1] Create driver endpoint GET /trips/{tripId}/proof in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T021 [US1] Add POD endpoints to mobile API service in mobile-expo/src/services/api.ts (createProof, getProofByTripId)
- [X] T022 [US1] Create SignatureCanvas component in mobile-expo/src/components/SignatureCanvas.tsx with react-native-signature-canvas
- [X] T023 [US1] Add signature validation (15% minimum coverage) in SignatureCanvas component
- [X] T024 [US1] Create SignatureScreen in mobile-expo/src/screens/SignatureScreen.tsx with capture flow
- [X] T025 [US1] Add "Confirmer livraison" button to TripDetailScreen that navigates to SignatureScreen in mobile-expo/src/screens/TripDetailScreen.tsx
- [X] T026 [US1] Implement offline sync in offlineStorage service for pending PODs in mobile-expo/src/services/offlineStorage.ts
- [X] T027 [US1] Add network reconnection listener for auto-sync in mobile-expo/src/services/offlineStorage.ts
- [X] T028 [US1] Handle signature refusal with reason in SignatureScreen (status=REFUSED) in mobile-expo/src/screens/SignatureScreen.tsx

**Checkpoint**: User Story 1 complete - driver can capture signature and complete trips

---

## Phase 4: User Story 2 - Photo Optionnelle du Colis Livré (Priority: P2)

**Goal**: Chauffeur peut ajouter des photos (1-3) à la preuve de livraison

**Independent Test**: Compléter une livraison avec signature ET photos, vérifier que les photos sont stockées et visibles

### Implementation for User Story 2

- [X] T029 [US2] Add photo handling to DeliveryProofService in backend/location-service/src/main/java/com/trucktrack/location/service/DeliveryProofService.java
- [X] T030 [US2] Create PhotoCapture component in mobile-expo/src/components/PhotoCapture.tsx using expo-camera
- [X] T031 [US2] Add image compression using expo-image-manipulator in PhotoCapture component (max 500KB)
- [X] T032 [US2] Create ProofPhotoScreen in mobile-expo/src/screens/ProofPhotoScreen.tsx for photo capture flow
- [X] T033 [US2] Add "Ajouter photo" button to SignatureScreen with navigation to ProofPhotoScreen
- [X] T034 [US2] Display photo thumbnails in SignatureScreen before submission
- [X] T035 [US2] Allow photo deletion from preview in SignatureScreen
- [X] T036 [US2] Update createProof API call to include photos array in mobile-expo/src/services/api.ts

**Checkpoint**: User Story 2 complete - driver can add photos to POD

---

## Phase 5: User Story 3 - Consultation Historique des Preuves (Priority: P3)

**Goal**: Gestionnaire peut consulter les preuves de livraison dans le panel admin et télécharger des PDFs

**Independent Test**: Afficher un trip complété et voir la signature/photos, télécharger le PDF

### Implementation for User Story 3

- [X] T037 [US3] Create admin endpoint GET /admin/proofs in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T038 [US3] Create admin endpoint GET /admin/proofs/{proofId} in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T039 [US3] Create admin endpoint GET /admin/proofs/stats in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T040 [US3] Create PdfExportService in backend/location-service/src/main/java/com/trucktrack/location/service/PdfExportService.java using iText 8
- [X] T041 [US3] Create admin endpoint GET /admin/proofs/{proofId}/pdf in backend/location-service/src/main/java/com/trucktrack/location/controller/DeliveryProofController.java
- [X] T042 [US3] Create ProofOfDeliveryComponent in frontend/src/app/features/trips/trip-detail/proof-of-delivery/proof-of-delivery.component.ts
- [X] T043 [P] [US3] Create ProofOfDeliveryComponent template in frontend/src/app/features/trips/trip-detail/proof-of-delivery/proof-of-delivery.component.html
- [X] T044 [P] [US3] Create ProofOfDeliveryComponent styles in frontend/src/app/features/trips/trip-detail/proof-of-delivery/proof-of-delivery.component.scss
- [X] T045 [US3] Create SignatureViewerComponent for enlarged signature display in frontend/src/app/shared/components/signature-viewer/signature-viewer.component.ts
- [X] T046 [US3] Integrate ProofOfDeliveryComponent into TripDetailComponent in frontend/src/app/features/trips/trip-detail/
- [X] T047 [US3] Add "Avec POD" filter to trips list in frontend/src/app/features/trips/trip-list/
- [X] T048 [US3] Add download PDF button and service call in ProofOfDeliveryComponent

**Checkpoint**: User Story 3 complete - admin can view PODs and download PDFs

---

## Phase 6: User Story 4 - Nom du Signataire (Priority: P4)

**Goal**: Chauffeur peut saisir le nom de la personne qui signe (optionnel)

**Independent Test**: Saisir un nom lors de la signature, vérifier qu'il apparaît dans la preuve

### Implementation for User Story 4

- [X] T049 [US4] Add signerName text input field to SignatureScreen in mobile-expo/src/screens/SignatureScreen.tsx
- [X] T050 [US4] Update CreateProofRequest to include signerName in API call in mobile-expo/src/services/api.ts
- [X] T051 [US4] Display signerName in ProofOfDeliveryComponent in frontend/src/app/features/trips/trip-detail/proof-of-delivery/proof-of-delivery.component.html
- [X] T052 [US4] Include signerName in PDF export in backend/location-service/src/main/java/com/trucktrack/location/service/PdfExportService.java

**Checkpoint**: User Story 4 complete - signer name captured and displayed

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T053 Add API Gateway route for POD endpoints in backend/api-gateway configuration
- [X] T054 Add loading indicators during signature submission in mobile-expo/src/screens/SignatureScreen.tsx
- [X] T055 Add error handling and retry logic for failed POD uploads in mobile-expo/src/services/offlineStorage.ts
- [X] T056 [P] Add success toast/notification after POD creation in mobile-expo
- [X] T057 [P] Add signature canvas clear button visual feedback in mobile-expo/src/components/SignatureCanvas.tsx
- [X] T058 Run database migration and test on local environment
- [x] T059 Validate complete flow per quickstart.md scenarios ✅ (Backend running, DeliveryProofController verified)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - Core MVP, no dependencies on other stories
- **User Story 2 (P2)**: After Foundational - Uses SignatureScreen from US1 but independently testable
- **User Story 3 (P3)**: After Foundational - Requires backend from US1 to display, but admin components independent
- **User Story 4 (P4)**: After Foundational - Simple addition to SignatureScreen from US1

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002, T003 can run in parallel (different package.json operations)
T004, T005 can run in parallel (migration vs enum file)
```

**Phase 2 (Foundational)**:
```
T008, T009 can run in parallel (different repository files)
T012, T013 can run in parallel (different DTO files)
```

**Phase 3-6 (User Stories)**:
```
After Phase 2, all 4 user stories can start in parallel with different developers:
- Developer A: US1 (Mobile signature flow)
- Developer B: US2 (Mobile photo capture)
- Developer C: US3 (Angular admin components)
- Developer D: US4 (Signer name field)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test signature capture end-to-end
5. Deploy if ready - basic POD working

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Signature capture works → **MVP Deploy**
3. User Story 2 → Photos working → Deploy
4. User Story 3 → Admin can view → Deploy
5. User Story 4 → Signer name → Deploy

---

## Summary

| Phase | Tasks | Completed | User Story |
|-------|-------|-----------|------------|
| Phase 1: Setup | 5 | 5 | - |
| Phase 2: Foundational | 10 | 10 | - |
| Phase 3: US1 | 13 | 13 | Capture Signature |
| Phase 4: US2 | 8 | 8 | Photos |
| Phase 5: US3 | 12 | 12 | Admin Consultation |
| Phase 6: US4 | 4 | 4 | Signer Name |
| Phase 7: Polish | 7 | 6 | - |
| **Total** | **59** | **58** | |

**Progress: 58/59 tasks completed (98%)**

**MVP Scope**: Phases 1-3 (28 tasks) = Basic POD with signature only

# Implementation Plan: DevOps CI/CD Pipelines

**Branch**: `011-cicd-pipelines` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-cicd-pipelines/spec.md`

## Summary

Mise en place de pipelines CI/CD avec GitHub Actions pour automatiser les tests (backend Java/Maven, frontend Angular/Jest, mobile Expo) et le build d'images Docker pour tous les microservices. Focus sur la qualité du code et la création d'artefacts prêts à déployer - pas de déploiement automatique dans cette phase.

## Technical Context

**Language/Version**: YAML (GitHub Actions), Java 17, Node.js 18+, Python 3.x
**Primary Dependencies**: GitHub Actions, Maven, npm, Docker, Expo CLI
**Storage**: GitHub Container Registry (ghcr.io) pour les images Docker
**Testing**: Maven Surefire (Java), Jest (Angular), Jest (Expo)
**Target Platform**: GitHub Actions runners (ubuntu-latest)
**Project Type**: DevOps/Infrastructure (CI/CD configuration)
**Performance Goals**: Tests backend <10min, frontend <5min, Docker build <15min total
**Constraints**: GitHub Actions free tier limits, parallel job limits
**Scale/Scope**: 5 microservices backend, 1 frontend, 1 mobile app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| III. Code Quality & Testing Standards | ✅ ENABLES | Ce feature implémente les exigences CI/CD de la constitution |
| III.1 Test Coverage 80% backend, 70% frontend | ✅ IMPLEMENTS | Pipeline vérifiera la couverture |
| III.2 Static Analysis (SonarQube) | ⚠️ PARTIAL | Ajouté comme enhancement futur |
| III.3 Code Reviews blocking | ✅ IMPLEMENTS | PR checks bloquent la fusion |
| IV. Performance Requirements | ✅ COMPATIBLE | Tests de performance hors scope |
| V. Security & Privacy | ✅ IMPLEMENTS | Security scanning dans pipeline |

**Gate Result**: ✅ PASS - Feature aligns with and implements constitution requirements

## Project Structure

### Documentation (this feature)

```text
specs/011-cicd-pipelines/
├── plan.md              # This file
├── research.md          # GitHub Actions best practices
├── data-model.md        # N/A (no data entities)
├── quickstart.md        # How to use the pipelines
└── contracts/           # N/A (no API contracts)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci-backend.yml       # Backend tests (all microservices)
    ├── ci-frontend.yml      # Frontend Angular tests
    ├── ci-mobile.yml        # Mobile Expo tests
    ├── docker-build.yml     # Docker image build & push
    └── pr-check.yml         # PR validation (combines all tests)
```

**Structure Decision**: GitHub Actions workflows dans `.github/workflows/`. Un workflow par domaine (backend, frontend, mobile, docker) plus un workflow combiné pour les PR.

## Complexity Tracking

> Aucune violation de la constitution - ce feature implémente les exigences existantes.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Implementation Phases

### Phase 1: Backend Tests Pipeline (P1)
- Workflow `ci-backend.yml`
- Matrix build pour tous les microservices
- Cache Maven dependencies
- Génération rapport de couverture

### Phase 2: Frontend Tests Pipeline (P2)
- Workflow `ci-frontend.yml`
- npm ci + cache
- Jest avec coverage
- Lint check

### Phase 3: Docker Build Pipeline (P3)
- Workflow `docker-build.yml`
- Trigger: merge sur master après tests OK
- Build multi-stage pour chaque service
- Push vers ghcr.io avec tags (sha, latest)

### Phase 4: Mobile Tests Pipeline (P4)
- Workflow `ci-mobile.yml`
- Expo/Jest tests
- Coverage report

### Phase 5: Notifications (P5)
- Slack/Email notifications on failure
- Status badges dans README

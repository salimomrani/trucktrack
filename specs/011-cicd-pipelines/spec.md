# Feature Specification: DevOps CI/CD Pipelines

**Feature Branch**: `011-cicd-pipelines`
**Created**: 2025-12-26
**Status**: Draft
**Input**: DevOps CI/CD Pipelines - Mise en place des pipelines d'intégration continue pour le projet TruckTrack. Phase 1: Tests automatisés. Phase 2: Build Docker. Pas de déploiement automatique pour l'instant.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Backend Tests Automation (Priority: P1)

En tant que développeur backend, je veux que les tests unitaires Java soient exécutés automatiquement à chaque push ou pull request, afin de détecter les régressions avant la fusion du code.

**Why this priority**: Les tests backend sont fondamentaux car ils valident la logique métier critique (authentification, gestion GPS, trajets). Sans tests automatisés, des bugs peuvent passer en production.

**Independent Test**: Peut être testé en créant une PR avec un test qui échoue - le pipeline doit bloquer la fusion.

**Acceptance Scenarios**:

1. **Given** un développeur pousse du code sur une branche, **When** le push est détecté, **Then** les tests Maven sont exécutés automatiquement pour tous les microservices
2. **Given** un test échoue, **When** le pipeline se termine, **Then** le statut est marqué "échec" et la fusion est bloquée
3. **Given** tous les tests passent, **When** le pipeline se termine, **Then** le statut est marqué "succès" et la fusion est autorisée

---

### User Story 2 - Frontend Tests Automation (Priority: P2)

En tant que développeur frontend, je veux que les tests Angular soient exécutés automatiquement, afin de garantir que les composants UI fonctionnent correctement.

**Why this priority**: Les tests frontend valident l'interface utilisateur qui est le point de contact avec les utilisateurs finaux.

**Independent Test**: Peut être testé en modifiant un composant Angular et vérifiant que les tests sont exécutés.

**Acceptance Scenarios**:

1. **Given** du code Angular est modifié, **When** un push est effectué, **Then** les tests Jest sont exécutés
2. **Given** les tests frontend échouent, **When** le pipeline se termine, **Then** une notification est envoyée et le build est marqué en échec

---

### User Story 3 - Docker Image Build (Priority: P3)

En tant qu'équipe DevOps, je veux que les images Docker soient construites automatiquement après validation des tests, afin d'avoir des artefacts prêts à déployer.

**Why this priority**: Le build Docker prépare les artefacts de déploiement mais dépend de la validation des tests en amont.

**Independent Test**: Peut être testé en vérifiant que les images sont publiées dans le registry après un merge sur master.

**Acceptance Scenarios**:

1. **Given** tous les tests passent sur la branche master, **When** le merge est effectué, **Then** les images Docker de chaque microservice sont construites
2. **Given** les images sont construites avec succès, **When** le build se termine, **Then** les images sont poussées vers le registry avec les tags appropriés (version, latest)
3. **Given** un build Docker échoue, **When** l'erreur est détectée, **Then** une notification est envoyée à l'équipe

---

### User Story 4 - Mobile Tests Automation (Priority: P4)

En tant que développeur mobile, je veux que les tests Expo soient exécutés automatiquement, afin de valider l'application mobile.

**Why this priority**: Les tests mobile sont importants mais moins critiques que le backend et peuvent être exécutés en parallèle.

**Independent Test**: Peut être testé en modifiant le code mobile-expo et vérifiant que les tests sont lancés.

**Acceptance Scenarios**:

1. **Given** du code mobile-expo est modifié, **When** un push est effectué, **Then** les tests sont exécutés
2. **Given** les tests mobile passent, **When** le pipeline se termine, **Then** un rapport de couverture est généré

---

### User Story 5 - Failure Notifications (Priority: P5)

En tant que membre de l'équipe, je veux être notifié en cas d'échec du pipeline, afin de pouvoir réagir rapidement.

**Why this priority**: Les notifications sont essentielles pour la réactivité mais dépendent des autres fonctionnalités.

**Independent Test**: Peut être testé en forçant un échec et vérifiant la réception de la notification.

**Acceptance Scenarios**:

1. **Given** un pipeline échoue, **When** l'échec est détecté, **Then** une notification est envoyée avec les détails de l'erreur
2. **Given** un pipeline revient au succès après un échec, **When** le succès est confirmé, **Then** une notification de récupération est envoyée

---

### Edge Cases

- Que se passe-t-il si un service tiers (registry Docker) est indisponible ?
- Comment gérer les timeouts sur les tests longs ?
- Que faire si les tests passent mais le build Docker échoue ?
- Comment gérer les branches avec des caractères spéciaux dans le nom ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT exécuter les tests automatiquement à chaque push sur toute branche
- **FR-002**: Le système DOIT exécuter les tests automatiquement à chaque pull request
- **FR-003**: Le système DOIT bloquer la fusion si les tests échouent
- **FR-004**: Le système DOIT construire les images Docker uniquement après succès des tests sur master
- **FR-005**: Le système DOIT taguer les images avec le numéro de version et "latest"
- **FR-006**: Le système DOIT pousser les images vers un registry Docker
- **FR-007**: Le système DOIT envoyer des notifications en cas d'échec
- **FR-008**: Le système DOIT générer des rapports de couverture de tests
- **FR-009**: Le système DOIT exécuter les tests en parallèle quand possible pour optimiser le temps
- **FR-010**: Le système DOIT supporter l'exécution manuelle des pipelines

### Key Entities

- **Pipeline**: Séquence d'étapes automatisées (tests, build, notification)
- **Job**: Unité de travail dans un pipeline (ex: test-backend, build-docker)
- **Artifact**: Résultat d'un job (rapport de tests, image Docker, logs)
- **Notification**: Message envoyé suite à un événement de pipeline

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les tests backend s'exécutent en moins de 10 minutes
- **SC-002**: Les tests frontend s'exécutent en moins de 5 minutes
- **SC-003**: Le build Docker complet (tous services) s'exécute en moins de 15 minutes
- **SC-004**: 100% des PR ont leurs tests exécutés automatiquement
- **SC-005**: Les notifications d'échec sont reçues dans les 2 minutes suivant l'échec
- **SC-006**: Le taux de faux positifs (tests flaky) est inférieur à 5%
- **SC-007**: La couverture de code est visible et mesurable pour chaque PR

## Scope & Boundaries

### In Scope

- Tests automatisés backend (Java/Maven)
- Tests automatisés frontend (Angular/Jest)
- Tests automatisés mobile (Expo)
- Build des images Docker pour les microservices backend
- Push vers un registry Docker
- Notifications d'échec/succès
- Rapports de couverture de code

### Out of Scope

- Déploiement automatique en environnement
- Tests d'intégration end-to-end
- Tests de performance/charge
- Gestion des secrets de production
- Configuration des environnements de déploiement

## Assumptions

- GitHub Actions est disponible sur le repository
- Un registry Docker (GitHub Container Registry ou Docker Hub) est accessible
- Les tests existants sont fonctionnels et passent localement
- Les Dockerfiles existent pour chaque microservice backend
- L'équipe a accès aux notifications (email ou Slack)

## Dependencies

- Repository GitHub avec Actions activées
- Registry Docker configuré
- Dockerfiles fonctionnels pour chaque service
- Tests unitaires existants et fonctionnels

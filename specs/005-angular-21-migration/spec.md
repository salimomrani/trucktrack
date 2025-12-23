# Feature Specification: Angular 21 Migration

**Feature Branch**: `005-angular-21-migration`
**Created**: 2025-12-23
**Status**: Draft
**Input**: Migration Angular 17 vers Angular 21 - Mise à jour du frontend TruckTrack de Angular 17.3 vers Angular 21.0.6

## Overview

Migration du frontend TruckTrack de Angular 17.3.0 vers Angular 21.0.6, la dernière version stable. Cette migration est nécessaire car Angular 17 n'est plus en support LTS (Long-Term Support). La mise à jour apporte des améliorations significatives en termes de performance, d'expérience développeur et de modernisation du code.

### Versions concernées

| Dépendance | Version actuelle | Version cible |
|------------|------------------|---------------|
| @angular/core | 17.3.0 | 21.0.6 |
| @angular/cli | 17.3.17 | 21.0.6 |
| @angular/material | 17.3.10 | 21.x |
| @ngrx/store | 17.2.0 | 21.x |
| RxJS | 7.8.0 | 7.8.x (compatible) |
| TypeScript | 5.4.2 | 5.6+ |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Application Functional Parity (Priority: P1)

En tant qu'utilisateur de TruckTrack, je veux que toutes les fonctionnalités existantes continuent de fonctionner après la migration, afin de ne pas perdre de productivité.

**Why this priority**: La rétrocompatibilité fonctionnelle est critique. Sans elle, la migration n'a aucune valeur car les utilisateurs perdraient leurs outils de travail.

**Independent Test**: Peut être testé en exécutant tous les tests E2E existants et en vérifiant manuellement les parcours utilisateur critiques (login, carte GPS, geofences, alertes).

**Acceptance Scenarios**:

1. **Given** l'application migrée est déployée, **When** un utilisateur se connecte avec des identifiants valides, **Then** il accède au dashboard comme avant la migration
2. **Given** l'utilisateur est connecté, **When** il consulte la carte temps réel, **Then** les positions GPS des camions s'affichent et se mettent à jour en temps réel
3. **Given** l'utilisateur est sur la page des geofences, **When** il crée/modifie/supprime une zone, **Then** les opérations fonctionnent comme avant
4. **Given** l'utilisateur est sur la page des alertes, **When** une alerte se déclenche, **Then** la notification WebSocket s'affiche en temps réel
5. **Given** l'utilisateur est admin, **When** il accède au panneau d'administration, **Then** toutes les fonctions CRUD sont opérationnelles

---

### User Story 2 - Faster Build Times (Priority: P2)

En tant que développeur, je veux que les temps de build et de hot-reload soient significativement réduits grâce au nouveau build system Esbuild.

**Why this priority**: L'amélioration de l'expérience développeur augmente la productivité de l'équipe et réduit la frustration lors du développement.

**Independent Test**: Peut être mesuré en comparant les temps de build avant/après migration avec `npm run build` et en mesurant le temps de rafraîchissement lors des modifications.

**Acceptance Scenarios**:

1. **Given** le projet migré, **When** je lance `npm run build`, **Then** le build complet s'exécute plus rapidement qu'avant (objectif: -50%)
2. **Given** le serveur de développement est lancé, **When** je modifie un fichier source, **Then** le hot-reload s'effectue en moins de 2 secondes
3. **Given** le projet migré, **When** je lance `ng serve`, **Then** le serveur démarre en moins de 10 secondes

---

### User Story 3 - Improved Runtime Performance (Priority: P3)

En tant qu'utilisateur, je veux que l'application soit plus réactive et fluide grâce au zoneless change detection.

**Why this priority**: Les améliorations de performance améliorent l'expérience utilisateur mais ne sont pas bloquantes pour la migration.

**Independent Test**: Peut être mesuré via Lighthouse scores et mesures de rendering performance dans les DevTools.

**Acceptance Scenarios**:

1. **Given** l'application migrée en mode zoneless, **When** je navigue entre les pages, **Then** les transitions sont fluides sans lag perceptible
2. **Given** la carte avec 100+ camions affichés, **When** les positions se mettent à jour, **Then** aucun freeze ou ralentissement n'est perceptible
3. **Given** l'application chargée, **When** je mesure le bundle size, **Then** la taille est réduite d'au moins 10% par rapport à la version précédente

---

### User Story 4 - Long-Term Support Compliance (Priority: P1)

En tant que responsable technique, je veux être sur une version supportée d'Angular pour recevoir les correctifs de sécurité et de bugs.

**Why this priority**: Être sur une version non supportée expose l'application à des vulnérabilités de sécurité non corrigées.

**Independent Test**: Peut être vérifié en consultant la documentation officielle Angular sur les versions supportées.

**Acceptance Scenarios**:

1. **Given** la migration terminée, **When** je vérifie la version Angular, **Then** elle correspond à Angular 21.x qui est en support actif
2. **Given** une vulnérabilité est découverte, **When** un patch est publié par l'équipe Angular, **Then** nous pouvons l'appliquer car nous sommes sur une version supportée

---

### Edge Cases

- Que se passe-t-il si un composant tiers n'est pas compatible avec Angular 21? Identifier les alternatives ou forker/patcher temporairement
- Comment gérer les breaking changes dans les APIs Angular Material? Suivre le guide de migration officiel et adapter le code
- Que faire si le zoneless change detection cause des bugs dans certains composants? Option de fallback vers zone.js pour les composants problématiques
- Comment gérer les tests unitaires qui dépendent de zone.js? Mettre à jour les tests pour utiliser les nouvelles APIs de testing

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'application DOIT compiler sans erreurs après la migration vers Angular 21
- **FR-002**: Tous les tests unitaires existants DOIVENT passer après adaptation aux nouvelles APIs
- **FR-003**: Tous les tests E2E existants DOIVENT passer sans modification fonctionnelle
- **FR-004**: L'application DOIT utiliser le nouveau build system @angular/build (Esbuild)
- **FR-005**: L'application DOIT adopter le zoneless change detection comme mode par défaut
- **FR-006**: Les composants Angular Material DOIVENT être mis à jour vers la version compatible
- **FR-007**: Le state management NgRx DOIT être mis à jour vers la version compatible
- **FR-008**: Le fichier de configuration DOIT être mis à jour (angular.json pour @angular/build)
- **FR-009**: Les imports et APIs dépréciés DOIVENT être remplacés par leurs équivalents modernes
- **FR-010**: L'application DOIT fonctionner sur les navigateurs supportés (Chrome, Firefox, Safari, Edge dernières versions)

### Migration Requirements

- **MR-001**: La migration DOIT suivre la procédure officielle `ng update`
- **MR-002**: La migration DOIT être effectuée de manière incrémentale (17 vers 18 vers 19 vers 20 vers 21)
- **MR-003**: Chaque étape de migration DOIT être validée avant de passer à la suivante
- **MR-004**: Un rollback DOIT être possible à chaque étape via git

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des tests unitaires passent après migration
- **SC-002**: 100% des tests E2E passent après migration
- **SC-003**: Le temps de build production est réduit d'au moins 40%
- **SC-004**: Le temps de démarrage du serveur de développement est réduit d'au moins 50%
- **SC-005**: Le hot-reload s'effectue en moins de 2 secondes
- **SC-006**: La taille du bundle production est réduite d'au moins 10%
- **SC-007**: Le score Lighthouse Performance reste supérieur à 80
- **SC-008**: Aucune régression fonctionnelle n'est introduite (validé par QA)
- **SC-009**: L'application est sur Angular 21.x, version en support actif

## Assumptions

- Les dépendances tierces (Leaflet, etc.) sont compatibles avec Angular 21 ou ont des alternatives
- L'équipe a accès à la documentation de migration officielle Angular
- Le CI/CD existant peut être adapté pour le nouveau build system
- Les navigateurs cibles supportent les fonctionnalités requises par Angular 21

## Out of Scope

- Refactoring majeur du code existant (au-delà de ce qui est requis pour la migration)
- Ajout de nouvelles fonctionnalités
- Changements d'architecture ou de patterns
- Migration vers Server-Side Rendering (SSR)

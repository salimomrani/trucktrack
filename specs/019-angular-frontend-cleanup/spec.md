# Feature Specification: Angular Frontend Performance & Quality Cleanup

**Feature Branch**: `019-angular-frontend-cleanup`
**Created**: 2025-12-30
**Status**: Draft
**Input**: Refactoring complet du frontend Angular avec optimisation des performances, correction des fuites mémoire, et standardisation des patterns de développement.

## Executive Summary

L'application TruckTrack présente des problèmes de performance et de stabilité sur le long terme dus à des fuites mémoire dans certains composants et à une stratégie de détection de changements non optimisée. Ce refactoring vise à améliorer l'expérience utilisateur en rendant l'application plus réactive et stable, notamment pour les sessions prolongées des dispatchers et fleet managers.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Application Stable pour Sessions Longues (Priority: P1)

En tant que **dispatcher** travaillant sur TruckTrack pendant 8+ heures consécutives, je veux que l'application reste fluide et réactive tout au long de ma journée de travail, sans ralentissement progressif ni besoin de rafraîchir la page.

**Why this priority**: Les dispatchers utilisent l'application en continu. Une dégradation progressive de performance impacte directement leur productivité et peut causer des erreurs dans la gestion de la flotte.

**Independent Test**: Ouvrir l'application, naviguer entre les différentes sections (carte, trips, camions) pendant 2 heures et mesurer la consommation mémoire - elle ne doit pas augmenter de plus de 20%.

**Acceptance Scenarios**:

1. **Given** un dispatcher connecté depuis 4 heures avec navigation active, **When** il accède à la liste des trips, **Then** l'affichage se fait en moins de 500ms (même temps qu'au démarrage)
2. **Given** un utilisateur qui navigue fréquemment entre carte et administration, **When** il effectue 50 changements de vue, **Then** la mémoire utilisée reste stable (variation < 20%)
3. **Given** l'application ouverte pendant 8 heures, **When** l'utilisateur interagit avec n'importe quelle fonctionnalité, **Then** il n'y a pas de freeze ou de ralentissement perceptible

---

### User Story 2 - Réactivité de l'Interface Administration (Priority: P2)

En tant que **fleet manager** gérant les utilisateurs et les camions, je veux que les listes et formulaires d'administration répondent instantanément à mes actions (filtres, tri, édition).

**Why this priority**: L'administration est utilisée quotidiennement mais moins intensivement que la carte. Une interface réactive améliore l'efficacité des tâches administratives.

**Independent Test**: Ouvrir la liste des utilisateurs avec 100+ entrées, appliquer des filtres et vérifier que chaque action répond en moins de 200ms.

**Acceptance Scenarios**:

1. **Given** une liste de 200 utilisateurs affichée, **When** le fleet manager applique un filtre par rôle, **Then** la liste se met à jour en moins de 200ms
2. **Given** le formulaire d'édition d'un camion ouvert, **When** l'utilisateur modifie un champ, **Then** la validation s'affiche instantanément sans délai perceptible
3. **Given** la page des trips avec rafraîchissement automatique, **When** l'utilisateur laisse la page ouverte 1 heure, **Then** le rafraîchissement continue de fonctionner sans accumulation de requêtes

---

### User Story 3 - Chargement Optimisé des Pages (Priority: P3)

En tant qu'**utilisateur mobile** ou sur connexion lente, je veux que chaque page charge uniquement les ressources nécessaires pour minimiser le temps d'attente initial.

**Why this priority**: Bien que le lazy loading soit déjà implémenté, la cohérence et l'optimisation des bundles peuvent encore être améliorées.

**Independent Test**: Mesurer la taille du bundle initial et des chunks lazy-loaded - le bundle initial ne doit pas dépasser 500KB gzippé.

**Acceptance Scenarios**:

1. **Given** un utilisateur accédant à l'application pour la première fois, **When** il charge la page de login, **Then** seuls les composants du login sont chargés (pas les modules admin)
2. **Given** un utilisateur sur la carte, **When** il navigue vers l'administration, **Then** le module admin se charge en moins de 1 seconde sur une connexion 4G

---

### Edge Cases

- Que se passe-t-il si l'utilisateur ouvre plusieurs onglets de l'application simultanément ?
- Comment l'application gère-t-elle une perte de connexion temporaire pendant une session longue ?
- Que se passe-t-il si l'utilisateur laisse l'application en arrière-plan pendant plusieurs heures puis revient ?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'application DOIT maintenir une consommation mémoire stable (< 20% de variation) après 4 heures d'utilisation continue
- **FR-002**: L'application DOIT libérer les ressources (connexions, listeners) lorsque l'utilisateur quitte une page
- **FR-003**: Les listes avec plus de 100 éléments DOIVENT rester fluides lors du défilement et du filtrage (60 FPS)
- **FR-004**: Les mises à jour automatiques (polling, temps réel) DOIVENT s'arrêter proprement quand l'utilisateur quitte la vue concernée
- **FR-005**: L'application DOIT charger uniquement les modules nécessaires pour la page actuelle
- **FR-006**: Les interactions utilisateur (clics, saisie) DOIVENT avoir un feedback visuel en moins de 100ms
- **FR-007**: Le temps de rendu après un changement de données DOIT être inférieur à 16ms (60 FPS) pour les listes visibles

### Composants Identifiés avec Problèmes

Les audits ont identifié les zones nécessitant une attention particulière :

| Zone | Problème Identifié | Impact Utilisateur |
|------|-------------------|-------------------|
| Liste des Trips | Rafraîchissement automatique non nettoyé | Accumulation de requêtes, ralentissement |
| Liste des Utilisateurs | Ressources non libérées à la sortie | Fuite mémoire progressive |
| Sélecteur de Localisation | Connexions map non fermées | Consommation mémoire |
| Formulaires Admin | Mise à jour UI non optimisée | Latence perceptible sur saisie |
| Liste des Camions | Ressources non libérées | Fuite mémoire |
| Liste des Groupes | Ressources non libérées | Fuite mémoire |
| Journal d'Audit | Ressources non libérées | Fuite mémoire |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La consommation mémoire de l'application reste stable (variation < 20%) après 4 heures d'utilisation avec navigation active entre les sections
- **SC-002**: Le temps de réponse pour afficher une liste filtrée (100+ éléments) est inférieur à 200ms
- **SC-003**: Aucun avertissement de performance (long task > 50ms) n'apparaît dans les outils de développement lors d'une utilisation normale
- **SC-004**: Le bundle JavaScript initial (gzippé) reste inférieur à 500KB
- **SC-005**: 100% des pages testées passent l'audit Lighthouse avec un score Performance > 80
- **SC-006**: Zéro fuite mémoire détectée via les outils de profilage après 1 heure de navigation intensive
- **SC-007**: Le temps de First Contentful Paint reste inférieur à 1.5 secondes sur une connexion 4G simulée

---

## Scope & Boundaries

### In Scope

- Correction des fuites mémoire dans les composants identifiés
- Optimisation de la stratégie de détection de changements
- Standardisation des patterns de gestion des abonnements
- Audit et documentation des bonnes pratiques pour les futurs développements

### Out of Scope

- Refonte visuelle ou UX des composants
- Ajout de nouvelles fonctionnalités
- Migration vers une nouvelle version majeure d'Angular
- Optimisation backend (API, base de données)

---

## Assumptions

- L'équipe de développement suivra les patterns établis pour les futurs composants
- Les tests de performance seront exécutés sur un environnement représentatif (données réalistes)
- Les navigateurs cibles sont les versions récentes de Chrome, Firefox, Safari et Edge
- La métrique de 4 heures de session est basée sur l'usage typique des dispatchers

---

## Dependencies

- Aucune dépendance externe nouvelle requise
- S'appuie sur les outils de développement existants (Chrome DevTools, Lighthouse)
- Documentation des conventions Angular existante dans `frontend/ANGULAR_CONVENTIONS.md`

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Régression fonctionnelle lors du refactoring | Medium | High | Tests unitaires et E2E avant/après chaque composant modifié |
| Temps de refactoring sous-estimé | Low | Medium | Prioriser les composants à plus fort impact (P1 d'abord) |
| Patterns non suivis par les futurs développeurs | Medium | Medium | Documentation claire + revue de code systématique |

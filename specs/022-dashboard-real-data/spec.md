# Feature Specification: Dashboard Real Data Integration

**Feature Branch**: `022-dashboard-real-data`
**Created**: 2026-01-13
**Status**: Draft
**Input**: Remplacer les données mock du dashboard par des données réelles provenant du backend.

## Overview

Le dashboard actuel affiche des données statiques/mock. Cette fonctionnalité connecte tous les widgets du dashboard aux sources de données réelles pour fournir aux gestionnaires de flotte une vue en temps réel de leurs opérations.

## Clarifications

### Session 2026-01-13

- Q: Comment gérer les erreurs par widget? → A: Chaque widget gère ses erreurs indépendamment (un échec n'affecte pas les autres widgets)
- Q: Source de la métrique "Driver Satisfaction"? → A: Afficher "Coming Soon" (pas de source de données existante)
- Q: Stratégie de cache frontend? → A: Pas de cache frontend, toujours fetch fresh sur load/refresh

## User Scenarios & Testing *(mandatory)*

### User Story 1 - KPIs en temps réel (Priority: P1)

En tant que gestionnaire de flotte, je veux voir les KPIs principaux (Total Trucks, Active trucks, Trips today, Alerts today) avec des données réelles pour avoir une vue d'ensemble instantanée de ma flotte.

**Why this priority**: Les KPIs sont la première chose que l'utilisateur voit sur le dashboard. Sans données réelles, le dashboard n'a aucune valeur opérationnelle.

**Independent Test**: Peut être testé en vérifiant que les chiffres affichés correspondent aux données réelles du système (compter les camions, les trips, les alertes).

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté avec 15 camions dans sa flotte, **When** il accède au dashboard, **Then** il voit "15" dans la carte "Total Trucks"
2. **Given** 5 camions actuellement en mouvement, **When** l'utilisateur consulte le dashboard, **Then** la carte "Active trucks" affiche "5"
3. **Given** 8 trips créés aujourd'hui, **When** l'utilisateur consulte le dashboard, **Then** la carte "Trips today" affiche "8"
4. **Given** 3 alertes non lues, **When** l'utilisateur consulte le dashboard, **Then** la carte "Alerts today" affiche "3"
5. **Given** un nouveau trip créé pendant que l'utilisateur est sur le dashboard, **When** les données sont rafraîchies, **Then** le compteur "Trips today" s'incrémente

---

### User Story 2 - Fleet Status Chart (Priority: P2)

En tant que gestionnaire de flotte, je veux voir la répartition de ma flotte par statut (Active, Idle, Offline) dans un graphique donut pour comprendre rapidement l'utilisation de mes véhicules.

**Why this priority**: Le graphique de statut donne une vue visuelle immédiate de l'état de la flotte, complétant les KPIs numériques.

**Independent Test**: Peut être testé en comparant les pourcentages affichés avec le décompte réel des camions par statut.

**Acceptance Scenarios**:

1. **Given** une flotte avec 10 camions actifs, 3 idle et 2 offline, **When** l'utilisateur consulte le Fleet Status, **Then** le donut affiche les proportions correctes (67% active, 20% idle, 13% offline)
2. **Given** aucun camion dans la flotte, **When** l'utilisateur consulte le Fleet Status, **Then** un état vide approprié est affiché
3. **Given** tous les camions sont actifs, **When** l'utilisateur consulte le Fleet Status, **Then** le donut affiche 100% Active

---

### User Story 3 - Recent Activity Feed (Priority: P3)

En tant que gestionnaire de flotte, je veux voir les dernières activités (Trip Started, Delivery Confirmed, Alert Triggered, etc.) pour suivre les événements récents sans naviguer vers d'autres pages.

**Why this priority**: L'activité récente donne du contexte aux chiffres des KPIs et permet une surveillance passive.

**Independent Test**: Peut être testé en déclenchant des actions (démarrer un trip, confirmer une livraison) et vérifiant leur apparition dans le feed.

**Acceptance Scenarios**:

1. **Given** un trip vient de démarrer, **When** l'utilisateur consulte le dashboard, **Then** l'événement "Trip Started" apparaît dans le feed avec le truck ID et l'heure
2. **Given** une livraison vient d'être confirmée, **When** l'utilisateur consulte le dashboard, **Then** l'événement "Delivery Confirmed" apparaît dans le feed
3. **Given** une alerte vient d'être déclenchée, **When** l'utilisateur consulte le dashboard, **Then** l'événement "Alert Triggered" apparaît avec le type d'alerte
4. **Given** plus de 10 activités récentes, **When** l'utilisateur consulte le dashboard, **Then** seules les 5 plus récentes sont affichées avec un lien "View All"

---

### User Story 4 - Performance Overview (Priority: P4)

En tant que gestionnaire de flotte, je veux voir les métriques de performance (Trip Completion Rate, On-Time Delivery, Fleet Utilization, Driver Satisfaction) pour évaluer l'efficacité de mes opérations.

**Why this priority**: Les métriques de performance sont importantes mais moins critiques que les données opérationnelles en temps réel.

**Independent Test**: Peut être testé en calculant manuellement les métriques à partir des données brutes et comparant avec l'affichage.

**Acceptance Scenarios**:

1. **Given** 90 trips complétés sur 100 trips totaux cette semaine, **When** l'utilisateur consulte Performance Overview, **Then** "Trip Completion Rate" affiche "90%"
2. **Given** 80 livraisons à l'heure sur 100 livraisons totales, **When** l'utilisateur consulte Performance Overview, **Then** "On-Time Delivery" affiche "80%"
3. **Given** les camions ont été utilisés 720 heures sur 1000 heures disponibles, **When** l'utilisateur consulte Performance Overview, **Then** "Fleet Utilization" affiche "72%"
4. **Given** aucun trip complété cette semaine, **When** l'utilisateur consulte Performance Overview, **Then** les métriques affichent "0%" ou "N/A" selon le contexte

---

### Edge Cases

- **Connexion perdue**: Afficher le dernier état connu avec un indicateur "Offline" et un bouton retry
- **Utilisateur sans camions**: Afficher un état vide avec message "Aucun camion assigné" et lien vers la gestion des groupes
- **Erreur partielle backend**: Chaque widget gère ses erreurs indépendamment - un widget en erreur affiche son propre message sans bloquer les autres
- **Données historiques insuffisantes**: Performance Overview affiche "N/A" ou "Pas assez de données" pour les métriques sans historique suffisant

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher le nombre total de camions appartenant aux groupes de l'utilisateur
- **FR-002**: Le système DOIT afficher le nombre de camions actuellement actifs (en mouvement)
- **FR-003**: Le système DOIT afficher le nombre de trips créés aujourd'hui
- **FR-004**: Le système DOIT afficher le nombre d'alertes non lues
- **FR-005**: Le système DOIT afficher un graphique donut montrant la répartition Active/Idle/Offline
- **FR-006**: Le système DOIT afficher les 5 dernières activités avec type, truck ID, et timestamp
- **FR-007**: Le système DOIT calculer et afficher le taux de complétion des trips (période: semaine courante)
- **FR-008**: Le système DOIT calculer et afficher le taux de livraison à l'heure (période: semaine courante)
- **FR-009**: Le système DOIT calculer et afficher le taux d'utilisation de la flotte (période: semaine courante)
- **FR-010**: Le système DOIT afficher un indicateur de chargement pendant la récupération des données
- **FR-011**: Le système DOIT afficher un message d'erreur approprié si les données ne peuvent pas être chargées
- **FR-012**: Le système DOIT permettre de rafraîchir manuellement les données via un bouton
- **FR-013**: Les données DOIVENT être filtrées selon les groupes de camions auxquels l'utilisateur a accès
- **FR-014**: Chaque widget DOIT gérer ses erreurs indépendamment (un échec n'affecte pas les autres widgets)
- **FR-015**: Le système DOIT charger les données fraîches à chaque accès (pas de cache frontend)
- **FR-016**: La métrique "Driver Satisfaction" DOIT afficher "Coming Soon" jusqu'à ce qu'une source de données soit disponible

### Key Entities

- **Dashboard KPIs**: Métriques agrégées (counts, pourcentages) calculées à partir des données trucks, trips, alerts
- **Fleet Status**: Agrégation des statuts des camions (ACTIVE, IDLE, OFFLINE) pour l'utilisateur courant
- **Activity Event**: Événement horodaté représentant une action (trip started, delivery confirmed, alert triggered, maintenance scheduled)
- **Performance Metrics**: Métriques calculées sur une période (completion rate, on-time delivery, utilization)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le dashboard charge et affiche toutes les données en moins de 3 secondes
- **SC-002**: Les KPIs reflètent les données réelles avec une précision de 100%
- **SC-003**: Le graphique Fleet Status est mis à jour automatiquement quand le statut d'un camion change
- **SC-004**: Les activités récentes apparaissent dans le feed dans les 30 secondes suivant leur occurrence
- **SC-005**: Les utilisateurs peuvent voir des données pertinentes à leur rôle (filtrage par groupe)
- **SC-006**: En cas d'erreur, l'utilisateur voit un message clair et peut réessayer
- **SC-007**: Le dashboard fonctionne correctement même avec 0 camions (état vide géré)

## Assumptions

- Les APIs backend pour trucks, trips, et alerts existent déjà et retournent les données nécessaires
- Le store NgRx contient déjà les données trucks chargées au démarrage de l'application
- L'utilisateur est authentifié et ses groupes de camions sont connus
- La métrique "Driver Satisfaction" affichera "Coming Soon" (pas de source de données existante pour le MVP)
- Le rafraîchissement automatique n'est pas requis pour le MVP (rafraîchissement manuel suffit)
- Pas de cache frontend - les données sont toujours chargées fraîches depuis le backend

## Out of Scope

- Rafraîchissement en temps réel via WebSocket (le rafraîchissement manuel est suffisant)
- Personnalisation des widgets du dashboard
- Export des données du dashboard
- Historique des métriques de performance (seule la période courante est affichée)

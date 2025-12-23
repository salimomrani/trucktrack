# Feature Specification: Fleet Analytics Dashboard

**Feature Branch**: `006-fleet-analytics`
**Created**: 2025-12-23
**Status**: Draft
**Input**: Rapports & Analytics - Dashboard avec KPIs de flotte (distance parcourue, temps de conduite, vitesse moyenne/max, alertes déclenchées, entrées/sorties geofence). Visualisation par camion, groupe, ou flotte entière. Filtres par période (jour, semaine, mois, personnalisé). Graphiques interactifs (line charts, bar charts, pie charts). Export des rapports en PDF et Excel. V1 focus sur dashboard et KPIs de base, sans rapports planifiés par email.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulter les KPIs de la flotte (Priority: P1)

En tant que gestionnaire de flotte, je veux voir un dashboard avec les indicateurs clés de performance de ma flotte pour avoir une vue d'ensemble rapide de l'activité.

**Why this priority**: C'est la fonctionnalité principale qui apporte une valeur immédiate - transformer les données GPS existantes en informations exploitables. Sans ce dashboard, les données collectées n'ont pas de visibilité business.

**Independent Test**: Peut être testé en se connectant au dashboard et en vérifiant que les KPIs s'affichent correctement avec les données de la période sélectionnée.

**Acceptance Scenarios**:

1. **Given** je suis connecté en tant que FLEET_MANAGER ou ADMIN, **When** j'accède au dashboard analytics, **Then** je vois les KPIs suivants : distance totale, temps de conduite, vitesse moyenne, nombre d'alertes, entrées/sorties geofence.

2. **Given** le dashboard est affiché, **When** je sélectionne une période (jour/semaine/mois), **Then** tous les KPIs se mettent à jour pour refléter cette période.

3. **Given** le dashboard est affiché, **When** aucune donnée n'existe pour la période sélectionnée, **Then** les KPIs affichent "0" ou "N/A" avec un message explicatif.

---

### User Story 2 - Filtrer par camion ou groupe (Priority: P1)

En tant que gestionnaire de flotte, je veux filtrer les statistiques par camion individuel, par groupe de camions, ou voir la flotte entière pour analyser les performances à différents niveaux.

**Why this priority**: Essentiel pour l'analyse - un gestionnaire doit pouvoir comparer les performances et identifier les camions ou groupes problématiques.

**Independent Test**: Peut être testé en sélectionnant différents filtres (un camion, un groupe, toute la flotte) et en vérifiant que les données changent.

**Acceptance Scenarios**:

1. **Given** le dashboard est affiché, **When** je sélectionne "Toute la flotte", **Then** les KPIs agrègent les données de tous les camions auxquels j'ai accès.

2. **Given** le dashboard est affiché, **When** je sélectionne un groupe spécifique, **Then** les KPIs ne montrent que les données des camions de ce groupe.

3. **Given** le dashboard est affiché, **When** je sélectionne un camion spécifique, **Then** les KPIs ne montrent que les données de ce camion.

4. **Given** je suis un utilisateur avec accès limité à certains groupes, **When** j'ouvre le filtre, **Then** je ne vois que les groupes et camions auxquels j'ai accès.

---

### User Story 3 - Visualiser les tendances avec des graphiques (Priority: P2)

En tant que gestionnaire de flotte, je veux voir des graphiques interactifs montrant l'évolution des métriques dans le temps pour identifier les tendances et anomalies.

**Why this priority**: Ajoute de la valeur analytique au-delà des simples chiffres, mais le dashboard avec KPIs (US1) est fonctionnel sans les graphiques.

**Independent Test**: Peut être testé en vérifiant que les graphiques s'affichent et répondent aux interactions (hover, zoom).

**Acceptance Scenarios**:

1. **Given** le dashboard est affiché, **When** je regarde la section graphiques, **Then** je vois un graphique linéaire de la distance parcourue par jour sur la période.

2. **Given** un graphique est affiché, **When** je survole un point de données, **Then** une infobulle affiche la valeur exacte et la date.

3. **Given** le dashboard est affiché, **When** je regarde la répartition des alertes, **Then** je vois un graphique en secteurs (pie chart) par type d'alerte.

4. **Given** le dashboard est affiché, **When** je regarde l'activité par camion, **Then** je vois un graphique en barres comparant les camions.

---

### User Story 4 - Exporter les rapports (Priority: P2)

En tant que gestionnaire de flotte, je veux exporter les données du dashboard en PDF ou Excel pour partager les rapports avec ma direction ou les archiver.

**Why this priority**: Fonctionnalité importante pour l'usage business mais le dashboard reste utile sans export.

**Independent Test**: Peut être testé en cliquant sur le bouton d'export et en vérifiant que le fichier généré contient les bonnes données.

**Acceptance Scenarios**:

1. **Given** le dashboard affiche des données, **When** je clique sur "Exporter PDF", **Then** un fichier PDF est téléchargé contenant les KPIs et graphiques visibles.

2. **Given** le dashboard affiche des données, **When** je clique sur "Exporter Excel", **Then** un fichier Excel est téléchargé avec les données brutes en colonnes.

3. **Given** j'ai appliqué des filtres (période, camion, groupe), **When** j'exporte, **Then** le fichier exporté reflète exactement les filtres appliqués.

4. **Given** le dashboard n'a pas de données pour la période, **When** j'essaie d'exporter, **Then** un message m'informe qu'il n'y a pas de données à exporter.

---

### User Story 5 - Période personnalisée (Priority: P3)

En tant que gestionnaire de flotte, je veux définir une période personnalisée (date de début et fin) pour analyser une plage de temps spécifique.

**Why this priority**: Les périodes prédéfinies (jour/semaine/mois) couvrent la majorité des besoins. La période personnalisée est un "nice to have".

**Independent Test**: Peut être testé en sélectionnant deux dates et en vérifiant que les données correspondent.

**Acceptance Scenarios**:

1. **Given** le filtre de période est ouvert, **When** je sélectionne "Personnalisé", **Then** un sélecteur de dates apparaît avec date de début et date de fin.

2. **Given** j'ai sélectionné une période personnalisée, **When** la date de fin est avant la date de début, **Then** un message d'erreur m'empêche de valider.

3. **Given** j'ai sélectionné une période personnalisée valide, **When** je valide, **Then** le dashboard se met à jour avec les données de cette période.

---

### Edge Cases

- **Aucune donnée GPS**: Si un camion n'a jamais transmis de position, ses métriques affichent "N/A" ou sont exclues des agrégations.
- **Période sans activité**: Si la période sélectionnée ne contient aucune donnée, afficher un message "Aucune donnée pour cette période" plutôt qu'un dashboard vide.
- **Grand volume de données**: Pour les périodes longues (ex: 1 an), les données doivent être agrégées par jour/semaine pour éviter les problèmes de performance.
- **Camion supprimé**: Les données historiques d'un camion supprimé restent visibles dans les rapports avec mention "(supprimé)".
- **Changement de groupe**: Si un camion change de groupe pendant la période, il apparaît dans les deux groupes pour leurs périodes respectives.
- **Fuseau horaire**: Les dates/heures sont affichées dans le fuseau horaire de l'utilisateur ou de l'entreprise.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher un dashboard avec les KPIs : distance totale (km), temps de conduite (heures), temps d'inactivité (heures), vitesse moyenne (km/h), vitesse maximale (km/h).
- **FR-002**: Le système DOIT afficher le nombre d'alertes déclenchées par type (vitesse, geofence, inactivité, etc.).
- **FR-003**: Le système DOIT afficher le nombre d'entrées et sorties de geofences.
- **FR-004**: Le système DOIT permettre de filtrer par période : aujourd'hui, 7 derniers jours, 30 derniers jours, période personnalisée.
- **FR-005**: Le système DOIT permettre de filtrer par : flotte entière, groupe de camions, camion individuel.
- **FR-006**: Le système DOIT respecter les permissions d'accès aux groupes de l'utilisateur connecté.
- **FR-007**: Le système DOIT afficher un graphique linéaire de l'évolution de la distance par jour.
- **FR-008**: Le système DOIT afficher un graphique en secteurs de la répartition des alertes par type.
- **FR-009**: Le système DOIT afficher un graphique en barres comparant les camions (top 10 par distance).
- **FR-010**: Le système DOIT permettre l'export du rapport en format PDF incluant KPIs et graphiques.
- **FR-011**: Le système DOIT permettre l'export des données en format Excel (colonnes : date, camion, distance, durée, vitesse, alertes).
- **FR-012**: Le système DOIT calculer la distance à partir des positions GPS consécutives.
- **FR-013**: Le système DOIT calculer le temps de conduite comme le temps où le camion est en statut ACTIVE.
- **FR-014**: Le système DOIT être accessible aux rôles ADMIN, FLEET_MANAGER, et DISPATCHER.
- **FR-015**: Le rôle VIEWER peut consulter le dashboard mais ne peut pas exporter.

### Key Entities

- **ReportPeriod**: Représente la période d'analyse (type: today/week/month/custom, startDate, endDate).
- **FleetKPI**: Agrégation des métriques pour une entité (truck/group/fleet) sur une période : totalDistance, drivingTime, idleTime, avgSpeed, maxSpeed, alertCount, geofenceEvents.
- **DailyMetrics**: Métriques agrégées par jour pour les graphiques : date, distance, drivingHours, alertCount.
- **AlertBreakdown**: Répartition des alertes par type : alertType, count, percentage.
- **TruckRanking**: Classement des camions par métrique : truckId, truckName, value, rank.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le dashboard s'affiche en moins de 3 secondes pour une période d'un mois avec 50 camions.
- **SC-002**: 100% des utilisateurs autorisés peuvent accéder au dashboard sans erreur.
- **SC-003**: Les KPIs affichés correspondent aux données brutes avec une marge d'erreur inférieure à 1%.
- **SC-004**: L'export PDF se génère en moins de 10 secondes pour un rapport mensuel.
- **SC-005**: L'export Excel contient toutes les données de la période sans perte.
- **SC-006**: Les graphiques sont interactifs et répondent au survol en moins de 100ms.
- **SC-007**: Le filtrage par camion/groupe met à jour le dashboard en moins de 2 secondes.
- **SC-008**: Les utilisateurs peuvent identifier les camions les plus/moins performants en moins de 30 secondes.

---

## Assumptions

- Les positions GPS sont déjà stockées dans la base de données avec horodatage.
- Le calcul de distance utilise la formule Haversine entre points GPS consécutifs.
- Le temps de conduite est déterminé par le statut du camion (ACTIVE = en conduite).
- Les alertes sont déjà enregistrées avec leur type dans la table notifications.
- Les événements geofence (entrée/sortie) sont déjà trackés.
- La rétention des données GPS permet l'analyse sur au moins 12 mois.
- Les exports sont générés côté client (pas de génération serveur avec envoi par email en V1).

---

## Out of Scope (V1)

- Rapports planifiés/automatiques envoyés par email
- Alertes basées sur les KPIs (ex: notification si distance < seuil)
- Comparaison entre périodes (ex: ce mois vs mois précédent)
- Prévisions/tendances futures (ML)
- Dashboard personnalisable (choix des widgets)
- Export en formats autres que PDF/Excel (CSV, JSON)

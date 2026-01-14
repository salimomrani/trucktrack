# Research: Dashboard Real Data Integration

**Feature**: 022-dashboard-real-data
**Date**: 2026-01-13

## Research Tasks Completed

### 1. Existing APIs Analysis

**Question**: Quelles APIs backend existent pour les données du dashboard?

**Findings**:
- `GET /admin/trucks` - Liste des camions avec statut (location-service)
- `GET /admin/trips` - Liste des trips avec filtres (location-service)
- `GET /admin/trips/stats` - Statistiques trips (count par status)
- `GET /alerts` - Liste des alertes avec unread count (notification-service)
- `GET /alerts/unread/count` - Compteur d'alertes non lues

**Decision**: Créer un nouvel endpoint agrégé `/admin/dashboard` pour éviter N+1 calls
**Rationale**: Un seul appel API au lieu de 4-5 améliore les performances et simplifie le frontend
**Alternatives considered**:
- Appels parallèles multiples (rejeté: plus complexe, plus de latence totale)
- GraphQL (rejeté: overkill pour ce use case, pas dans le stack actuel)

### 2. NgRx Store Pattern

**Question**: Comment structurer le store NgRx pour le dashboard?

**Findings**:
- Le projet utilise déjà NgRx avec StoreFacade pattern
- Stores existants: auth, trucks, cache, notifications
- Pattern établi: actions → effects → reducers → selectors → facade

**Decision**: Créer un store `dashboard/` dédié suivant le pattern existant
**Rationale**: Cohérence avec l'architecture existante, séparation claire des responsabilités
**Alternatives considered**:
- Étendre le store trucks (rejeté: mélange des responsabilités)
- Pas de store, service seul (rejeté: perte des avantages NgRx - caching, DevTools)

### 3. Activity Feed Data Source

**Question**: D'où proviennent les données de Recent Activity?

**Findings**:
- Trips ont des changements de statut (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
- Alerts sont créées lors d'événements (speed limit, geofence, etc.)
- Delivery proofs sont enregistrées à la complétion

**Decision**: Agréger depuis trips (status changes) + alerts (creation time) + delivery_proofs
**Rationale**: Toutes les sources existent, requête SQL avec UNION pour combiner
**Alternatives considered**:
- Event sourcing dédié (rejeté: complexité excessive pour MVP)
- Table activity_log séparée (rejeté: duplication de données)

### 4. Performance Metrics Calculation

**Question**: Comment calculer les métriques de performance?

**Findings**:
- Trip Completion Rate = completed / total trips (semaine courante)
- On-Time Delivery = trips with actual_end <= scheduled_end / completed trips
- Fleet Utilization = sum(trip durations) / (truck_count * available_hours)
- Driver Satisfaction = pas de source existante

**Decision**:
- Calculer côté backend via requêtes SQL agrégées
- Driver Satisfaction = "Coming Soon" (pas de data source)
**Rationale**: Calcul côté serveur plus efficace, évite transfert de données raw
**Alternatives considered**:
- Calcul côté frontend (rejeté: trop de données à transférer)
- Pré-calcul en batch (rejeté: données pas assez fraîches)

### 5. Error Handling Strategy

**Question**: Comment gérer les erreurs indépendantes par widget?

**Findings**:
- NgRx permet des états séparés par "slice"
- Chaque widget peut avoir son propre loading/error state

**Decision**: Structure de state avec loading/error par section
```typescript
interface DashboardState {
  kpis: { data: KpiData | null; loading: boolean; error: string | null };
  fleetStatus: { data: FleetStatus | null; loading: boolean; error: string | null };
  activity: { data: ActivityEvent[] | null; loading: boolean; error: string | null };
  performance: { data: PerformanceMetrics | null; loading: boolean; error: string | null };
}
```
**Rationale**: Isolation complète des erreurs, UX optimale
**Alternatives considered**:
- State global error (rejeté: un échec bloquerait tout le dashboard)
- Try/catch par widget sans state (rejeté: pas de retry facile)

## Summary

Toutes les questions de recherche ont été résolues. Aucun "NEEDS CLARIFICATION" restant.

| Topic | Decision |
|-------|----------|
| API Strategy | Endpoint agrégé `/admin/dashboard` |
| Store Pattern | NgRx store dédié `dashboard/` |
| Activity Source | SQL UNION trips + alerts + proofs |
| Performance Calc | Backend SQL aggregation |
| Error Handling | State séparé par widget section |

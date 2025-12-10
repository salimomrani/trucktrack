# Truck Track - GPS Live Tracking System

Real-time GPS tracking application for fleet management with live map visualization, historical route analysis, and alert notifications.

## 🚀 Quick Start (Une seule commande!)

### Démarrage rapide

```bash
# Démarrer TOUS les services en une seule commande
./start-all.sh
```

Attendez 30-60 secondes que tous les services démarrent, puis accédez à:
- **Frontend**: http://localhost:4200
- **API Gateway**: http://localhost:8000

**Identifiants par défaut:**
- Email: `admin@trucktrack.com`
- Password: `AdminPass123!`

### Arrêter tous les services

```bash
./stop-all.sh
```

### Voir le statut des services

```bash
./status.sh
```

### Redémarrer tous les services

```bash
./restart-all.sh
```

## 📋 Scripts de Gestion

| Script | Description | Usage |
|--------|-------------|-------|
| `./start-all.sh` | Démarre tous les services | `./start-all.sh [--build] [--logs]` |
| `./stop-all.sh` | Arrête tous les services | `./stop-all.sh` |
| `./status.sh` | Affiche le statut des services | `./status.sh` |
| `./restart-all.sh` | Redémarre tous les services | `./restart-all.sh [--build]` |

### Options disponibles

- `--build` : Recompile les services backend avant de démarrer
- `--logs` : Affiche les logs en temps réel (bloque le terminal)

### Exemples

```bash
# Démarrer avec recompilation
./start-all.sh --build

# Démarrer et afficher les logs
./start-all.sh --logs

# Redémarrer avec recompilation
./restart-all.sh --build
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Angular)                │
│                  http://localhost:4200              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway :8000                  │
└──────┬──────────────────────────────────────┬───────┘
       │                                      │
   ┌───▼───────┐  ┌───────────┐  ┌──────────▼──┐
   │   Auth    │  │ Location  │  │     GPS     │
   │  Service  │  │  Service  │  │  Ingestion  │
   │   :8083   │  │   :8081   │  │   :8080     │
   └───────────┘  └─────┬─────┘  └──────┬──────┘
                        │                │
                        │   ┌────────┐   │
                        └───►  Kafka ◄───┘
                            │ :9092  │
                            └────┬───┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐    ┌──────────▼──────┐
            │  Notification  │    │   PostgreSQL    │
            │    Service     │    │   + PostGIS     │
            │     :8082      │    │     :5432       │
            └────────────────┘    └─────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │    Redis    │
                                    │    :6379    │
                                    └─────────────┘
```

## 🛠️ Services

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **Frontend** | 4200 | Angular 17 UI | ✅ Phase 2 |
| **API Gateway** | 8000 | Entry point, routing | ✅ Phase 2 |
| **Auth Service** | 8083 | JWT authentication | ✅ Phase 2 |
| **GPS Ingestion** | 8080 | GPS data ingestion | ✅ Phase 2 |
| **Location Service** | 8081 | Truck positions, WebSocket | ✅ Phase 2 |
| **Notification Service** | 8082 | Alerts & notifications | ✅ Phase 2 |
| **PostgreSQL** | 5432 | Database + PostGIS | ✅ Phase 2 |
| **Kafka** | 9092 | Event streaming | ✅ Phase 2 |
| **Redis** | 6379 | Caching | ✅ Phase 2 |

## 📁 Structure du Projet

```
truck_track/
├── start-all.sh          # 🚀 Démarrer tous les services
├── stop-all.sh           # 🛑 Arrêter tous les services
├── status.sh             # 📊 Statut des services
├── restart-all.sh        # 🔄 Redémarrer tous les services
├── backend/              # Services Java Spring Boot
│   ├── api-gateway/
│   ├── auth-service/
│   ├── gps-ingestion-service/
│   ├── location-service/
│   ├── notification-service/
│   └── shared/
├── frontend/             # Application Angular 17
│   └── src/
│       ├── app/
│       │   ├── core/    # Services, guards, interceptors
│       │   └── features/ # Login, map, history, alerts
│       └── environments/
├── infra/
│   └── docker/          # Docker Compose (Kafka, PostgreSQL, Redis)
├── logs/                # Logs des services (créé automatiquement)
└── specs/
    └── 001-gps-live-tracking/
        ├── tasks.md     # Liste des tâches
        ├── plan.md      # Plan technique
        └── data-model.md # Modèle de données
```

## 📝 Logs

Les logs de tous les services sont stockés dans le répertoire `logs/`:

```bash
# Voir tous les logs
tail -f logs/*.log

# Voir un service spécifique
tail -f logs/gps-ingestion.log
tail -f logs/location.log
tail -f logs/frontend.log
tail -f logs/api-gateway.log
```

## 🔧 Développement Manuel

Si vous préférez démarrer les services manuellement:

### 1. Infrastructure Docker

```bash
cd infra/docker
docker-compose up -d
```

### 2. Migrations de base de données

```bash
cd backend
mvn flyway:migrate -P local
```

### 3. Services Backend (5 terminaux)

```bash
# Terminal 1: GPS Ingestion
cd backend/gps-ingestion-service && mvn spring-boot:run

# Terminal 2: Location Service
cd backend/location-service && mvn spring-boot:run

# Terminal 3: Notification Service
cd backend/notification-service && mvn spring-boot:run

# Terminal 4: Auth Service
cd backend/auth-service && mvn spring-boot:run

# Terminal 5: API Gateway
cd backend/api-gateway && mvn spring-boot:run
```

### 4. Frontend

```bash
cd frontend
npm install
npm start
```

## 🧪 Tests

```bash
# Tests backend
cd backend
mvn test                    # Tests unitaires
mvn verify                  # Tests d'intégration

# Tests frontend
cd frontend
npm test                    # Tests unitaires
npm run e2e                 # Tests E2E
```

## 🎯 État d'Implémentation

### ✅ Phase 1: Setup (COMPLETE)
- Maven multi-module
- 5 microservices
- Docker Compose
- CI/CD pipeline

### ✅ Phase 2: Infrastructure Fondamentale (COMPLETE)
- Base de données PostgreSQL + PostGIS
- Migrations Flyway (8 tables)
- Configuration Kafka (3 topics)
- Configuration Redis
- Authentification JWT
- API Gateway
- Angular Material
- Service d'authentification frontend
- Formulaire de connexion

### 🔄 Phase 3: User Story 1 - PROCHAINE ÉTAPE
- Ingestion GPS en temps réel
- Service de localisation
- WebSocket pour les mises à jour live
- Carte Leaflet avec marqueurs
- Mise à jour des marqueurs en temps réel

**Progression globale: 47/197 tâches (24%)**

## 🚀 Prochaines Étapes

1. Implémenter l'ingestion GPS (T048-T065)
2. Créer le service de localisation (T066-T074)
3. Développer le composant de carte (T075-T092)
4. Ajouter les fonctionnalités d'accessibilité (T093-T095)

## 📚 Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Quickstart Guide](specs/001-gps-live-tracking/quickstart.md)
- [Tasks List](specs/001-gps-live-tracking/tasks.md)
- [Technical Plan](specs/001-gps-live-tracking/plan.md)
- [Data Model](specs/001-gps-live-tracking/data-model.md)

## 🐛 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier le statut
./status.sh

# Voir les logs
tail -f logs/*.log

# Arrêter et redémarrer
./stop-all.sh
./start-all.sh --build
```

### Port déjà utilisé

```bash
# Trouver le processus qui utilise le port
lsof -i :8080

# Tuer le processus
kill -9 <PID>
```

### Docker ne démarre pas

```bash
# Redémarrer Docker
docker-compose down
docker-compose up -d
```

## 🤝 Contribution

1. Créer une branche: `git checkout -b feature/ma-fonctionnalite`
2. Committer: `git commit -m "feat: ma fonctionnalité"`
3. Pousser: `git push origin feature/ma-fonctionnalite`
4. Créer une Pull Request

## 📄 License

Proprietary - Truck Track System

---

**Développé avec [Claude Code](https://claude.com/claude-code)**

# TruckTrack - Documentation Technique Complète

> Guide complet pour comprendre l'architecture et le fonctionnement de l'application de suivi GPS de camions en temps réel.

---

## Table des Matières

1. [Introduction - C'est quoi TruckTrack ?](#1-introduction---cest-quoi-trucktrack-)
2. [Architecture Globale](#2-architecture-globale)
3. [Les Technologies Utilisées](#3-les-technologies-utilisées)
4. [Infrastructure Docker](#4-infrastructure-docker)
5. [Les Microservices Backend](#5-les-microservices-backend)
6. [La Communication entre Services](#6-la-communication-entre-services)
7. [La Base de Données](#7-la-base-de-données)
8. [Le Frontend Angular](#8-le-frontend-angular)
9. [Flux de Données Complets](#9-flux-de-données-complets)
10. [Comment Lancer le Projet](#10-comment-lancer-le-projet)
11. [API Reference](#11-api-reference)
12. [Glossaire](#12-glossaire)

---

## 1. Introduction - C'est quoi TruckTrack ?

### 1.1 Le Problème à Résoudre

Imagine une entreprise de transport avec **50 camions** qui roulent partout en France. Le gestionnaire de flotte veut :
- Savoir **où sont ses camions** en temps réel
- Voir l'**historique des trajets**
- Recevoir des **alertes** si un camion dépasse la vitesse ou sort d'une zone autorisée
- Avoir une **carte interactive** pour visualiser tout ça

### 1.2 La Solution TruckTrack

TruckTrack est une application web qui :
1. **Reçoit** les positions GPS des camions (latitude, longitude, vitesse)
2. **Stocke** ces données dans une base de données
3. **Affiche** les camions sur une carte en temps réel
4. **Envoie** des alertes quand quelque chose d'anormal se produit

### 1.3 Les Fonctionnalités (User Stories)

| # | Fonctionnalité | Description |
|---|----------------|-------------|
| US1 | Carte en temps réel | Voir tous les camions sur une carte avec leur position actuelle |
| US2 | Recherche et filtres | Chercher un camion, filtrer par statut (actif, en pause, hors ligne) |
| US3 | Historique | Voir le trajet d'un camion sur les dernières 24h |
| US4 | Alertes | Recevoir des notifications (excès de vitesse, camion hors zone, etc.) |

---

## 2. Architecture Globale

### 2.1 Vue d'ensemble

L'application est construite en **architecture microservices**. Au lieu d'avoir UN gros programme qui fait tout, on a **plusieurs petits programmes** qui font chacun une tâche spécifique.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         👤 UTILISATEUR (Navigateur Web)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP (port 4200)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    🖥️  FRONTEND ANGULAR (Interface Web)                     │
│                         http://localhost:4200                               │
│                                                                             │
│   - Affiche la carte avec les camions                                       │
│   - Gère la connexion utilisateur                                           │
│   - Affiche l'historique et les alertes                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP (port 8000)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    🚪 API GATEWAY (Porte d'Entrée Unique)                   │
│                         http://localhost:8000                               │
│                                                                             │
│   - Reçoit TOUTES les requêtes du frontend                                  │
│   - Vérifie si l'utilisateur est connecté (JWT)                             │
│   - Redirige vers le bon service                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Routing interne
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   🔐 AUTH   │ │   📡 GPS    │ │   📍 LOC    │ │   🔔 NOTIF  │ │   📊 DATA   │
│   SERVICE   │ │  INGESTION  │ │   SERVICE   │ │   SERVICE   │ │  (Redis)    │
│   :8083     │ │   :8080     │ │   :8081     │ │   :8082     │ │   :6379     │
│             │ │             │ │             │ │             │ │             │
│ - Login     │ │ - Reçoit    │ │ - Stocke    │ │ - Alertes   │ │ - Cache     │
│ - Register  │ │   positions │ │   trucks    │ │ - Notifs    │ │   rapide    │
│ - JWT       │ │ - Publie    │ │ - WebSocket │ │ - Règles    │ │             │
│             │ │   Kafka     │ │ - Historique│ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                      │               │               │
                      │               │               │
                      ▼               ▼               ▼
              ┌─────────────────────────────────────────────┐
              │                                             │
              │              📨 APACHE KAFKA                │
              │              (Message Broker)               │
              │                  :9092                      │
              │                                             │
              │  - File d'attente de messages               │
              │  - Permet aux services de communiquer       │
              │  - Stocke temporairement les événements     │
              │                                             │
              └─────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │                                             │
              │           🗄️  POSTGRESQL + POSTGIS          │
              │              (Base de Données)              │
              │                  :5432                      │
              │                                             │
              │  - Stocke les camions, utilisateurs         │
              │  - Stocke l'historique des positions        │
              │  - PostGIS pour les données géographiques   │
              │                                             │
              └─────────────────────────────────────────────┘
```

### 2.2 Pourquoi des Microservices ?

| Avantage | Explication |
|----------|-------------|
| **Indépendance** | Chaque service peut être développé séparément |
| **Scalabilité** | Si on a beaucoup de positions GPS, on peut ajouter des serveurs GPS-Ingestion |
| **Résilience** | Si le service notifications plante, la carte continue de fonctionner |
| **Technologies** | Chaque service peut utiliser la technologie la plus adaptée |

### 2.3 Les Ports Utilisés

| Port | Service | Description |
|------|---------|-------------|
| 4200 | Frontend Angular | Interface utilisateur |
| 8000 | API Gateway | Point d'entrée des APIs |
| 8080 | GPS Ingestion Service | Réception des positions GPS |
| 8081 | Location Service | Données des camions + WebSocket |
| 8082 | Notification Service | Alertes et notifications |
| 8083 | Auth Service | Authentification |
| 9092 | Kafka | Message broker |
| 5432 | PostgreSQL | Base de données |
| 6379 | Redis | Cache |
| 8088 | Kafka UI | Interface admin Kafka |

---

## 3. Les Technologies Utilisées

### 3.1 Backend (Serveur)

#### Java 17
- **C'est quoi ?** Un langage de programmation
- **Pourquoi ?** Robuste, performant, très utilisé en entreprise
- **Où ?** Tous les microservices

#### Spring Boot 3.2
- **C'est quoi ?** Un framework Java qui simplifie la création d'applications
- **Pourquoi ?** Permet de créer rapidement des APIs REST, gère automatiquement beaucoup de choses
- **Où ?** Tous les microservices

```java
// Exemple : Un controller REST avec Spring Boot
@RestController
@RequestMapping("/location/v1")
public class TruckController {

    @GetMapping("/trucks")
    public List<Truck> getAllTrucks() {
        return truckService.findAll();
    }
}
```

#### Spring Cloud Gateway
- **C'est quoi ?** Un composant Spring pour créer une API Gateway
- **Pourquoi ?** Gère le routage, l'authentification, CORS
- **Où ?** api-gateway

#### Apache Kafka
- **C'est quoi ?** Un système de messagerie distribué (message broker)
- **Pourquoi ?** Permet aux services de communiquer de façon asynchrone
- **Où ?** Entre gps-ingestion, location-service et notification-service

```
Exemple de flux Kafka :
GPS Device envoie position → gps-ingestion-service → KAFKA → location-service
                                                          → notification-service
```

#### PostgreSQL + PostGIS
- **C'est quoi ?** Base de données relationnelle avec extension géographique
- **Pourquoi ?** Stockage fiable + requêtes géographiques (distance, zones)
- **Où ?** Stockage des trucks, positions, users

#### Redis
- **C'est quoi ?** Base de données en mémoire (très rapide)
- **Pourquoi ?** Cache les positions actuelles des camions
- **Où ?** location-service pour les requêtes fréquentes

### 3.2 Frontend (Client)

#### Angular 17
- **C'est quoi ?** Framework JavaScript/TypeScript pour créer des interfaces web
- **Pourquoi ?** Structure claire, composants réutilisables, très utilisé en entreprise
- **Où ?** Toute l'interface utilisateur

```typescript
// Exemple : Un composant Angular
@Component({
  selector: 'app-map',
  template: '<div id="map"></div>'
})
export class MapComponent {
  // Code du composant
}
```

#### NgRx
- **C'est quoi ?** Bibliothèque de gestion d'état (State Management)
- **Pourquoi ?** Gère les données de façon prévisible dans toute l'application
- **Où ?** Gestion des trucks, de l'authentification, de l'historique

```
NgRx Pattern :
Component → dispatch(Action) → Reducer → State → Selector → Component
```

#### Leaflet
- **C'est quoi ?** Bibliothèque JavaScript pour les cartes interactives
- **Pourquoi ?** Gratuit, léger, facile à utiliser
- **Où ?** MapComponent (affichage des camions)

#### Angular Material
- **C'est quoi ?** Composants UI prêts à l'emploi (boutons, tables, etc.)
- **Pourquoi ?** Design moderne, cohérent, accessible
- **Où ?** Tous les composants UI

### 3.3 Infrastructure

#### Docker & Docker Compose
- **C'est quoi ?** Outil pour créer des conteneurs (environnements isolés)
- **Pourquoi ?** Permet de lancer Kafka, PostgreSQL, Redis facilement
- **Où ?** `infra/docker/docker-compose.yml`

---

## 4. Infrastructure Docker

### 4.1 C'est quoi Docker ?

Imagine que tu veux installer PostgreSQL, Kafka et Redis sur ton ordinateur. Normalement, il faudrait :
1. Télécharger chaque logiciel
2. Les configurer un par un
3. S'assurer qu'ils fonctionnent ensemble

Avec Docker, on écrit un fichier `docker-compose.yml` et tout se lance en **une seule commande** !

### 4.2 Le fichier docker-compose.yml

```yaml
services:
  # Kafka - Message Broker
  kafka:
    image: confluentinc/cp-kafka:7.5.3   # Image Docker officielle
    ports:
      - "9092:9092"                       # Port accessible
    environment:
      KAFKA_NODE_ID: 1                    # Configuration Kafka
      # ... autres configs

  # PostgreSQL - Base de données
  postgres:
    image: postgis/postgis:15-3.4        # PostgreSQL + PostGIS
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: trucktrack
      POSTGRES_USER: trucktrack
      POSTGRES_PASSWORD: changeme

  # Redis - Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 4.3 Les Topics Kafka

Kafka utilise des **topics** (comme des files d'attente) pour organiser les messages :

| Topic | Partitions | Rétention | Usage |
|-------|------------|-----------|-------|
| `truck-track.gps.position` | 10 | 7 jours | Positions GPS des camions |
| `truck-track.location.status-change` | 5 | 30 jours | Changements de statut (actif → idle) |
| `truck-track.notification.alert` | 3 | 90 jours | Alertes déclenchées |

### 4.4 Commandes Docker Utiles

```bash
# Démarrer l'infrastructure
docker-compose up -d

# Voir les logs
docker-compose logs -f kafka

# Arrêter tout
docker-compose down

# Supprimer les données
docker-compose down -v
```

---

## 5. Les Microservices Backend

### 5.1 Structure d'un Microservice

Chaque service suit la même structure :

```
service-name/
├── pom.xml                              # Dépendances Maven
└── src/main/
    ├── java/com/trucktrack/servicename/
    │   ├── ServiceNameApplication.java  # Point d'entrée
    │   ├── controller/                  # APIs REST
    │   ├── service/                     # Logique métier
    │   ├── repository/                  # Accès base de données
    │   ├── model/                       # Entités JPA
    │   └── config/                      # Configuration
    └── resources/
        └── application.yml              # Configuration
```

### 5.2 Auth Service (Port 8083)

**Rôle** : Gérer l'authentification des utilisateurs

**Endpoints** :
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/auth/login` | Connexion utilisateur |
| POST | `/auth/register` | Inscription |
| POST | `/auth/refresh` | Renouveler le token |

**Comment ça marche** :
1. L'utilisateur envoie email + mot de passe
2. Le service vérifie dans la base de données
3. Si OK, génère un **JWT** (JSON Web Token)
4. Le frontend stocke ce token et l'envoie à chaque requête

```java
// Exemple simplifié
@PostMapping("/login")
public AuthResponse login(@RequestBody LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail());
    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }
    throw new UnauthorizedException("Invalid credentials");
}
```

### 5.3 GPS Ingestion Service (Port 8080)

**Rôle** : Recevoir les positions GPS et les publier sur Kafka

**Endpoints** :
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/gps/v1/positions` | Recevoir une position GPS |
| POST | `/gps/v1/positions/batch` | Recevoir plusieurs positions |

**Comment ça marche** :
1. Un appareil GPS (ou simulateur) envoie une position
2. Le service valide les données
3. Publie sur le topic Kafka `truck-track.gps.position`
4. Les autres services consomment ce message

```java
@PostMapping("/positions")
public ResponseEntity<Void> receivePosition(@RequestBody GPSPositionRequest request) {
    // Valider les données
    validate(request);

    // Créer l'événement Kafka
    GPSPositionEvent event = new GPSPositionEvent(
        request.getTruckId(),
        request.getLatitude(),
        request.getLongitude(),
        request.getSpeed(),
        Instant.now()
    );

    // Publier sur Kafka
    kafkaTemplate.send("truck-track.gps.position", request.getTruckId(), event);

    return ResponseEntity.ok().build();
}
```

### 5.4 Location Service (Port 8081)

**Rôle** : Stocker et servir les données des camions

**Endpoints** :
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/location/v1/trucks` | Liste tous les camions |
| GET | `/location/v1/trucks/{id}` | Détails d'un camion |
| GET | `/location/v1/trucks/history` | Historique des positions |
| WS | `/ws` | WebSocket temps réel |

**Comment ça marche** :
1. **Consomme Kafka** : Écoute les nouvelles positions GPS
2. **Stocke en DB** : Sauvegarde dans PostgreSQL
3. **Cache Redis** : Garde la position actuelle en cache
4. **WebSocket** : Envoie les mises à jour au frontend en temps réel

```java
// Consumer Kafka
@KafkaListener(topics = "truck-track.gps.position")
public void handleGPSPosition(GPSPositionEvent event) {
    // 1. Sauvegarder en base de données
    GPSPosition position = new GPSPosition(event);
    positionRepository.save(position);

    // 2. Mettre à jour le cache Redis
    redisTemplate.opsForValue().set(
        "truck:" + event.getTruckId() + ":position",
        position
    );

    // 3. Envoyer via WebSocket
    webSocketHandler.broadcast(event);
}
```

### 5.5 Notification Service (Port 8082)

**Rôle** : Gérer les alertes et notifications

**Endpoints** :
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/notification/v1/notifications` | Liste des notifications |
| GET | `/notification/v1/alert-rules` | Liste des règles d'alerte |
| POST | `/notification/v1/alert-rules` | Créer une règle |
| PATCH | `/notification/v1/notifications/{id}/read` | Marquer comme lu |

**Comment ça marche** :
1. **Consomme Kafka** : Écoute les positions GPS
2. **Évalue les règles** : Vérifie si une alerte doit être déclenchée
3. **Crée notifications** : Sauvegarde en base et notifie l'utilisateur

```java
// Évaluation d'une règle de vitesse
public void evaluateSpeedRules(GPSPositionEvent event) {
    List<AlertRule> rules = alertRuleRepository.findEnabledSpeedRules();

    for (AlertRule rule : rules) {
        if (event.getSpeed() > rule.getThresholdValue()) {
            // Vitesse dépassée ! Créer une alerte
            Notification notification = new Notification();
            notification.setTitle("Speed Limit Exceeded");
            notification.setMessage("Truck " + event.getTruckId() +
                " is going " + event.getSpeed() + " km/h");
            notification.setSeverity(CRITICAL);

            notificationRepository.save(notification);
        }
    }
}
```

### 5.6 API Gateway (Port 8000)

**Rôle** : Point d'entrée unique pour toutes les requêtes

**Fonctionnalités** :
- **Routage** : Redirige vers le bon service
- **Authentification** : Vérifie le JWT
- **CORS** : Autorise le frontend à appeler l'API
- **Rate Limiting** : Limite le nombre de requêtes (protection)

```yaml
# Configuration du routage
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: http://localhost:8083
          predicates:
            - Path=/auth/**
          # Pas de filtre JWT - routes publiques

        - id: location-service
          uri: http://localhost:8081
          predicates:
            - Path=/location/**
          filters:
            - name: JwtAuthenticationFilter  # Vérifie le JWT
```

**Propagation de l'Identité Utilisateur** :

Quand la Gateway valide un JWT, elle extrait les informations utilisateur et les transmet aux services downstream via des headers HTTP :

```
┌────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    Frontend    │──────▶│   API Gateway    │──────▶│ Location Service │
│                │       │                  │       │                  │
│ Authorization: │       │ 1. Valide JWT    │       │ Reçoit headers:  │
│ Bearer <jwt>   │       │ 2. Extrait claims│       │ - X-User-Id      │
│                │       │ 3. Ajoute headers│       │ - X-Username     │
│                │       │                  │       │ - X-User-Role    │
└────────────────┘       └──────────────────┘       └──────────────────┘
```

| Header | Description | Exemple |
|--------|-------------|---------|
| `X-User-Id` | UUID de l'utilisateur | `e91579f-c63e-46d0-b616-9407eba2c3a8` |
| `X-Username` | Email/username | `admin@trucktrack.com` |
| `X-User-Role` | Rôle de l'utilisateur | `FLEET_MANAGER`, `DISPATCHER`, `DRIVER` |

Cela permet aux microservices de :
- **Logger** qui accède aux données (audit trail)
- **Filtrer** les données selon le rôle (ex: un DRIVER ne voit que son camion)
- **Autoriser** ou refuser certaines actions

---

## 6. La Communication entre Services

### 6.1 Communication Synchrone (HTTP)

Le frontend appelle directement les APIs :

```
Frontend → HTTP GET /location/v1/trucks → API Gateway → Location Service → Response
```

**Avantages** : Simple, réponse immédiate
**Inconvénients** : Si le service est lent, tout attend

### 6.2 Communication Asynchrone (Kafka)

Les services communiquent via des messages :

```
GPS Ingestion → Kafka Topic → Location Service
                           → Notification Service
```

**Avantages** :
- Services découplés
- Si un service est lent, les messages attendent
- Un message peut être consommé par plusieurs services

### 6.3 Exemple Concret

Quand un camion envoie sa position :

```
1. GPS Device envoie POST /gps/v1/positions
   {
     "truckId": "TRUCK-001",
     "latitude": 48.8566,
     "longitude": 2.3522,
     "speed": 85.5
   }

2. GPS Ingestion publie sur Kafka :
   Topic: truck-track.gps.position
   Key: "TRUCK-001"
   Value: { truckId, lat, lng, speed, timestamp }

3. Location Service consomme le message :
   - Sauvegarde en PostgreSQL
   - Met à jour Redis
   - Broadcast WebSocket

4. Notification Service consomme le message :
   - Vérifie les règles d'alerte
   - Crée une notification si nécessaire

5. Frontend reçoit via WebSocket :
   - Met à jour le marker sur la carte
```

### 6.4 WebSocket (Temps Réel)

Pour les mises à jour en temps réel, on utilise WebSocket :

```
Frontend ←──── WebSocket ────→ Location Service
         (connexion persistante)
```

Le frontend établit UNE connexion qui reste ouverte. Le serveur peut envoyer des messages à tout moment.

```typescript
// Frontend - Connexion WebSocket
const socket = new WebSocket('ws://localhost:8081/ws');

socket.onmessage = (event) => {
    const position = JSON.parse(event.data);
    // Mettre à jour le marker sur la carte
    updateMarker(position.truckId, position.latitude, position.longitude);
};
```

---

## 7. La Base de Données

### 7.1 Schéma de la Base

```sql
-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashé avec BCrypt
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50),  -- FLEET_MANAGER, DRIVER, ADMIN
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des camions
CREATE TABLE trucks (
    id UUID PRIMARY KEY,
    truck_id VARCHAR(50) UNIQUE NOT NULL,  -- Ex: "TRUCK-001"
    license_plate VARCHAR(20),
    driver_name VARCHAR(100),
    status VARCHAR(20),  -- ACTIVE, IDLE, OFFLINE
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_speed DECIMAL(5, 2),
    last_update TIMESTAMP
);

-- Table des positions GPS (historique)
-- Partitionnée par mois pour les performances
CREATE TABLE gps_positions (
    id UUID,
    truck_id UUID REFERENCES trucks(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    timestamp TIMESTAMP NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Table des règles d'alerte
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50),  -- SPEED_LIMIT, OFFLINE, GEOFENCE_EXIT
    threshold_value INTEGER,  -- Ex: 120 pour vitesse max
    is_enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id)
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    truck_id UUID REFERENCES trucks(id),
    title VARCHAR(200),
    message TEXT,
    severity VARCHAR(20),  -- INFO, WARNING, CRITICAL
    is_read BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 PostGIS - Extension Géographique

PostGIS permet de faire des requêtes géographiques :

```sql
-- Trouver les camions dans un rayon de 10km autour de Paris
SELECT * FROM trucks
WHERE ST_DWithin(
    ST_MakePoint(current_longitude, current_latitude)::geography,
    ST_MakePoint(2.3522, 48.8566)::geography,  -- Paris
    10000  -- 10km en mètres
);

-- Vérifier si un camion est dans une zone (geofence)
SELECT ST_Contains(
    geofence.polygon,
    ST_MakePoint(truck.current_longitude, truck.current_latitude)
) FROM geofences geofence, trucks truck
WHERE truck.id = 'xxx';
```

### 7.3 Flyway - Migrations

Flyway gère les versions de la base de données :

```
backend/location-service/src/main/resources/db/migration/
├── V1__create_schema.sql      # Création initiale
├── V2__seed_data.sql          # Données de test
└── V3__add_indexes.sql        # Optimisations
```

À chaque démarrage, Flyway vérifie et applique les migrations manquantes.

---

## 8. Le Frontend Angular

### 8.1 Structure du Projet

```
frontend/src/app/
├── core/                          # Services et composants partagés
│   ├── components/
│   │   ├── header/               # Barre de navigation
│   │   └── search-bar/           # Barre de recherche
│   ├── guards/
│   │   └── auth.guard.ts         # Protection des routes
│   ├── interceptors/
│   │   └── auth.interceptor.ts   # Ajoute le JWT aux requêtes
│   └── services/
│       ├── auth.service.ts       # Authentification
│       └── websocket.service.ts  # Connexion WebSocket
│
├── features/                      # Composants par fonctionnalité
│   ├── map/                      # Carte temps réel
│   │   ├── map.component.ts
│   │   ├── map.component.html
│   │   └── filter-panel/         # Filtres de la carte
│   ├── history/                  # Historique des trajets
│   ├── alerts/                   # Gestion des alertes
│   └── auth/
│       └── login/                # Page de connexion
│
├── models/                        # Interfaces TypeScript
│   ├── truck.model.ts
│   ├── gps-position.model.ts
│   ├── notification.model.ts
│   └── alert-rule.model.ts
│
├── services/                      # Services HTTP
│   ├── truck.service.ts
│   ├── notification.service.ts
│   └── alert-rule.service.ts
│
└── store/                         # NgRx State Management
    ├── auth/                     # État authentification
    ├── gps/                      # État positions GPS
    └── history/                  # État historique
```

### 8.2 NgRx - Gestion d'État

NgRx suit le pattern Redux pour gérer les données :

```
┌─────────┐     dispatch      ┌─────────┐
│Component│ ───────────────→  │ Action  │
└─────────┘                   └────┬────┘
     ▲                             │
     │                             ▼
     │ select              ┌─────────────┐
     │                     │   Reducer   │
     │                     └──────┬──────┘
     │                            │
┌────┴────┐                       ▼
│Selector │ ←──────────── ┌─────────────┐
└─────────┘               │    State    │
                          └─────────────┘
```

**Exemple concret** :

```typescript
// 1. ACTION - Décrit ce qui s'est passé
// store/trucks/trucks.actions.ts
export const loadTrucks = createAction('[Trucks] Load Trucks');
export const loadTrucksSuccess = createAction(
  '[Trucks] Load Trucks Success',
  props<{ trucks: Truck[] }>()
);

// 2. REDUCER - Met à jour l'état
// store/trucks/trucks.reducer.ts
export const trucksReducer = createReducer(
  initialState,
  on(loadTrucks, state => ({ ...state, loading: true })),
  on(loadTrucksSuccess, (state, { trucks }) => ({
    ...state,
    trucks,
    loading: false
  }))
);

// 3. EFFECT - Gère les effets de bord (appels API)
// store/trucks/trucks.effects.ts
loadTrucks$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadTrucks),
    switchMap(() =>
      this.truckService.getTrucks().pipe(
        map(trucks => loadTrucksSuccess({ trucks }))
      )
    )
  )
);

// 4. SELECTOR - Extrait les données de l'état
// store/trucks/trucks.selectors.ts
export const selectAllTrucks = createSelector(
  selectTrucksState,
  state => state.trucks
);

// 5. COMPONENT - Utilise les données
// features/map/map.component.ts
export class MapComponent {
  trucks$ = this.store.select(selectAllTrucks);

  ngOnInit() {
    this.store.dispatch(loadTrucks());
  }
}
```

### 8.3 Services HTTP

Les services font les appels API :

```typescript
// services/truck.service.ts
@Injectable({ providedIn: 'root' })
export class TruckService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/public/location/v1';

  getTrucks(): Observable<TruckListResponse> {
    return this.http.get<TruckListResponse>(`${this.baseUrl}/trucks`);
  }

  getTruckHistory(truckId: string, startTime: string, endTime: string): Observable<GPSPosition[]> {
    return this.http.get<GPSPosition[]>(`${this.baseUrl}/trucks/history`, {
      params: { truckId, startTime, endTime }
    });
  }
}
```

### 8.4 Interceptor - Ajout du Token JWT

L'interceptor ajoute automatiquement le token à chaque requête :

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('truck_track_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

### 8.5 Guard - Protection des Routes

Le guard empêche l'accès aux pages protégées :

```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// Utilisation dans les routes
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'map',
    component: MapComponent,
    canActivate: [authGuard]  // Route protégée
  }
];
```

---

## 9. Flux de Données Complets

### 9.1 Flux d'Authentification

```
┌─────────┐                  ┌───────────┐                 ┌────────────┐
│ Browser │                  │API Gateway│                 │Auth Service│
└────┬────┘                  └─────┬─────┘                 └──────┬─────┘
     │                             │                              │
     │  POST /auth/login           │                              │
     │  {email, password}          │                              │
     │ ───────────────────────────>│                              │
     │                             │   POST /auth/login           │
     │                             │ ────────────────────────────>│
     │                             │                              │
     │                             │   Vérifie credentials        │
     │                             │   Génère JWT                 │
     │                             │                              │
     │                             │   { accessToken, refreshToken}
     │                             │ <────────────────────────────│
     │   { accessToken, ...}       │                              │
     │ <───────────────────────────│                              │
     │                             │                              │
     │   Stocke token en           │                              │
     │   localStorage              │                              │
     │                             │                              │
```

### 9.2 Flux de Réception GPS

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌───────┐
│GPS Device│     │GPS Ingest.│     │    KAFKA    │     │Loc Svc│
└────┬─────┘     └─────┬─────┘     └──────┬──────┘     └───┬───┘
     │                 │                  │                │
     │ POST /gps/v1/   │                  │                │
     │ positions       │                  │                │
     │ ───────────────>│                  │                │
     │                 │                  │                │
     │                 │  Publish         │                │
     │                 │  "gps.position"  │                │
     │                 │ ────────────────>│                │
     │                 │                  │                │
     │                 │                  │  Consume       │
     │                 │                  │ ──────────────>│
     │                 │                  │                │
     │                 │                  │                │  Save to DB
     │                 │                  │                │  Update Redis
     │                 │                  │                │  Broadcast WS
     │                 │                  │                │
```

### 9.3 Flux d'Affichage Carte

```
┌─────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐
│ Browser │     │API Gateway│     │Location Svc│     │PostgreSQL│
└────┬────┘     └─────┬─────┘     └──────┬─────┘     └────┬─────┘
     │                │                  │                │
     │ GET /public/   │                  │                │
     │ location/v1/   │                  │                │
     │ trucks         │                  │                │
     │ ──────────────>│                  │                │
     │                │  GET /location/  │                │
     │                │  v1/trucks       │                │
     │                │ ────────────────>│                │
     │                │                  │  SELECT *      │
     │                │                  │  FROM trucks   │
     │                │                  │ ──────────────>│
     │                │                  │                │
     │                │                  │  [trucks data] │
     │                │                  │ <──────────────│
     │                │  [trucks data]   │                │
     │                │ <────────────────│                │
     │  [trucks data] │                  │                │
     │ <──────────────│                  │                │
     │                │                  │                │
     │  Affiche       │                  │                │
     │  markers sur   │                  │                │
     │  Leaflet map   │                  │                │
     │                │                  │                │
     │================│==================│================│
     │          WEBSOCKET CONNECTION                      │
     │ <─────────────────────────────────>                │
     │                │                  │                │
     │  Position      │                  │                │
     │  update        │                  │                │
     │ <──────────────────────────────────                │
     │                │                  │                │
     │  Update marker │                  │                │
     │  position      │                  │                │
```

---

## 10. Comment Lancer le Projet

### 10.1 Prérequis

| Outil | Version | Vérification |
|-------|---------|--------------|
| Java | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| Node.js | 18+ | `node -version` |
| npm | 9+ | `npm -version` |
| Docker | 20+ | `docker -version` |
| Docker Compose | 2+ | `docker compose version` |

### 10.2 Étapes de Lancement

#### Étape 1 : Cloner le projet
```bash
git clone <repository-url>
cd truck_track
```

#### Étape 2 : Démarrer l'infrastructure Docker
```bash
cd infra/docker
docker-compose up -d

# Vérifier que tout est lancé
docker-compose ps
```

Attendre que tous les services soient "healthy" (~30 secondes).

#### Étape 3 : Compiler le backend
```bash
cd backend
mvn clean install -DskipTests
```

#### Étape 4 : Démarrer les microservices

Ouvrir **5 terminaux** et lancer dans l'ordre :

```bash
# Terminal 1 - Auth Service
cd backend/auth-service
mvn spring-boot:run

# Terminal 2 - Location Service
cd backend/location-service
mvn spring-boot:run

# Terminal 3 - GPS Ingestion Service
cd backend/gps-ingestion-service
mvn spring-boot:run

# Terminal 4 - Notification Service
cd backend/notification-service
mvn spring-boot:run

# Terminal 5 - API Gateway
cd backend/api-gateway
mvn spring-boot:run
```

#### Étape 5 : Démarrer le frontend
```bash
cd frontend
npm install
npm start
```

#### Étape 6 : Accéder à l'application

| URL | Description |
|-----|-------------|
| http://localhost:4200 | Application TruckTrack |
| http://localhost:8088 | Kafka UI (admin) |
| http://localhost:8000/actuator/health | Santé API Gateway |

### 10.3 Identifiants par Défaut

```
Email: admin@trucktrack.com
Password: admin123
```

### 10.4 Script de Démarrage Rapide

```bash
#!/bin/bash
# start-all.sh

# 1. Infrastructure
cd infra/docker && docker-compose up -d
sleep 30

# 2. Backend (en background)
cd ../../backend
mvn spring-boot:run -pl auth-service &
mvn spring-boot:run -pl location-service &
mvn spring-boot:run -pl gps-ingestion-service &
mvn spring-boot:run -pl notification-service &
mvn spring-boot:run -pl api-gateway &

# 3. Frontend
cd ../frontend && npm start
```

---

## 11. API Reference

### 11.1 Auth Service

#### POST /auth/login
Authentifie un utilisateur.

**Request:**
```json
{
  "email": "admin@trucktrack.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900000
}
```

### 11.2 Location Service

#### GET /location/v1/trucks
Liste tous les camions.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filtrer par statut (ACTIVE, IDLE, OFFLINE) |
| page | int | Numéro de page (défaut: 0) |
| size | int | Taille de page (défaut: 100) |

**Response (200):**
```json
{
  "content": [
    {
      "id": "uuid-1234",
      "truckId": "TRUCK-001",
      "licensePlate": "AB-123-CD",
      "driverName": "Jean Dupont",
      "status": "ACTIVE",
      "currentLatitude": 48.8566,
      "currentLongitude": 2.3522,
      "currentSpeed": 65.5,
      "lastUpdate": "2024-01-15T10:30:00Z"
    }
  ],
  "totalElements": 50,
  "totalPages": 1
}
```

#### GET /location/v1/trucks/history
Récupère l'historique des positions.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| startTime | ISO8601 | Yes | Début de la période |
| endTime | ISO8601 | Yes | Fin de la période |
| truckId | UUID | No | Filtrer par camion |

**Response (200):**
```json
[
  {
    "id": "uuid-pos-1",
    "truckId": "uuid-truck-1",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "speed": 65.5,
    "heading": 180.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

### 11.3 Notification Service

#### GET /notification/v1/notifications
Liste les notifications de l'utilisateur.

**Response (200):**
```json
{
  "content": [
    {
      "id": "uuid-notif-1",
      "title": "Speed Limit Exceeded",
      "message": "TRUCK-001 exceeded 120 km/h",
      "severity": "CRITICAL",
      "isRead": false,
      "triggeredAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /notification/v1/alert-rules
Crée une nouvelle règle d'alerte.

**Request:**
```json
{
  "name": "Speed Limit Paris",
  "ruleType": "SPEED_LIMIT",
  "thresholdValue": 120,
  "isEnabled": true
}
```

---

## 12. Glossaire

| Terme | Définition |
|-------|------------|
| **API** | Application Programming Interface - Interface permettant à deux applications de communiquer |
| **API Gateway** | Point d'entrée unique qui route les requêtes vers les microservices |
| **Consumer** | Programme qui lit des messages depuis Kafka |
| **CORS** | Cross-Origin Resource Sharing - Mécanisme de sécurité pour les requêtes cross-domain |
| **DTO** | Data Transfer Object - Objet utilisé pour transférer des données entre couches |
| **Endpoint** | URL spécifique d'une API |
| **Entity** | Classe Java qui représente une table de base de données |
| **Flyway** | Outil de migration de base de données |
| **JWT** | JSON Web Token - Token d'authentification |
| **Kafka** | Système de messagerie distribué |
| **Microservice** | Petit service indépendant avec une responsabilité unique |
| **NgRx** | Bibliothèque Angular pour la gestion d'état (basée sur Redux) |
| **PostGIS** | Extension PostgreSQL pour les données géographiques |
| **Producer** | Programme qui publie des messages sur Kafka |
| **Redis** | Base de données en mémoire (cache) |
| **Repository** | Couche d'accès aux données (pattern Spring) |
| **REST** | Representational State Transfer - Style d'architecture pour les APIs web |
| **Topic** | File de messages dans Kafka |
| **WebSocket** | Protocole de communication bidirectionnel temps réel |

---

## Conclusion

TruckTrack est une application moderne basée sur :
- Une **architecture microservices** pour la scalabilité
- **Kafka** pour la communication asynchrone
- **WebSocket** pour le temps réel
- **Angular + NgRx** pour une interface réactive
- **PostgreSQL + PostGIS** pour les données géographiques

Cette architecture permet de gérer des milliers de camions avec des mises à jour en temps réel tout en restant maintenable et évolutive.

---

*Document généré le 16 décembre 2024*

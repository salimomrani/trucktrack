# Guide Complet: Kafka dans TruckTrack

## Table des Matieres

1. [Introduction a Kafka](#1-introduction-a-kafka)
2. [Pourquoi Kafka dans TruckTrack?](#2-pourquoi-kafka-dans-trucktrack)
3. [Architecture Kafka de TruckTrack](#3-architecture-kafka-de-trucktrack)
4. [Les Topics (Files de Messages)](#4-les-topics-files-de-messages)
5. [Les Producers (Emetteurs)](#5-les-producers-emetteurs)
6. [Les Consumers (Recepteurs)](#6-les-consumers-recepteurs)
7. [Les Events (Messages)](#7-les-events-messages)
8. [Flux de Donnees Complet](#8-flux-de-donnees-complet)
9. [Configuration](#9-configuration)
10. [Demarrage et Monitoring](#10-demarrage-et-monitoring)

---

## 1. Introduction a Kafka

### Qu'est-ce que Kafka?

**Apache Kafka** est une plateforme de streaming d'evenements distribuee. En termes simples, c'est comme un **systeme de messagerie ultra-rapide** entre applications.

### Analogie Simple

Imagine une **boite aux lettres geante** partagee:

```
┌─────────────────────────────────────────────────────────────┐
│                         KAFKA                                │
│                                                              │
│   GPS Device ──────┐                                         │
│                    │     ┌──────────────┐                    │
│   Mobile App ──────┼────>│   TOPIC      │────> Service A     │
│                    │     │  (Boite aux  │────> Service B     │
│   Backend ─────────┘     │   lettres)   │────> Service C     │
│                          └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

- **Producers** (Expediteurs): Envoient des messages dans la boite
- **Topics** (Boites aux lettres): Categorisent les messages par sujet
- **Consumers** (Destinataires): Lisent les messages de la boite

### Concepts Cles

| Concept | Description | Exemple TruckTrack |
|---------|-------------|-------------------|
| **Topic** | Une categorie de messages | `truck-track.gps.position` |
| **Producer** | Application qui envoie des messages | GPS Ingestion Service |
| **Consumer** | Application qui lit des messages | Location Service |
| **Partition** | Sous-division d'un topic pour parallelisme | 10 partitions pour GPS |
| **Consumer Group** | Groupe de consumers qui se partagent le travail | `location-service-group` |
| **Offset** | Position d'un message dans une partition | Message #12345 |

### Pourquoi pas une base de donnees classique?

| Critere | Base de Donnees | Kafka |
|---------|----------------|-------|
| Latence | 10-100ms | 1-5ms |
| Debit | ~10k messages/sec | ~1M messages/sec |
| Decoupling | Services couples | Services independants |
| Replay | Non | Oui (relire les anciens messages) |
| Scalabilite | Verticale | Horizontale |

---

## 2. Pourquoi Kafka dans TruckTrack?

### Le Probleme

TruckTrack recoit des **positions GPS en temps reel** de centaines de camions:

```
Camion 1 ──> Position toutes les 5 secondes
Camion 2 ──> Position toutes les 5 secondes
Camion 3 ──> Position toutes les 5 secondes
...
Camion 500 ──> Position toutes les 5 secondes

= 100 positions/seconde = 8.6 millions/jour
```

### Sans Kafka (Approche Naive)

```
GPS Device ──> API Gateway ──> Location Service ──> Base de Donnees
                                      │
                                      ├──> Notification Service
                                      ├──> Analytics Service
                                      └──> Alert Service

Problemes:
- Location Service surcharge
- Si un service est lent, tout bloque
- Perte de donnees si un service plante
```

### Avec Kafka (Architecture Event-Driven)

```
GPS Device ──> API Gateway ──> GPS Ingestion ──> KAFKA
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              v                    v                    v
                        Location Service    Notification Service   Analytics
                              │                    │
                              v                    v
                          Database            Push/Email
```

**Avantages:**
- Chaque service lit a son rythme
- Si un service plante, les messages sont conserves
- Ajout de nouveaux services sans modifier l'existant
- Historique des evenements (replay possible)

---

## 3. Architecture Kafka de TruckTrack

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TruckTrack Kafka Architecture                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐     ┌─────────────────────────────────────────┐   │
│  │  GPS Ingestion   │────>│  truck-track.gps.position               │   │
│  │    Service       │     │  (10 partitions, 7 jours retention)     │   │
│  └──────────────────┘     └──────────────┬──────────────────────────┘   │
│                                          │                               │
│                           ┌──────────────┼──────────────┐               │
│                           │              │              │               │
│                           v              v              v               │
│                    ┌──────────┐   ┌──────────┐   ┌──────────┐          │
│                    │ Location │   │ Notif.   │   │ Future   │          │
│                    │ Service  │   │ Service  │   │ Service  │          │
│                    └────┬─────┘   └────┬─────┘   └──────────┘          │
│                         │              │                                │
│                         v              v                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  truck-track.notification.alert (3 partitions, 90 jours)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────┐     ┌─────────────────────────────────────────┐   │
│  │  Location        │────>│  truck-track.trips.completed            │   │
│  │  Service         │────>│  truck-track.trips.assigned             │   │
│  │  (Trip Events)   │────>│  truck-track.trips.started              │   │
│  └──────────────────┘     └──────────────┬──────────────────────────┘   │
│                                          │                               │
│                                          v                               │
│                                   ┌──────────┐                          │
│                                   │ Notif.   │──> Email                 │
│                                   │ Service  │──> Push                  │
│                                   └──────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Les 3 Services Principaux

| Service | Role | Kafka Usage |
|---------|------|-------------|
| **GPS Ingestion** | Recoit les positions GPS | Producer uniquement |
| **Location Service** | Traite les positions, gere les trajets | Consumer + Producer |
| **Notification Service** | Envoie alertes, emails, push | Consumer + Producer |

---

## 4. Les Topics (Files de Messages)

### Definition

Un **topic** est comme une **categorie de messages**. Chaque topic a:
- Un **nom** unique
- Des **partitions** (sous-divisions pour parallelisme)
- Une **retention** (duree de conservation des messages)

### Topics de TruckTrack

```yaml
# Definis dans: infra/docker/docker-compose.yml

Topics:
  truck-track.gps.position:
    partitions: 10          # 10 files paralleles
    retention: 7 jours      # Messages conserves 7 jours
    usage: Positions GPS des camions

  truck-track.location.status-change:
    partitions: 5
    retention: 30 jours
    usage: Changements de statut (ACTIVE → IDLE → OFFLINE)

  truck-track.notification.alert:
    partitions: 3
    retention: 90 jours
    usage: Alertes declenchees (vitesse, geofence, offline)

  truck-track.trips.completed:
    partitions: 3
    retention: 30 jours
    usage: Trajets termines avec preuve de livraison

  truck-track.trips.assigned:
    partitions: 3
    retention: 30 jours
    usage: Assignations/reassignations/annulations de trajets

  truck-track.trips.started:
    partitions: 3
    retention: 30 jours
    usage: Demarrage de trajets par les chauffeurs

  truck-track.trips.eta-alert:
    partitions: 3
    retention: 7 jours
    usage: Alertes ETA (30min, 10min avant arrivee)
```

### Pourquoi des Partitions?

```
Sans partitions (1 seule file):
┌────────────────────────────────────────────────────┐
│ Msg1 │ Msg2 │ Msg3 │ Msg4 │ Msg5 │ Msg6 │ Msg7 │...│
└────────────────────────────────────────────────────┘
                        │
                        v
                   1 Consumer (lent!)

Avec 3 partitions (3 files paralleles):
┌────────────────┐
│ Msg1 │ Msg4 │ Msg7 │  ──> Consumer 1
└────────────────┘
┌────────────────┐
│ Msg2 │ Msg5 │ Msg8 │  ──> Consumer 2
└────────────────┘
┌────────────────┐
│ Msg3 │ Msg6 │ Msg9 │  ──> Consumer 3
└────────────────┘

= 3x plus rapide!
```

### Cle de Partition (Partition Key)

Dans TruckTrack, on utilise le **Truck ID** comme cle:

```java
// Tous les messages du meme camion vont dans la meme partition
kafkaTemplate.send(topic, truckId, event);
//                        ^^^^^^^^
//                        Partition Key

// Resultat:
// Partition 0: Tous les messages du Camion A
// Partition 1: Tous les messages du Camion B
// Partition 2: Tous les messages du Camion C
// ...

// Avantage: Les messages d'un camion sont toujours dans l'ordre!
```

---

## 5. Les Producers (Emetteurs)

### Qu'est-ce qu'un Producer?

Un **Producer** est un service qui **envoie des messages** vers Kafka.

### Producer 1: GPS Ingestion Service

**Fichier:** `backend/gps-ingestion-service/src/main/java/com/trucktrack/gps/service/KafkaProducerService.java`

```java
@Service
public class KafkaProducerService {

    // Template Spring pour envoyer des messages Kafka
    private final KafkaTemplate<String, GPSPositionEvent> kafkaTemplate;

    // Nom du topic (configurable)
    @Value("${kafka.topics.gps-position:truck-track.gps.position}")
    private String gpsPositionTopic;

    /**
     * Publie une position GPS vers Kafka
     */
    public void publishGPSPosition(GPSPositionDTO positionDTO, String eventId) {
        // 1. Creer l'evenement
        GPSPositionEvent event = GPSPositionEvent.builder()
            .eventId(eventId)
            .truckId(positionDTO.getTruckId())
            .latitude(positionDTO.getLatitude())
            .longitude(positionDTO.getLongitude())
            .speed(positionDTO.getSpeed())
            .timestamp(positionDTO.getTimestamp())
            .ingestedAt(Instant.now())
            .build();

        // 2. Envoyer vers Kafka (async)
        CompletableFuture<SendResult<String, GPSPositionEvent>> future =
            kafkaTemplate.send(gpsPositionTopic, positionDTO.getTruckId(), event);

        // 3. Callback pour log success/error
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Erreur envoi Kafka: {}", ex.getMessage());
            } else {
                log.debug("GPS publie: partition={}, offset={}",
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
            }
        });
    }
}
```

**Explication ligne par ligne:**

1. `@Service` - Indique que c'est un service Spring
2. `KafkaTemplate` - L'outil Spring pour envoyer des messages Kafka
3. `@Value` - Lit le nom du topic depuis la config
4. `kafkaTemplate.send(topic, key, event)`:
   - `topic`: Ou envoyer
   - `key`: Cle de partition (truckId)
   - `event`: Le message a envoyer
5. `CompletableFuture` - L'envoi est **asynchrone** (non-bloquant)
6. `whenComplete` - Callback execute apres envoi

### Producer 2: Alert Rule Engine

**Fichier:** `backend/notification-service/src/main/java/com/trucktrack/notification/service/AlertRuleEngine.java`

```java
@Service
public class AlertRuleEngine {

    private final KafkaTemplate<String, AlertTriggeredEvent> kafkaTemplate;

    @Value("${kafka.topics.alert:truck-track.notification.alert}")
    private String alertTopic;

    /**
     * Declenche une alerte (ex: exces de vitesse)
     */
    private void triggerAlert(AlertRule rule, GPSPositionEvent event, String message) {
        // 1. Verifier le cooldown (eviter spam)
        if (isInCooldown(rule.getId(), event.getTruckId())) {
            return; // Deja alerte recemment, on ignore
        }

        // 2. Creer l'evenement d'alerte
        AlertTriggeredEvent alert = AlertTriggeredEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .alertRuleId(rule.getId())
            .truckId(event.getTruckId())
            .alertType(rule.getAlertType())    // SPEED_LIMIT, GEOFENCE_EXIT, etc.
            .severity(rule.getSeverity())       // INFO, WARNING, CRITICAL
            .message(message)
            .latitude(event.getLatitude())
            .longitude(event.getLongitude())
            .triggeredAt(Instant.now())
            .affectedUserIds(getAffectedUsers(event.getTruckId()))
            .build();

        // 3. Publier vers Kafka
        kafkaTemplate.send(alertTopic, event.getTruckId(), alert);

        // 4. Mettre en cooldown (5 min par defaut)
        setCooldown(rule.getId(), event.getTruckId());

        log.info("Alerte declenchee: type={}, truck={}, message={}",
            rule.getAlertType(), event.getTruckId(), message);
    }
}
```

### Producer 3: Trip Event Publisher

**Fichier:** `backend/location-service/src/main/java/com/trucktrack/location/service/TripEventPublisher.java`

```java
@Service
public class TripEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Publie quand un trajet est termine
     */
    public void publishTripCompleted(Trip trip, String signerName,
                                     String signatureUrl, List<String> photoUrls) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("tripId", trip.getId().toString());
        payload.put("driverId", trip.getAssignedDriver().getId().toString());
        payload.put("origin", trip.getOrigin());
        payload.put("destination", trip.getDestination());
        payload.put("completedAt", LocalDateTime.now().toString());
        payload.put("signerName", signerName);
        payload.put("signatureUrl", signatureUrl);
        payload.put("photoUrls", photoUrls);
        payload.put("recipientEmail", trip.getRecipientEmail());

        kafkaTemplate.send("truck-track.trips.completed",
                          trip.getId().toString(), payload);
    }

    /**
     * Publie quand un trajet est assigne
     */
    public void publishTripAssigned(Trip trip, String vehiclePlate) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "NEW_ASSIGNMENT");
        payload.put("tripId", trip.getId().toString());
        payload.put("driverId", trip.getAssignedDriver().getId().toString());
        payload.put("vehiclePlate", vehiclePlate);
        payload.put("origin", trip.getOrigin());
        payload.put("destination", trip.getDestination());
        payload.put("scheduledDeparture", trip.getScheduledDeparture().toString());

        kafkaTemplate.send("truck-track.trips.assigned",
                          trip.getId().toString(), payload);
    }

    /**
     * Publie quand un trajet est annule
     */
    public void publishTripCancelled(Trip trip, UUID previousDriverId, String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "CANCELLATION");
        payload.put("tripId", trip.getId().toString());
        payload.put("previousDriverId", previousDriverId.toString());
        payload.put("reason", reason);

        kafkaTemplate.send("truck-track.trips.assigned",
                          trip.getId().toString(), payload);
    }
}
```

---

## 6. Les Consumers (Recepteurs)

### Qu'est-ce qu'un Consumer?

Un **Consumer** est un service qui **lit des messages** depuis Kafka.

### Consumer 1: Location Kafka Consumer

**Fichier:** `backend/location-service/src/main/java/com/trucktrack/location/consumer/LocationKafkaConsumer.java`

```java
@Component
public class LocationKafkaConsumer {

    private final LocationService locationService;

    /**
     * Ecoute le topic GPS et traite chaque position
     */
    @KafkaListener(
        topics = "${kafka.topics.gps-position:truck-track.gps.position}",
        groupId = "location-service-group",
        concurrency = "3"  // 3 threads paralleles
    )
    public void consumeGPSPosition(
        @Payload GPSPositionEvent event,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.debug("GPS recu: truck={}, partition={}, offset={}",
            event.getTruckId(), partition, offset);

        try {
            // Traiter la position (update DB, cache, calcul statut)
            locationService.processGPSPosition(event);
        } catch (Exception e) {
            log.error("Erreur traitement GPS: {}", e.getMessage());
            throw e; // Re-throw pour que Kafka re-essaie
        }
    }
}
```

**Annotations expliquees:**

| Annotation | Role |
|------------|------|
| `@KafkaListener` | Declare ce methode comme ecouteur Kafka |
| `topics` | Quel(s) topic(s) ecouter |
| `groupId` | Groupe de consumers (pour partage du travail) |
| `concurrency` | Nombre de threads paralleles |
| `@Payload` | Le message recu |
| `@Header` | Metadonnees (partition, offset, etc.) |

### Consumer 2: Alert Kafka Consumer

**Fichier:** `backend/notification-service/src/main/java/com/trucktrack/notification/kafka/AlertKafkaConsumer.java`

```java
@Component
public class AlertKafkaConsumer {

    private final AlertRuleEngine alertRuleEngine;

    /**
     * Consumer 1: Ecoute les positions GPS pour evaluer les regles d'alerte
     */
    @KafkaListener(
        topics = "${kafka.topics.gps-position}",
        groupId = "notification-service-gps-consumer",
        containerFactory = "gpsKafkaListenerContainerFactory"
    )
    public void consumeGPSPositionEvent(GPSPositionEvent event, Acknowledgment ack) {
        try {
            // Evaluer les regles (vitesse, geofence, etc.)
            alertRuleEngine.evaluateRules(event);

            // Confirmer manuellement que le message est traite
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Erreur evaluation regles: {}", e.getMessage());
            // Ne pas acknowledge = le message sera re-envoye
        }
    }

    /**
     * Consumer 2: Ecoute les alertes pour envoyer les notifications
     */
    @KafkaListener(
        topics = "${kafka.topics.alert}",
        groupId = "notification-service-alert-consumer",
        containerFactory = "alertKafkaListenerContainerFactory"
    )
    public void consumeAlertTriggeredEvent(AlertTriggeredEvent event, Acknowledgment ack) {
        try {
            // Creer les notifications pour les utilisateurs concernes
            alertRuleEngine.processAlertEvent(event);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Erreur traitement alerte: {}", e.getMessage());
        }
    }
}
```

### Consumer 3: Trip Event Consumer

**Fichier:** `backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java`

```java
@Component
public class TripEventConsumer {

    private final EmailService emailService;
    private final PushNotificationService pushService;
    private final ObjectMapper objectMapper;

    /**
     * Trajet termine -> Envoyer email de confirmation avec preuve de livraison
     */
    @KafkaListener(topics = "truck-track.trips.completed", groupId = "notification-service-group")
    public void handleTripCompleted(ConsumerRecord<String, String> record) {
        try {
            // 1. Deserialiser le JSON
            Map<String, Object> payload = objectMapper.readValue(
                record.value(), new TypeReference<>() {});

            String recipientEmail = (String) payload.get("recipientEmail");
            String recipientName = (String) payload.get("recipientName");
            String signerName = (String) payload.get("signerName");

            // 2. Envoyer email de confirmation
            emailService.sendDeliveryConfirmation(
                recipientEmail,
                recipientName,
                signerName,
                (String) payload.get("signatureUrl"),
                (List<String>) payload.get("photoUrls")
            );

            log.info("Email confirmation livraison envoye a {}", recipientEmail);

        } catch (Exception e) {
            log.error("Erreur traitement trip completed: {}", e.getMessage());
        }
    }

    /**
     * Trajet assigne/reassigne/annule -> Notifier le chauffeur
     */
    @KafkaListener(topics = "truck-track.trips.assigned", groupId = "notification-service-group")
    public void handleTripAssigned(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(
                record.value(), new TypeReference<>() {});

            String type = (String) payload.get("type");
            String driverId = (String) payload.get("newDriverId");

            switch (type) {
                case "NEW_ASSIGNMENT":
                    pushService.sendTripAssignedNotification(driverId, payload);
                    break;
                case "REASSIGNMENT":
                    pushService.sendTripReassignedNotification(driverId, payload);
                    // Notifier aussi l'ancien chauffeur
                    String previousDriverId = (String) payload.get("previousDriverId");
                    pushService.sendTripUnassignedNotification(previousDriverId);
                    break;
                case "CANCELLATION":
                    previousDriverId = (String) payload.get("previousDriverId");
                    pushService.sendTripCancelledNotification(previousDriverId,
                        (String) payload.get("reason"));
                    break;
            }
        } catch (Exception e) {
            log.error("Erreur traitement trip assigned: {}", e.getMessage());
        }
    }
}
```

### Consumer Groups Expliques

```
Topic: truck-track.gps.position (10 partitions)

Consumer Group: "location-service-group"
┌─────────────────────────────────────────────────────┐
│  Instance 1      Instance 2      Instance 3         │
│  (Partitions     (Partitions     (Partitions        │
│   0, 1, 2, 3)     4, 5, 6)        7, 8, 9)          │
└─────────────────────────────────────────────────────┘

Consumer Group: "notification-service-gps-consumer"
┌─────────────────────────────────────────────────────┐
│  Instance 1      Instance 2                         │
│  (Partitions     (Partitions                        │
│   0-4)            5-9)                              │
└─────────────────────────────────────────────────────┘

Chaque groupe lit TOUS les messages independamment!
= Location Service et Notification Service recoivent TOUS les GPS
```

---

## 7. Les Events (Messages)

### Structure d'un Event

Chaque message Kafka a:
- **Key** (Cle): Pour le partitionnement
- **Value** (Valeur): Les donnees (JSON)
- **Headers**: Metadonnees (type, timestamp, etc.)

### Event 1: GPSPositionEvent

**Fichier:** `backend/shared/src/main/java/com/trucktrack/common/event/GPSPositionEvent.java`

```java
@Data
@Builder
public class GPSPositionEvent implements Serializable {

    private String eventId;           // ID unique de l'evenement
    private String truckId;           // UUID du camion
    private String truckIdReadable;   // ID lisible (TRK-001)
    private Double latitude;          // 48.8566 (Paris)
    private Double longitude;         // 2.3522
    private Double altitude;          // Altitude en metres
    private Double speed;             // Vitesse en km/h
    private Integer heading;          // Direction (0-360 degres)
    private Double accuracy;          // Precision GPS en metres
    private Integer satellites;       // Nombre de satellites
    private Instant timestamp;        // Quand la position a ete prise
    private Instant ingestedAt;       // Quand le serveur l'a recue
}
```

**Exemple JSON:**
```json
{
  "eventId": "evt-123e4567-e89b",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "truckIdReadable": "TRK-001",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "altitude": 35.0,
  "speed": 65.5,
  "heading": 180,
  "accuracy": 5.0,
  "satellites": 12,
  "timestamp": "2024-01-15T10:30:00Z",
  "ingestedAt": "2024-01-15T10:30:00.123Z"
}
```

### Event 2: AlertTriggeredEvent

**Fichier:** `backend/shared/src/main/java/com/trucktrack/common/event/AlertTriggeredEvent.java`

```java
@Data
@Builder
public class AlertTriggeredEvent implements Serializable {

    private String eventId;           // ID unique
    private String alertRuleId;       // Quelle regle a declenche
    private String truckId;           // Camion concerne
    private String truckIdReadable;   // TRK-001
    private AlertType alertType;      // Type d'alerte
    private Severity severity;        // Gravite
    private String message;           // Message descriptif
    private Double latitude;          // Position au moment de l'alerte
    private Double longitude;
    private Instant triggeredAt;      // Quand l'alerte s'est declenchee
    private List<String> affectedUserIds; // Qui doit etre notifie
}

public enum AlertType {
    OFFLINE,          // Camion hors ligne
    IDLE,             // Camion inactif
    GEOFENCE_ENTER,   // Entree dans une zone
    GEOFENCE_EXIT,    // Sortie d'une zone
    SPEED_LIMIT       // Exces de vitesse
}

public enum Severity {
    INFO,      // Information
    WARNING,   // Avertissement
    CRITICAL   // Critique
}
```

**Exemple JSON:**
```json
{
  "eventId": "alert-789xyz",
  "alertRuleId": "rule-speed-highway",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "truckIdReadable": "TRK-001",
  "alertType": "SPEED_LIMIT",
  "severity": "WARNING",
  "message": "Truck TRK-001 exceeded speed limit: 85 km/h (limit: 80 km/h)",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "triggeredAt": "2024-01-15T10:30:05Z",
  "affectedUserIds": ["user-123", "user-456"]
}
```

### Event 3: TruckStatusChangeEvent

```java
@Data
@Builder
public class TruckStatusChangeEvent implements Serializable {

    private String eventId;
    private String truckId;
    private String truckIdReadable;
    private TruckStatus previousStatus;  // Ancien statut
    private TruckStatus newStatus;       // Nouveau statut
    private Double latitude;
    private Double longitude;
    private Instant timestamp;
}

public enum TruckStatus {
    ACTIVE,   // En mouvement
    IDLE,     // Arrete moteur allume
    OFFLINE   // Pas de signal
}
```

---

## 8. Flux de Donnees Complet

### Scenario 1: Position GPS Recue

```
1. GPS Device envoie position via HTTP
   POST /api/gps/position
   { truckId: "TRK-001", lat: 48.85, lon: 2.35, speed: 65 }

2. GPS Ingestion Service recoit et publie vers Kafka
   ┌──────────────────────┐
   │ GPS Ingestion        │
   │ KafkaProducerService │───> truck-track.gps.position
   └──────────────────────┘

3. Location Service consomme et traite
   truck-track.gps.position ───> LocationKafkaConsumer
                                       │
                                       v
                               ┌───────────────┐
                               │ - Update DB   │
                               │ - Update Cache│
                               │ - Calc Status │
                               └───────────────┘

4. Notification Service consomme et evalue les regles
   truck-track.gps.position ───> AlertKafkaConsumer
                                       │
                                       v
                               ┌───────────────────┐
                               │ AlertRuleEngine   │
                               │ - Check speed     │
                               │ - Check geofence  │
                               │ - Check offline   │
                               └───────────────────┘
                                       │
                                       v (si alerte)
                               truck-track.notification.alert
                                       │
                                       v
                               AlertKafkaConsumer
                                       │
                                       v
                               ┌────────────────────┐
                               │ Create Notification│
                               │ Send Push/Email    │
                               └────────────────────┘
```

### Scenario 2: Exces de Vitesse Detecte

```
Chronologie:

T+0ms   GPS Device envoie: { speed: 95 km/h }
T+5ms   GPS Ingestion publie vers Kafka
T+10ms  Notification Service recoit le message
T+15ms  AlertRuleEngine.evaluateRules()
        └─> Regle "speed_limit_80" correspond!
T+20ms  AlertRuleEngine.triggerAlert()
        └─> Publie AlertTriggeredEvent vers truck-track.notification.alert
T+25ms  AlertKafkaConsumer recoit l'alerte
T+30ms  NotificationService.createNotification()
        └─> Insert en DB
T+35ms  PushNotificationService.send()
        └─> Firebase Cloud Messaging
T+100ms User recoit la notification push

Total: ~100ms du GPS au push notification!
```

### Scenario 3: Trajet Complete

```
1. Chauffeur complete le trajet dans l'app mobile
   POST /api/trips/{id}/complete
   { signerName: "Jean Dupont", signature: "base64...", photos: [...] }

2. Location Service traite et publie
   TripService.completeTrip()
        │
        v
   TripEventPublisher.publishTripCompleted()
        │
        v
   truck-track.trips.completed

3. Notification Service consomme
   TripEventConsumer.handleTripCompleted()
        │
        ├─> EmailService.sendDeliveryConfirmation()
        │   └─> Email au destinataire avec PDF de preuve
        │
        └─> PushNotificationService.sendToClient()
            └─> Notification push au client
```

---

## 9. Configuration

### Configuration Producer (GPS Ingestion)

**Fichier:** `backend/gps-ingestion-service/src/main/resources/application.yml`

```yaml
spring:
  kafka:
    # Adresse du broker Kafka
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}

    producer:
      # Attend confirmation de TOUS les replicas
      acks: all

      # Compression des messages (reduit bande passante)
      compression-type: snappy

      # Serialisation
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

      properties:
        # Ajoute le type Java dans les headers (pour deserialisation)
        spring.json.add.type.headers: true
        spring.json.type.mapping: >
          GPSPositionEvent:com.trucktrack.common.event.GPSPositionEvent

# Topics custom
kafka:
  topics:
    gps-position: truck-track.gps.position
```

### Configuration Consumer (Location Service)

**Fichier:** `backend/location-service/src/main/resources/application.yml`

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}

    consumer:
      # Groupe de consumers
      group-id: location-service-consumer-group

      # Ou commencer si pas d'offset sauvegarde
      # earliest = depuis le debut
      # latest = seulement les nouveaux messages
      auto-offset-reset: earliest

      # NE PAS commit automatiquement (on le fait manuellement)
      enable-auto-commit: false

      # Deserialisation avec gestion d'erreurs
      key-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer

      properties:
        # Type mapping pour deserialisation
        spring.json.type.mapping: >
          GPSPositionEvent:com.trucktrack.common.event.GPSPositionEvent

kafka:
  topics:
    gps-position: truck-track.gps.position
    status-change: truck-track.location.status-change
```

### Configuration Kafka (KafkaConfig.java)

**Fichier:** `backend/notification-service/src/main/java/com/trucktrack/notification/kafka/KafkaConfig.java`

```java
@EnableKafka
@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    /**
     * Factory pour consumer GPS Position
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, GPSPositionEvent>
           gpsKafkaListenerContainerFactory() {

        ConcurrentKafkaListenerContainerFactory<String, GPSPositionEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();

        // Configuration du consumer
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "notification-service-gps-consumer");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        // Deserializer JSON avec gestion d'erreurs
        JsonDeserializer<GPSPositionEvent> deserializer =
            new JsonDeserializer<>(GPSPositionEvent.class);
        deserializer.addTrustedPackages("*");

        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(
            props,
            new StringDeserializer(),
            new ErrorHandlingDeserializer<>(deserializer)
        ));

        // Mode acknowledgment manuel
        factory.getContainerProperties()
               .setAckMode(ContainerProperties.AckMode.MANUAL);

        // 3 threads paralleles
        factory.setConcurrency(3);

        return factory;
    }
}
```

---

## 10. Demarrage et Monitoring

### Demarrer Kafka (Docker)

```bash
# Depuis la racine du projet
cd infra/docker

# Demarrer tous les services (Kafka, PostgreSQL, Redis, etc.)
docker-compose up -d

# Verifier que Kafka est lance
docker-compose ps

# Voir les logs Kafka
docker-compose logs -f kafka
```

### Kafka UI (Interface Web)

Acces: **http://localhost:8088**

```
┌─────────────────────────────────────────────────────┐
│  Kafka UI                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Topics:                                            │
│  ├── truck-track.gps.position (10 partitions)      │
│  │   └── Messages: 1,234,567                       │
│  ├── truck-track.notification.alert (3 partitions) │
│  │   └── Messages: 456                             │
│  └── truck-track.trips.completed (3 partitions)    │
│      └── Messages: 89                              │
│                                                     │
│  Consumer Groups:                                   │
│  ├── location-service-group                        │
│  │   └── Lag: 0 (a jour!)                         │
│  └── notification-service-gps-consumer             │
│      └── Lag: 12 (12 messages en retard)          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Commandes Kafka Utiles

```bash
# Lister les topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Voir les details d'un topic
docker exec -it kafka kafka-topics --describe \
  --topic truck-track.gps.position \
  --bootstrap-server localhost:9092

# Lire les messages d'un topic (depuis le debut)
docker exec -it kafka kafka-console-consumer \
  --topic truck-track.gps.position \
  --from-beginning \
  --bootstrap-server localhost:9092

# Voir les consumer groups
docker exec -it kafka kafka-consumer-groups --list \
  --bootstrap-server localhost:9092

# Voir le lag d'un consumer group
docker exec -it kafka kafka-consumer-groups --describe \
  --group location-service-group \
  --bootstrap-server localhost:9092
```

### Metriques a Surveiller

| Metrique | Description | Seuil d'Alerte |
|----------|-------------|----------------|
| **Consumer Lag** | Messages non traites | > 1000 |
| **Messages/sec** | Debit de messages | Chute soudaine |
| **Partition Skew** | Desequilibre partitions | > 20% difference |
| **Broker Disk** | Espace disque | < 20% libre |

---

## Resume

```
┌─────────────────────────────────────────────────────────────────┐
│                    TruckTrack Kafka en Resume                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRODUCERS (Emetteurs):                                         │
│  • GPS Ingestion → truck-track.gps.position                     │
│  • Alert Engine  → truck-track.notification.alert               │
│  • Trip Publisher → truck-track.trips.*                         │
│                                                                  │
│  TOPICS (Files):                                                │
│  • gps.position      (10 partitions, 7j)  - Positions GPS       │
│  • notification.alert (3 partitions, 90j) - Alertes             │
│  • trips.completed    (3 partitions, 30j) - Trajets termines    │
│  • trips.assigned     (3 partitions, 30j) - Assignations        │
│                                                                  │
│  CONSUMERS (Recepteurs):                                        │
│  • Location Service   - Traite GPS, update DB                   │
│  • Notification Service:                                        │
│    - Evalue regles alertes                                      │
│    - Envoie notifications push/email                            │
│                                                                  │
│  AVANTAGES:                                                     │
│  • Decoupling: Services independants                            │
│  • Scalabilite: Partitions + Consumer Groups                    │
│  • Resilience: Messages conserves si service down               │
│  • Performance: ~1M messages/sec possible                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

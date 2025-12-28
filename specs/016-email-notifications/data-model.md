# Data Model: Email & Push Notifications

**Feature**: 016-email-notifications
**Date**: 2025-12-28

## Entity Relationship Diagram

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│     NotificationLog         │     │   UserNotificationPref      │
├─────────────────────────────┤     ├─────────────────────────────┤
│ id (UUID) PK                │     │ id (UUID) PK                │
│ notification_type           │     │ user_id (UUID) FK→users     │
│ channel (EMAIL/PUSH)        │     │ event_type                  │
│ recipient_id (UUID)         │     │ email_enabled (boolean)     │
│ recipient_email             │     │ push_enabled (boolean)      │
│ recipient_type              │     │ created_at                  │
│ subject                     │     │ updated_at                  │
│ content_preview             │     └─────────────────────────────┘
│ status                      │
│ sent_at                     │     ┌─────────────────────────────┐
│ delivered_at                │     │       PushToken             │
│ read_at                     │     ├─────────────────────────────┤
│ error_message               │     │ id (UUID) PK                │
│ retry_count                 │     │ user_id (UUID) FK→users     │
│ metadata (JSONB)            │     │ token                       │
│ created_at                  │     │ device_type (IOS/ANDROID)   │
└─────────────────────────────┘     │ device_name                 │
                                    │ is_active (boolean)         │
┌─────────────────────────────┐     │ last_used_at                │
│   NotificationTemplate      │     │ created_at                  │
├─────────────────────────────┤     │ updated_at                  │
│ id (UUID) PK                │     └─────────────────────────────┘
│ code (unique)               │
│ name                        │     ┌─────────────────────────────┐
│ channel (EMAIL/PUSH)        │     │     EmailRecipient          │
│ subject_template            │     ├─────────────────────────────┤
│ body_template               │     │ id (UUID) PK                │
│ locale (fr/en)              │     │ email                       │
│ is_active (boolean)         │     │ name                        │
│ variables (JSONB)           │     │ is_valid (boolean)          │
│ created_at                  │     │ bounce_count                │
│ updated_at                  │     │ last_bounce_at              │
└─────────────────────────────┘     │ created_at                  │
                                    │ updated_at                  │
                                    └─────────────────────────────┘
```

## Tables

### 1. notification_logs

Historique de toutes les notifications envoyées.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| notification_type | VARCHAR(50) | NOT NULL | Type: DELIVERY_CONFIRMED, TRIP_ASSIGNED, ETA_ALERT, DAILY_REPORT |
| channel | VARCHAR(10) | NOT NULL | Canal: EMAIL, PUSH |
| recipient_id | UUID | NULL | ID utilisateur (si compte existant) |
| recipient_email | VARCHAR(255) | NULL | Email du destinataire |
| recipient_type | VARCHAR(20) | NOT NULL | Type: DRIVER, FLEET_MANAGER, CLIENT |
| subject | VARCHAR(255) | NULL | Sujet (email uniquement) |
| content_preview | VARCHAR(500) | NULL | Aperçu du contenu |
| status | VARCHAR(20) | NOT NULL | Status: PENDING, SENT, DELIVERED, FAILED, BOUNCED |
| sent_at | TIMESTAMP | NULL | Date d'envoi |
| delivered_at | TIMESTAMP | NULL | Date de livraison (webhook) |
| read_at | TIMESTAMP | NULL | Date de lecture (email open tracking) |
| error_message | TEXT | NULL | Message d'erreur si échec |
| retry_count | INT | DEFAULT 0 | Nombre de tentatives |
| metadata | JSONB | NULL | Données additionnelles (trip_id, proof_id, etc.) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |

**Indexes:**
- `idx_notification_logs_recipient_id` ON (recipient_id)
- `idx_notification_logs_status` ON (status)
- `idx_notification_logs_type_date` ON (notification_type, created_at)
- `idx_notification_logs_recipient_email` ON (recipient_email)

---

### 2. user_notification_preferences

Préférences de notification par utilisateur et type d'événement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| user_id | UUID | FK→users, NOT NULL | Référence utilisateur |
| event_type | VARCHAR(50) | NOT NULL | Type d'événement |
| email_enabled | BOOLEAN | DEFAULT TRUE | Recevoir par email |
| push_enabled | BOOLEAN | DEFAULT TRUE | Recevoir par push |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de mise à jour |

**Unique Constraint:** (user_id, event_type)

**Event Types:**
- `DELIVERY_CONFIRMED` - Livraison terminée
- `TRIP_ASSIGNED` - Trip assigné
- `TRIP_CANCELLED` - Trip annulé
- `ETA_30MIN` - ETA sous 30 minutes
- `ETA_10MIN` - ETA sous 10 minutes
- `DAILY_REPORT` - Rapport quotidien

---

### 3. push_tokens

Tokens FCM/APNs par device.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| user_id | UUID | FK→users, NOT NULL | Référence utilisateur |
| token | VARCHAR(500) | NOT NULL, UNIQUE | Token FCM/APNs |
| device_type | VARCHAR(10) | NOT NULL | Type: IOS, ANDROID |
| device_name | VARCHAR(100) | NULL | Nom du device (optionnel) |
| is_active | BOOLEAN | DEFAULT TRUE | Token actif |
| last_used_at | TIMESTAMP | NULL | Dernière utilisation |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de mise à jour |

**Indexes:**
- `idx_push_tokens_user_id` ON (user_id)
- `idx_push_tokens_token` ON (token)

---

### 4. notification_templates

Templates d'emails et notifications push.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Code template (ex: DELIVERY_CONFIRMED_EMAIL) |
| name | VARCHAR(100) | NOT NULL | Nom lisible |
| channel | VARCHAR(10) | NOT NULL | Canal: EMAIL, PUSH |
| subject_template | VARCHAR(255) | NULL | Template du sujet (email) |
| body_template | TEXT | NOT NULL | Template du corps |
| locale | VARCHAR(5) | NOT NULL, DEFAULT 'fr' | Langue: fr, en |
| is_active | BOOLEAN | DEFAULT TRUE | Template actif |
| variables | JSONB | NULL | Liste des variables attendues |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de mise à jour |

**Unique Constraint:** (code, locale)

---

### 5. email_recipients

Clients finaux sans compte utilisateur.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Identifiant unique |
| email | VARCHAR(255) | NOT NULL | Email du client |
| name | VARCHAR(100) | NULL | Nom du client |
| is_valid | BOOLEAN | DEFAULT TRUE | Email valide |
| bounce_count | INT | DEFAULT 0 | Nombre de bounces |
| last_bounce_at | TIMESTAMP | NULL | Dernier bounce |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de création |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Date de mise à jour |

**Unique Constraint:** (email)

**Business Rules:**
- Si `bounce_count >= 3`, marquer `is_valid = FALSE`
- Ne pas envoyer d'email si `is_valid = FALSE`

---

## Modifications aux Tables Existantes

### Table: trips (location-service)

Ajout de champs pour le client destinataire:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| recipient_email | VARCHAR(255) | NULL | Email du client pour notifications |
| recipient_name | VARCHAR(100) | NULL | Nom du client |
| recipient_phone | VARCHAR(20) | NULL | Téléphone (futur SMS) |

---

## Enums

### NotificationType
```java
public enum NotificationType {
    DELIVERY_CONFIRMED,
    TRIP_ASSIGNED,
    TRIP_REASSIGNED,
    TRIP_CANCELLED,
    ETA_30MIN,
    ETA_10MIN,
    DAILY_REPORT
}
```

### NotificationChannel
```java
public enum NotificationChannel {
    EMAIL,
    PUSH
}
```

### NotificationStatus
```java
public enum NotificationStatus {
    PENDING,    // En attente d'envoi
    SENT,       // Envoyé au provider
    DELIVERED,  // Livré au destinataire
    READ,       // Lu (email open)
    FAILED,     // Échec d'envoi
    BOUNCED     // Email bounced
}
```

### DeviceType
```java
public enum DeviceType {
    IOS,
    ANDROID
}
```

### RecipientType
```java
public enum RecipientType {
    DRIVER,
    FLEET_MANAGER,
    DISPATCHER,
    CLIENT
}
```

---

## Migration SQL

```sql
-- V1__create_notification_tables.sql

CREATE TYPE notification_type AS ENUM (
    'DELIVERY_CONFIRMED', 'TRIP_ASSIGNED', 'TRIP_REASSIGNED',
    'TRIP_CANCELLED', 'ETA_30MIN', 'ETA_10MIN', 'DAILY_REPORT'
);

CREATE TYPE notification_channel AS ENUM ('EMAIL', 'PUSH');

CREATE TYPE notification_status AS ENUM (
    'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED'
);

CREATE TYPE device_type AS ENUM ('IOS', 'ANDROID');

CREATE TYPE recipient_type AS ENUM (
    'DRIVER', 'FLEET_MANAGER', 'DISPATCHER', 'CLIENT'
);

-- Notification Logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    recipient_id UUID,
    recipient_email VARCHAR(255),
    recipient_type recipient_type NOT NULL,
    subject VARCHAR(255),
    content_preview VARCHAR(500),
    status notification_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_recipient_id ON notification_logs(recipient_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_type_date ON notification_logs(notification_type, created_at);
CREATE INDEX idx_notification_logs_recipient_email ON notification_logs(recipient_email);

-- User Notification Preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, event_type)
);

-- Push Tokens
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_type device_type NOT NULL,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    channel notification_channel NOT NULL,
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'fr',
    is_active BOOLEAN DEFAULT TRUE,
    variables JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(code, locale)
);

-- Email Recipients (clients without accounts)
CREATE TABLE email_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_valid BOOLEAN DEFAULT TRUE,
    bounce_count INT DEFAULT 0,
    last_bounce_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Data Seed (Templates)

```sql
-- Templates de base
INSERT INTO notification_templates (code, name, channel, subject_template, body_template, locale, variables) VALUES
-- Delivery Confirmed - FR
('DELIVERY_CONFIRMED_EMAIL', 'Confirmation de livraison', 'EMAIL',
 'Votre livraison a été effectuée - {{orderNumber}}',
 '...',  -- Template Thymeleaf complet
 'fr',
 '["recipientName", "orderNumber", "deliveryDate", "signerName", "signatureUrl", "photoUrls"]'),

-- Delivery Confirmed - Push FR
('DELIVERY_CONFIRMED_PUSH', 'Confirmation de livraison', 'PUSH',
 NULL,
 'Votre livraison {{orderNumber}} a été effectuée. Signature reçue.',
 'fr',
 '["orderNumber"]'),

-- Trip Assigned to Driver - FR
('TRIP_ASSIGNED_PUSH', 'Nouveau trip assigné', 'PUSH',
 NULL,
 'Nouveau trip assigné: {{destination}}. Départ prévu: {{departureTime}}',
 'fr',
 '["destination", "departureTime"]'),

-- ETA Alert - FR
('ETA_30MIN_PUSH', 'ETA 30 minutes', 'PUSH',
 NULL,
 'Votre livraison arrive dans environ 30 minutes',
 'fr',
 '[]'),

('ETA_10MIN_PUSH', 'ETA 10 minutes', 'PUSH',
 NULL,
 'Votre livreur arrive dans quelques minutes',
 'fr',
 '[]');
```

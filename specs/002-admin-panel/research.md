# Research: Admin Panel

**Feature**: 002-admin-panel
**Date**: 2025-12-19
**Status**: Complete

## Research Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| Truck-Group Relationship | Many-to-many via join table | High |
| Password Validation | Spring Validation + custom validator | High |
| Audit Logging | JPA EntityListener + dedicated table | High |
| Email Activation | Async via notification-service + token | High |
| Statistics Aggregation | Native SQL queries with PostGIS | High |
| User-Group Assignment | Join table in auth-service | High |

---

## 1. Truck Many-to-Many Groups Migration

### Decision
Migrate from single `truck_group_id` FK to many-to-many relationship via `truck_group_assignments` join table.

### Rationale
- Spec requirement FR-018: "un camion peut appartenir à plusieurs groupes"
- Current model has `truckGroupId UUID` (one-to-one)
- Many-to-many enables flexible fleet segmentation (by region, client, mission type)

### Implementation
```sql
-- New join table
CREATE TABLE truck_group_assignments (
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    truck_group_id UUID NOT NULL REFERENCES truck_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (truck_id, truck_group_id)
);

-- Migration: copy existing assignments
INSERT INTO truck_group_assignments (truck_id, truck_group_id)
SELECT id, truck_group_id FROM trucks WHERE truck_group_id IS NOT NULL;

-- Drop old column after verification
ALTER TABLE trucks DROP COLUMN truck_group_id;
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Keep single group | Doesn't meet spec requirements |
| Array column | Poor query performance, no referential integrity |

---

## 2. Password Policy Implementation

### Decision
Use Bean Validation with custom `@ValidPassword` annotation.

### Rationale
- Spec FR-001a: "minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre"
- Bean Validation integrates with Spring MVC validation
- Reusable across DTOs
- Clear error messages for each rule

### Implementation
```java
@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface ValidPassword {
    String message() default "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    private static final Pattern PATTERN = Pattern.compile(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return false;
        return PATTERN.matcher(value).matches();
    }
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Passay library | Overkill for simple rules, adds dependency |
| Controller-level validation | Not reusable, violates DRY |

---

## 3. Audit Logging Pattern

### Decision
JPA EntityListener with dedicated `audit_logs` table per service.

### Rationale
- Spec FR-005: "journaliser toutes les actions administratives (qui, quoi, quand)"
- Spec FR-005a: "90 jours minimum avec possibilité d'archivage"
- EntityListener automatically captures entity changes
- Separate table enables retention policies without affecting main tables

### Implementation
```java
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private AuditAction action; // CREATE, UPDATE, DELETE, DEACTIVATE, REACTIVATE

    private String entityType;  // "USER", "TRUCK", "CONFIG"
    private UUID entityId;
    private UUID userId;        // Admin who performed action

    @Column(columnDefinition = "jsonb")
    private String changes;     // JSON diff of changed fields

    private Instant timestamp;
}
```

### Retention Strategy
```sql
-- Scheduled job (pg_cron or application scheduler)
-- Archive to cold storage before deletion
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Kafka audit topic | Additional complexity, not queryable for admin UI |
| Hibernate Envers | Heavy, creates shadow tables for all entities |
| Spring Data Auditing | Only tracks created_by/updated_by, not full changes |

---

## 4. Email Activation Flow

### Decision
Async email via notification-service with JWT activation token.

### Rationale
- Spec FR-024: "envoyer un email d'activation lors de la création d'un utilisateur"
- Spec FR-025: "réessayer 3 fois puis notifier l'admin"
- Reuse existing notification-service infrastructure
- JWT token avoids database lookup for activation

### Implementation Flow
```
1. Admin creates user → User saved with isActive=false
2. Auth-service generates activation JWT (24h expiry, contains userId)
3. Auth-service publishes EmailRequest to Kafka topic
4. Notification-service consumes, sends email via SMTP
5. On failure: retry 3x with exponential backoff
6. After 3 failures: publish AdminNotification event
7. User clicks link → Frontend calls /auth/v1/activate?token=xxx
8. Auth-service validates JWT, sets isActive=true
```

### Token Structure
```java
// Activation token payload
{
  "sub": "user-uuid",
  "type": "activation",
  "exp": 1703030400  // 24h from creation
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Database token | Requires cleanup job, additional queries |
| Synchronous email | Blocks user creation, poor UX |
| Magic link (passwordless) | Different flow, not what spec requires |

---

## 5. Fleet Statistics Aggregation

### Decision
Native SQL queries with PostGIS functions, on-demand calculation.

### Rationale
- Spec FR-010 to FR-013: Various statistics by period
- Spec SC-003: "charge et affiche les données en moins de 3 secondes"
- PostGIS already available for spatial queries
- Native SQL more efficient than JPA for aggregations
- On-demand avoids stale data issues

### Implementation
```java
@Repository
public interface FleetStatisticsRepository {

    @Query(value = """
        SELECT
            COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count,
            COUNT(*) FILTER (WHERE status = 'IDLE') as idle_count,
            COUNT(*) FILTER (WHERE status = 'OFFLINE') as offline_count,
            COUNT(*) FILTER (WHERE status = 'OUT_OF_SERVICE') as out_of_service_count
        FROM trucks
        WHERE (:groupIds IS NULL OR id IN (
            SELECT truck_id FROM truck_group_assignments WHERE truck_group_id = ANY(:groupIds)
        ))
        """, nativeQuery = true)
    TruckStatusCounts getTruckStatusCounts(@Param("groupIds") UUID[] groupIds);

    @Query(value = """
        SELECT COALESCE(SUM(
            ST_DistanceSphere(
                ST_MakePoint(p1.longitude, p1.latitude),
                ST_MakePoint(p2.longitude, p2.latitude)
            )
        ) / 1000, 0) as total_km
        FROM gps_positions p1
        JOIN gps_positions p2 ON p1.truck_id = p2.truck_id
            AND p2.timestamp = (
                SELECT MIN(timestamp) FROM gps_positions
                WHERE truck_id = p1.truck_id AND timestamp > p1.timestamp
            )
        WHERE p1.timestamp BETWEEN :startDate AND :endDate
        """, nativeQuery = true)
    BigDecimal getTotalKilometers(@Param("startDate") Instant start, @Param("endDate") Instant end);
}
```

### Performance Optimization
- Index on `gps_positions(truck_id, timestamp)`
- Partition `gps_positions` by month (already exists)
- Add materialized views if >3s response time observed

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pre-aggregated tables | Added complexity, stale data risk |
| Redis caching | Spec says V1 on-demand; add if needed |
| Kafka Streams aggregation | Overkill for admin dashboard frequency |

---

## 6. User-Group Assignment

### Decision
Join table `user_group_assignments` in auth-service database.

### Rationale
- Spec FR-019: "permettre l'assignation d'utilisateurs à des groupes"
- Spec FR-020: "filtrer automatiquement la visibilité des camions selon les groupes"
- Users are in auth-service, groups are in location-service
- Cross-service query needed for filtering

### Implementation
```sql
-- In auth-service database
CREATE TABLE user_group_assignments (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    truck_group_id UUID NOT NULL,  -- References location-service, no FK
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, truck_group_id)
);
```

### Cross-Service Query Pattern
```java
// In location-service: get trucks for user
@GetMapping("/trucks")
public Page<TruckResponse> getTrucks(Authentication auth) {
    UUID userId = extractUserId(auth);
    UserRole role = extractRole(auth);

    if (role == ADMIN) {
        return truckService.findAll(pageable);
    }

    // Call auth-service to get user's groups
    List<UUID> groupIds = authClient.getUserGroups(userId);
    return truckService.findByGroupIds(groupIds, pageable);
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Duplicate groups in auth-service | Data inconsistency risk |
| Groups in shared database | Violates microservice data isolation |
| JWT claims with groups | Token size issues with many groups |

---

## Dependencies Identified

| Dependency | Version | Purpose |
|------------|---------|---------|
| spring-boot-starter-mail | 3.2.1 | Email sending (already in notification-service) |
| spring-boot-starter-validation | 3.2.1 | Bean validation (already present) |
| @angular/material | 17.x | Admin UI components |
| @angular/cdk | 17.x | CDK for tables, dialogs |

No new dependencies required - all capabilities exist in current stack.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stats query slow on large dataset | Medium | High | Add indexes, consider materialized views |
| Email delivery failures | Low | Medium | Retry mechanism + admin notification |
| Cross-service group sync | Low | Medium | Eventually consistent, cache in JWT |
| Many-to-many migration data loss | Low | High | Backup before migration, test on staging |

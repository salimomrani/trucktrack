# Truck Track - Best Practices Guide

Ce document définit les best practices pour le développement frontend (Angular) et backend (Spring Boot) du projet Truck Track.

## Table des matières
- [Frontend - Angular](#frontend---angular)
- [Backend - Spring Boot](#backend---spring-boot)
- [Exemples de refactoring](#exemples-de-refactoring)

---

## Frontend - Angular

### 1. Signals (Angular 16+)

**✅ À FAIRE** : Utiliser les signals pour l'état réactif au lieu des observables classiques

```typescript
// ❌ AVANT (ancien pattern avec BehaviorSubject)
export class TruckService {
  private trucksSubject = new BehaviorSubject<Truck[]>([]);
  trucks$ = this.trucksSubject.asObservable();

  loadTrucks() {
    this.http.get<Truck[]>('/api/trucks').subscribe(trucks => {
      this.trucksSubject.next(trucks);
    });
  }
}

// ✅ APRÈS (avec signals)
export class TruckService {
  private trucksSignal = signal<Truck[]>([]);
  trucks = this.trucksSignal.asReadonly();

  loadTrucks() {
    this.http.get<Truck[]>('/api/trucks').subscribe(trucks => {
      this.trucksSignal.set(trucks);
    });
  }

  // Computed values automatiquement mis à jour
  activeTrucks = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.ACTIVE)
  );

  truckCount = computed(() => this.trucks().length);
}
```

### 2. Input Signals (Angular 17+)

**✅ À FAIRE** : Utiliser `input()` au lieu de `@Input()` classiques

```typescript
// ❌ AVANT
@Component({...})
export class TruckMarkerComponent {
  @Input() truck!: Truck;
  @Input() showDetails = false;
}

// ✅ APRÈS
@Component({...})
export class TruckMarkerComponent {
  // Input requis
  truck = input.required<Truck>();

  // Input optionnel avec valeur par défaut
  showDetails = input(false);

  // Computed basé sur l'input
  statusColor = computed(() => {
    const status = this.truck().status;
    return status === TruckStatus.ACTIVE ? 'green' : 'gray';
  });
}
```

### 3. inject() au lieu de Constructor DI

**✅ À FAIRE** : Utiliser la fonction `inject()` pour une injection de dépendances plus moderne

```typescript
// ❌ AVANT
@Component({...})
export class MapComponent {
  constructor(
    private truckService: TruckService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {}
}

// ✅ APRÈS
@Component({...})
export class MapComponent {
  private truckService = inject(TruckService);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  // Plus concis, meilleure lisibilité
}
```

### 4. OnPush Change Detection

**✅ À FAIRE** : Toujours utiliser `ChangeDetectionStrategy.OnPush` pour de meilleures performances

```typescript
@Component({
  selector: 'app-truck-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ Ajoutez ceci
  template: `...`
})
export class TruckCardComponent {
  truck = input.required<Truck>();  // Les signals fonctionnent parfaitement avec OnPush
}
```

### 5. Effect pour les side-effects

**✅ À FAIRE** : Utiliser `effect()` pour les side-effects basés sur les signals

```typescript
export class MapComponent {
  private trucks = signal<Truck[]>([]);
  private map!: L.Map;

  constructor() {
    // Réagit automatiquement aux changements de trucks
    effect(() => {
      const currentTrucks = this.trucks();
      this.updateMapMarkers(currentTrucks);
    });
  }

  private updateMapMarkers(trucks: Truck[]) {
    // Mise à jour de la carte
  }
}
```

### 6. Resource API (Angular 19+)

**✅ À FAIRE** : Utiliser l'API `resource()` pour les chargements asynchrones

```typescript
export class TruckListComponent {
  private http = inject(HttpClient);

  trucks = resource({
    loader: () => this.http.get<Truck[]>('/api/trucks')
  });

  // Accès facile au statut
  isLoading = this.trucks.isLoading;
  error = this.trucks.error;
  data = this.trucks.value;
}
```

---

## Backend - Spring Boot

### 1. Lombok pour les entités JPA

**✅ À FAIRE** : Utiliser Lombok pour réduire le boilerplate

```java
// ❌ AVANT (getters/setters manuels - 224 lignes)
@Entity
@Table(name = "trucks")
public class Truck {
    private UUID id;
    private String truckId;
    // ... 10+ champs

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    // ... 20+ getters/setters
}

// ✅ APRÈS (Lombok - beaucoup plus concis)
@Entity
@Table(name = "trucks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"truckGroupId"})  // Éviter les références circulaires
public class Truck {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    private String truckId;

    private String licensePlate;
    private String driverName;

    @Convert(converter = TruckStatusConverter.class)
    private TruckStatus status;

    // ... autres champs

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
```

**Annotations Lombok recommandées :**
- `@Getter` / `@Setter` : Génère les getters/setters
- `@NoArgsConstructor` : Constructeur sans arguments (requis par JPA)
- `@AllArgsConstructor` : Constructeur avec tous les arguments
- `@Builder` : Pattern builder pour construire des objets
- `@ToString` : Génère toString()
- `@EqualsAndHashCode` : Génère equals() et hashCode()
- `@Data` : Combine @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor

### 2. Records Java pour les DTOs

**✅ À FAIRE** : Utiliser les Records pour les DTOs immuables

```java
// ❌ AVANT (classe classique)
public class TruckDTO {
    private UUID id;
    private String truckId;
    private TruckStatus status;
    private Double currentLatitude;
    private Double currentLongitude;

    // Constructors, getters, setters, equals, hashCode, toString...
}

// ✅ APRÈS (Record Java - concis et immuable)
public record TruckDTO(
    UUID id,
    String truckId,
    TruckStatus status,
    Double currentLatitude,
    Double currentLongitude,
    Instant lastUpdate
) {
    // Méthodes custom si nécessaire
    public boolean isActive() {
        return status == TruckStatus.ACTIVE;
    }
}
```

### 3. Records + @Builder de Lombok

**✅ À FAIRE** : Combiner Records avec @Builder pour avoir un builder pattern

```java
import lombok.Builder;

@Builder  // ✅ Ajoute le pattern builder au Record
public record GPSPositionEventDTO(
    String eventId,
    String truckId,
    String truckIdReadable,
    Double latitude,
    Double longitude,
    Double speed,
    Integer heading,
    Instant timestamp
) {
    // Usage:
    // var event = GPSPositionEventDTO.builder()
    //     .eventId(UUID.randomUUID().toString())
    //     .truckId("TRUCK-001")
    //     .latitude(37.7749)
    //     .longitude(-122.4194)
    //     .build();
}
```

### 4. Constructor-based Dependency Injection

**✅ À FAIRE** : Utiliser l'injection par constructeur (moderne, testé facilement)

```java
// ❌ AVANT (field injection - difficile à tester)
@Service
public class LocationService {
    @Autowired
    private TruckRepository truckRepository;

    @Autowired
    private RedisCacheService redisCacheService;
}

// ✅ APRÈS (constructor injection avec Lombok)
@Service
@RequiredArgsConstructor  // Lombok génère le constructeur
public class LocationService {
    private final TruckRepository truckRepository;
    private final RedisCacheService redisCacheService;

    // Lombok génère automatiquement:
    // public LocationService(TruckRepository repo, RedisCacheService cache) {
    //     this.truckRepository = repo;
    //     this.redisCacheService = cache;
    // }
}
```

### 5. Validation avec Bean Validation

**✅ À FAIRE** : Utiliser Bean Validation sur les Records

```java
import jakarta.validation.constraints.*;

public record CreateTruckRequest(
    @NotBlank(message = "Truck ID is required")
    @Size(max = 50, message = "Truck ID must not exceed 50 characters")
    String truckId,

    @NotNull(message = "Truck group ID is required")
    UUID truckGroupId,

    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Invalid license plate format")
    String licensePlate,

    @Email(message = "Invalid driver email")
    String driverEmail
) {}

// Dans le controller
@PostMapping("/trucks")
public ResponseEntity<Truck> createTruck(@Valid @RequestBody CreateTruckRequest request) {
    // Si validation échoue, Spring retourne automatiquement 400 Bad Request
}
```

### 6. Slf4j avec Lombok

**✅ À FAIRE** : Utiliser `@Slf4j` pour le logging

```java
// ❌ AVANT
@Service
public class LocationService {
    private static final Logger logger = LoggerFactory.getLogger(LocationService.class);

    public void processGPS(GPSEvent event) {
        logger.info("Processing GPS event: {}", event);
    }
}

// ✅ APRÈS
@Slf4j  // Génère automatiquement: private static final Logger log = ...
@Service
@RequiredArgsConstructor
public class LocationService {
    public void processGPS(GPSEvent event) {
        log.info("Processing GPS event: {}", event);
    }
}
```

---

## Exemples de refactoring

### Exemple 1 : Refactoring du MapComponent (Angular)

**AVANT :**
```typescript
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './map.component.html'
})
export class MapComponent implements OnInit, OnDestroy {
  trucks: Truck[] = [];
  isLoading = true;
  private positionSubscription?: Subscription;

  constructor(
    private truckService: TruckService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadTrucks();
  }

  loadTrucks(): void {
    this.truckService.getActiveTrucks().subscribe(trucks => {
      this.trucks = trucks;
      this.isLoading = false;
    });
  }
}
```

**APRÈS (Best Practices) :**
```typescript
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush  // ✅ OnPush
})
export class MapComponent {
  // ✅ inject() au lieu de constructor
  private truckService = inject(TruckService);
  private webSocketService = inject(WebSocketService);

  // ✅ Signals au lieu de propriétés classiques
  trucks = signal<Truck[]>([]);
  isLoading = signal(true);
  isConnected = signal(false);

  // ✅ Computed values
  activeTrucks = computed(() =>
    this.trucks().filter(t => t.status === TruckStatus.ACTIVE)
  );

  truckCount = computed(() => this.trucks().length);

  constructor() {
    // ✅ Effect pour charger les données automatiquement
    effect(() => {
      this.loadTrucks();
    }, { allowSignalWrites: true });

    // ✅ Effect pour mettre à jour la carte
    effect(() => {
      const currentTrucks = this.trucks();
      this.updateMapMarkers(currentTrucks);
    });
  }

  private loadTrucks(): void {
    this.truckService.getActiveTrucks().subscribe(response => {
      this.trucks.set(response.content || []);
      this.isLoading.set(false);
    });
  }

  private updateMapMarkers(trucks: Truck[]): void {
    // Mise à jour des markers
  }
}
```

### Exemple 2 : Refactoring du Truck Entity (Spring Boot)

**AVANT (code actuel - 224 lignes) :**
```java
@Entity
@Table(name = "trucks")
public class Truck {
    @Id
    private UUID id;
    private String truckId;
    // ... 10+ champs

    public Truck() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    // ... 20+ getters/setters (100+ lignes de boilerplate)
}
```

**APRÈS (avec Lombok - ~40 lignes) :**
```java
@Entity
@Table(name = "trucks", indexes = {
    @Index(name = "idx_trucks_truck_id", columnList = "truck_id"),
    @Index(name = "idx_trucks_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"truckGroupId"})
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Truck ID is required")
    @Size(max = 50)
    @Column(name = "truck_id", unique = true, nullable = false)
    private String truckId;

    @Column(name = "license_plate", length = 100)
    private String licensePlate;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Convert(converter = TruckStatusConverter.class)
    @Column(name = "status", nullable = false)
    private TruckStatus status;

    @Column(name = "current_latitude", precision = 10, scale = 8)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 11, scale = 8)
    private BigDecimal currentLongitude;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    // Plus besoin de getters/setters - Lombok les génère !
}
```

### Exemple 3 : DTOs avec Records

**Créer un nouveau fichier pour les DTOs :**

```java
package com.trucktrack.location.dto;

import lombok.Builder;
import jakarta.validation.constraints.*;
import com.trucktrack.location.model.TruckStatus;
import java.util.UUID;
import java.time.Instant;

/**
 * DTO pour les réponses API contenant les infos du truck
 */
@Builder
public record TruckResponseDTO(
    UUID id,
    String truckId,
    String licensePlate,
    String driverName,
    TruckStatus status,
    Double currentLatitude,
    Double currentLongitude,
    Double currentSpeed,
    Instant lastUpdate
) {
    public static TruckResponseDTO fromEntity(Truck truck) {
        return TruckResponseDTO.builder()
            .id(truck.getId())
            .truckId(truck.getTruckId())
            .licensePlate(truck.getLicensePlate())
            .driverName(truck.getDriverName())
            .status(truck.getStatus())
            .currentLatitude(truck.getCurrentLatitude() != null ?
                truck.getCurrentLatitude().doubleValue() : null)
            .currentLongitude(truck.getCurrentLongitude() != null ?
                truck.getCurrentLongitude().doubleValue() : null)
            .currentSpeed(truck.getCurrentSpeed() != null ?
                truck.getCurrentSpeed().doubleValue() : null)
            .lastUpdate(truck.getLastUpdate())
            .build();
    }
}

/**
 * DTO pour créer un nouveau truck
 */
@Builder
public record CreateTruckRequestDTO(
    @NotBlank(message = "Truck ID is required")
    @Size(max = 50)
    String truckId,

    @NotNull(message = "Truck group ID is required")
    UUID truckGroupId,

    @Size(max = 100)
    String licensePlate,

    @Size(max = 100)
    String driverName,

    @Size(max = 50)
    String vehicleType
) {}
```

---

## Dépendances à ajouter

### Frontend (package.json)
Pas de dépendances supplémentaires - les signals sont natifs dans Angular 16+

### Backend (pom.xml)

```xml
<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- Bean Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

## Checklist pour nouveau code

### ✅ Frontend (Angular)
- [ ] Utiliser `signal()` pour l'état local
- [ ] Utiliser `input()` pour les `@Input`
- [ ] Utiliser `computed()` pour les valeurs dérivées
- [ ] Utiliser `effect()` pour les side-effects
- [ ] Utiliser `inject()` au lieu du constructor DI
- [ ] Ajouter `ChangeDetectionStrategy.OnPush`
- [ ] Composants standalone uniquement
- [ ] Pas d'Observable là où un Signal suffit

### ✅ Backend (Spring Boot)
- [ ] Utiliser `@Getter`, `@Setter`, `@Builder` sur les entités
- [ ] Utiliser `Record` pour les DTOs immuables
- [ ] Utiliser `@Builder` sur les Records
- [ ] Utiliser `@RequiredArgsConstructor` pour l'injection
- [ ] Utiliser `@Slf4j` pour le logging
- [ ] Valider avec `@Valid` et Bean Validation
- [ ] Préférer `final` pour les champs injectés
- [ ] Pas de `@Autowired` - utiliser constructor injection

---

## Migration progressive

1. **Frontend** : Commencer par les nouveaux composants
2. **Backend** : Commencer par les nouveaux DTOs et services
3. Refactorer progressivement les fichiers existants lors des modifications
4. Ne pas tout refactorer d'un coup - risque de régression

---

**Dernière mise à jour :** 2025-12-11

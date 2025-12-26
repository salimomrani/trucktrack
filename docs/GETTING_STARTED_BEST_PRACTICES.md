# Guide de démarrage - Best Practices

Ce guide vous aide à démarrer rapidement avec les best practices du projet Truck Track.

## 📚 Documentation

- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Guide complet des best practices
- Ce fichier - Guide de démarrage rapide

---

## 🚀 Quick Start

### Frontend (Angular)

#### 1. Créer un nouveau composant moderne

```bash
# Générer un composant standalone
ng g c features/my-feature --standalone
```

#### 2. Template de composant avec best practices

```typescript
import { Component, ChangeDetectionStrategy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅
  template: `...`
})
export class MyComponent {
  // ✅ inject() au lieu de constructor
  private myService = inject(MyService);

  // ✅ Signals pour l'état
  items = signal<Item[]>([]);
  isLoading = signal(false);

  // ✅ Computed values
  itemCount = computed(() => this.items().length);

  constructor() {
    // ✅ Effect pour side-effects
    effect(() => {
      console.log('Items changed:', this.items());
    });
  }
}
```

#### 3. Référence rapide

| Ancien | Moderne | Pourquoi |
|--------|---------|----------|
| `@Input() value: string;` | `value = input.required<string>();` | Plus type-safe, réactif |
| `constructor(private svc: Service)` | `private svc = inject(Service);` | Plus concis |
| `items: Item[] = []` | `items = signal<Item[]>([])` | Réactivité granulaire |
| Pas de `changeDetection` | `ChangeDetectionStrategy.OnPush` | Meilleures performances |

### Backend (Spring Boot)

#### 1. Créer une nouvelle entité JPA

```java
@Entity
@Table(name = "my_entities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class MyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    private String name;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
```

#### 2. Créer un DTO avec Record

```java
@Builder
public record MyEntityDTO(
    UUID id,
    String name,
    Instant createdAt
) {
    public static MyEntityDTO fromEntity(MyEntity entity) {
        return MyEntityDTO.builder()
            .id(entity.getId())
            .name(entity.getName())
            .createdAt(entity.getCreatedAt())
            .build();
    }
}
```

#### 3. Créer un Service

```java
@Slf4j  // ✅ Logging automatique
@Service
@RequiredArgsConstructor  // ✅ Constructor injection
public class MyService {

    private final MyRepository repository;

    @Transactional
    public MyEntityDTO create(CreateRequest request) {
        log.info("Creating entity: {}", request.name());

        MyEntity entity = MyEntity.builder()
            .name(request.name())
            .build();

        MyEntity saved = repository.save(entity);
        return MyEntityDTO.fromEntity(saved);
    }
}
```

#### 4. Référence rapide

| Ancien | Moderne | Pourquoi |
|--------|---------|----------|
| Getters/Setters manuels | `@Getter @Setter` | Moins de boilerplate |
| Constructeur manuel | `@RequiredArgsConstructor` | Injection automatique |
| `Logger logger = LoggerFactory.getLogger(...)` | `@Slf4j` | Plus concis |
| Classe DTO classique | Record Java | Immuabilité, concision |
| `@Autowired` | Constructor injection | Meilleure testabilité |

---

## 📁 Structure du projet

### Exemples fournis

Les fichiers suivants sont des exemples de référence :

**Backend :**
- `backend/location-service/src/main/java/com/trucktrack/location/dto/TruckResponseDTO.java`
- `backend/location-service/src/main/java/com/trucktrack/location/dto/CreateTruckRequestDTO.java`
- `backend/location-service/src/main/java/com/trucktrack/location/dto/GPSPositionDTO.java`
- `backend/location-service/src/main/java/com/trucktrack/location/service/TruckServiceExample.java`

**Frontend :**
- `frontend/src/app/examples/truck-list-modern.component.ts`

### Organisation recommandée

```
backend/
├── dto/              # Records pour les DTOs
├── model/            # Entités JPA avec @Getter, @Setter, @Builder
├── service/          # Services avec @Slf4j, @RequiredArgsConstructor
├── controller/       # Controllers REST
└── repository/       # Repositories Spring Data

frontend/
├── features/         # Composants avec signals
├── services/         # Services avec inject()
├── models/           # Interfaces TypeScript
└── core/             # Services core, guards, interceptors
```

---

## ✅ Checklist nouveau code

### Frontend

Avant de commit un nouveau composant Angular :

- [ ] `ChangeDetectionStrategy.OnPush` ajouté
- [ ] Utilise `signal()` au lieu de propriétés classiques
- [ ] Utilise `input()` pour les @Input
- [ ] Utilise `computed()` pour les valeurs dérivées
- [ ] Utilise `inject()` au lieu du constructor DI
- [ ] Composant standalone
- [ ] Pas d'Observable là où un Signal suffit

### Backend

Avant de commit une nouvelle classe Java :

- [ ] Entités JPA : `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
- [ ] DTOs : Record Java avec `@Builder`
- [ ] Services : `@Slf4j`, `@RequiredArgsConstructor`
- [ ] Champs injectés sont `final`
- [ ] Pas de `@Autowired`
- [ ] Validation avec `@Valid` et Bean Validation
- [ ] `@Transactional` sur les méthodes qui modifient les données

---

## 🔧 Configuration IDE

### IntelliJ IDEA

1. **Installer le plugin Lombok**
   - File → Settings → Plugins
   - Rechercher "Lombok"
   - Installer et redémarrer

2. **Activer le traitement des annotations**
   - File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
   - Cocher "Enable annotation processing"

3. **Angular Language Service**
   - Déjà activé par défaut dans les versions récentes

### VS Code

1. **Extensions recommandées**
   ```json
   {
     "recommendations": [
       "angular.ng-template",
       "vscjava.vscode-java-pack",
       "gabrielbb.vscode-lombok"
     ]
   }
   ```

2. **Settings.json**
   ```json
   {
     "java.completion.favoriteStaticMembers": [
       "lombok.AccessLevel.*"
     ]
   }
   ```

---

## 📖 Exemples d'utilisation

### Exemple 1 : Builder Pattern avec Records

```java
// Créer un DTO avec le builder
var dto = TruckResponseDTO.builder()
    .id(UUID.randomUUID())
    .truckId("TRUCK-001")
    .status(TruckStatus.ACTIVE)
    .currentLatitude(37.7749)
    .currentLongitude(-122.4194)
    .build();
```

### Exemple 2 : Signals avec Computed Values

```typescript
// Service
export class TruckService {
  private trucksSignal = signal<Truck[]>([]);
  trucks = this.trucksSignal.asReadonly();

  // Computed automatiquement mis à jour
  activeTrucks = computed(() =>
    this.trucks().filter(t => t.status === 'ACTIVE')
  );

  loadTrucks() {
    this.http.get<Truck[]>('/api/trucks').subscribe(trucks => {
      this.trucksSignal.set(trucks);
      // activeTrucks() est automatiquement recalculé !
    });
  }
}
```

### Exemple 3 : Input Signals

```typescript
@Component({...})
export class TruckCardComponent {
  // Input requis
  truck = input.required<Truck>();

  // Input optionnel avec défaut
  showDetails = input(false);

  // Computed basé sur les inputs
  statusColor = computed(() => {
    const status = this.truck().status;
    return status === 'ACTIVE' ? 'green' : 'gray';
  });
}

// Usage dans le parent
<app-truck-card
  [truck]="myTruck"
  [showDetails]="true" />
```

---

## 🎯 Migration progressive

### Stratégie recommandée

1. **Phase 1** : Nouveau code uniquement
   - Tous les nouveaux composants/services utilisent les best practices
   - Pas de refactoring du code existant

2. **Phase 2** : Refactoring opportuniste
   - Lors de modifications de fichiers existants
   - Appliquer les best practices si le changement est simple

3. **Phase 3** : Refactoring planifié (optionnel)
   - Identifier les fichiers critiques
   - Planifier des sessions de refactoring

### Priorités de refactoring

1. **Backend** : DTOs → Services → Controllers → Entities
2. **Frontend** : Services → Nouveaux composants → Composants existants

---

## 🆘 FAQ

### Backend

**Q : Puis-je utiliser @Data de Lombok ?**
R : Oui, mais préférez `@Getter + @Setter + @ToString` pour plus de contrôle. `@Data` combine plusieurs annotations mais peut causer des problèmes avec JPA (génère equals/hashCode sur tous les champs).

**Q : Quand utiliser Record vs classe classique ?**
R : Records pour les DTOs immuables. Classes avec Lombok pour les entités JPA qui doivent être mutables.

**Q : @Builder fonctionne avec les Records ?**
R : Oui ! Lombok génère un builder pour les Records. Ajoutez juste `@Builder` au-dessus du record.

### Frontend

**Q : Dois-je toujours utiliser OnPush ?**
R : Oui, surtout avec les signals. OnPush + signals = performances optimales.

**Q : Puis-je mélanger Observables et Signals ?**
R : Oui, mais convertissez les Observables en signals quand c'est possible avec `toSignal()`.

**Q : Comment tester les composants avec signals ?**
R : Les signals fonctionnent parfaitement dans les tests. Utilisez `signal()` pour créer des mocks.

---

## 📚 Ressources

### Documentation officielle

- **Angular Signals** : https://angular.dev/guide/signals
- **Java Records** : https://docs.oracle.com/en/java/javase/17/language/records.html
- **Lombok** : https://projectlombok.org/features/
- **Spring Boot** : https://spring.io/guides

### Articles recommandés

- Angular Signals Deep Dive
- Java Records Best Practices
- Lombok Pitfalls to Avoid

---

**Dernière mise à jour :** 2025-12-11

Pour toute question, consultez [BEST_PRACTICES.md](./BEST_PRACTICES.md) ou demandez à l'équipe !

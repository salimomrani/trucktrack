# Research: Angular 21 Migration

**Feature**: 005-angular-21-migration
**Date**: 2025-12-23
**Status**: Complete

## Executive Summary

La migration de Angular 17 vers Angular 21 est faisable via la procédure officielle `ng update`. Les principales décisions techniques ont été prises en faveur de l'approche incrémentale recommandée par l'équipe Angular.

## Research Findings

### 1. Migration Path Analysis

**Decision**: Migration incrémentale 17 → 18 → 19 → 20 → 21

**Rationale**:
- Angular ne supporte pas les sauts de version majeure (17 → 21 direct impossible)
- Chaque version a ses propres schematics de migration automatique
- Permet de valider à chaque étape et de rollback si nécessaire

**Alternatives Considered**:
- Migration directe (rejet: non supporté officiellement, risque élevé)
- Réécriture complète (rejet: coût prohibitif, aucune valeur ajoutée)

### 2. Zoneless Change Detection

**Decision**: Activer zoneless change detection par défaut en Angular 21

**Rationale**:
- Performance améliorée (moins de cycles de change detection)
- Bundle size réduit (zone.js n'est plus inclus)
- Comportement par défaut en Angular 21
- Notre codebase utilise déjà les Signals (compatible)

**Alternatives Considered**:
- Conserver zone.js (rejet: perd les bénéfices de performance, va à l'encontre de la direction Angular)
- Mode hybride (rejet: complexité inutile pour notre cas d'usage)

**Risques et Mitigations**:
- Composants third-party incompatibles → Fallback zone.js par composant si nécessaire
- Tests Karma/Jasmine → Utiliser `provideZoneChangeDetection()` dans les tests si nécessaire

### 3. Build System

**Decision**: Adopter @angular/build (Esbuild) comme build system par défaut

**Rationale**:
- Devient le défaut en Angular 19+
- Build times 2-3x plus rapides
- Hot-reload plus rapide
- Meilleure expérience développeur

**Alternatives Considered**:
- Conserver Webpack (rejet: déprécié, performances inférieures)

**Configuration**: Le passage à @angular/build sera automatique via `ng update`

### 4. Angular Material Compatibility

**Decision**: Mettre à jour Angular Material vers la version correspondante à chaque étape

**Rationale**:
- Angular Material suit le versioning d'Angular
- Les schematics de migration gèrent les breaking changes
- Notre usage est standard (pas de customization profonde)

**Breaking Changes Identifiés**:
- v18: Nouveaux composants MDC par défaut
- v19: APIs dépréciées supprimées
- v20: Standalone components encouragés
- v21: Signals intégration

### 5. NgRx Compatibility

**Decision**: Mettre à jour NgRx vers la version correspondante

**Rationale**:
- NgRx suit le versioning d'Angular
- Signal-based state management disponible en v17+
- Notre usage actuel est compatible

**Notes**:
- NgRx Signals store pourrait être adopté post-migration (out of scope)

### 6. Third-Party Dependencies

**Decision**: Vérifier la compatibilité de Leaflet et autres dépendances

**Findings**:
| Dépendance | Status | Notes |
|------------|--------|-------|
| Leaflet 1.9.4 | Compatible | Pas de dépendance Angular |
| @asymmetrik/ngx-leaflet | À vérifier | Peut nécessiter mise à jour |
| RxJS 7.8.x | Compatible | Angular 21 supporte RxJS 7.x |

### 7. Testing Strategy

**Decision**: Maintenir Karma/Jasmine, adapter pour zoneless si nécessaire

**Rationale**:
- Infrastructure de tests existante
- Pas de valeur à migrer vers Jest pendant cette migration
- Focus sur la stabilité

**Adaptations Nécessaires**:
```typescript
// Dans test.ts ou TestBed configuration
TestBed.configureTestingModule({
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
});
```

### 8. Performance Baselines

**Decision**: Capturer les métriques avant migration pour comparaison

**Métriques à Capturer**:
- Temps de build production (`npm run build`)
- Temps de démarrage dev server (`ng serve`)
- Taille des bundles (main.js, vendor.js, styles.css)
- Score Lighthouse

**Outils**:
- Angular CLI analytics
- Lighthouse CI
- Webpack Bundle Analyzer (avant migration)

## Dependency Compatibility Matrix

| Package | Current | Target v18 | Target v19 | Target v20 | Target v21 |
|---------|---------|------------|------------|------------|------------|
| @angular/core | 17.3.0 | 18.x | 19.x | 20.x | 21.0.6 |
| @angular/material | 17.3.10 | 18.x | 19.x | 20.x | 21.x |
| @ngrx/store | 17.2.0 | 18.x | 19.x | 20.x | 21.x |
| typescript | 5.4.2 | 5.4+ | 5.5+ | 5.5+ | 5.6+ |
| rxjs | 7.8.0 | 7.8.x | 7.8.x | 7.8.x | 7.8.x |
| zone.js | 0.14.x | 0.14.x | 0.15.x | optional | removed |

## Migration Commands Reference

```bash
# Per-version upgrade commands
ng update @angular/core@18 @angular/cli@18
ng update @angular/material@18

ng update @angular/core@19 @angular/cli@19
ng update @angular/material@19

ng update @angular/core@20 @angular/cli@20
ng update @angular/material@20

ng update @angular/core@21 @angular/cli@21
ng update @angular/material@21

# NgRx updates (run after Angular updates)
ng update @ngrx/store@18
ng update @ngrx/store@19
ng update @ngrx/store@20
ng update @ngrx/store@21
```

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking change inattendu | Medium | High | Commit à chaque étape, rollback possible |
| Incompatibilité third-party | Low | Medium | Identifier avant migration, alternatives |
| Tests qui échouent | Medium | Medium | Adapter les tests pour zoneless |
| Performance dégradée | Low | High | Baselines avant, monitoring après |

## Conclusion

La migration est faisable avec un risque maîtrisé grâce à:
1. Procédure officielle `ng update`
2. Migration incrémentale avec validation à chaque étape
3. Rollback possible via git
4. Tests existants comme filet de sécurité

**Recommandation**: Procéder avec la migration en suivant le plan incrémental.

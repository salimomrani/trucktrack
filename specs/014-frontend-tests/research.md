# Research: Frontend Unit Tests

**Feature**: 014-frontend-tests
**Date**: 2025-12-27

## Research Questions

### RQ-001: TestBed vs Direct Instantiation for Guards

**Decision**: Use direct instantiation for guards

**Rationale**:
- Guards in Angular 17 are simple functions or classes that take dependencies through constructor injection
- TestBed adds ~100-200ms overhead per test file for module compilation
- Direct instantiation with `jasmine.createSpyObj()` is sufficient for testing guard logic
- Guards don't interact with Angular's change detection or template rendering

**Alternatives Considered**:
| Approach | Pros | Cons |
|----------|------|------|
| TestBed | Closer to runtime environment | Slow (~200ms overhead), unnecessary for pure logic |
| Direct instantiation | Fast, focused | Must manually mock dependencies |
| Standalone test utilities | Balanced | More setup complexity |

**Conclusion**: Direct instantiation provides the best performance-to-coverage ratio for guards.

---

### RQ-002: Testing Services with HttpClient

**Decision**: Use HttpClientTestingModule with TestBed for services that make HTTP calls

**Rationale**:
- `HttpClient` requires Angular's DI system to function properly
- `HttpClientTestingModule` provides `HttpTestingController` for request verification
- Mocking `HttpClient` directly is error-prone and doesn't test actual HTTP behavior
- Angular's testing utilities are well-optimized for this use case

**Alternatives Considered**:
| Approach | Pros | Cons |
|----------|------|------|
| HttpClientTestingModule | Full HTTP mock, request verification | Requires TestBed |
| Direct HttpClient mock | No TestBed | Complex setup, misses actual behavior |
| Fetch API mock | Native | Not using fetch in Angular |

**Conclusion**: TestBed with HttpClientTestingModule is the right choice for HTTP services.

---

### RQ-003: Testing Interceptors

**Decision**: Use TestBed with HttpClientTestingModule and HttpTestingController

**Rationale**:
- Interceptors are deeply integrated with Angular's HTTP pipeline
- Testing requires triggering actual HTTP requests through the interceptor chain
- `HttpTestingController` allows verification of request modification (headers, etc.)
- No practical way to test interceptors without Angular's HTTP testing infrastructure

**Alternatives Considered**:
| Approach | Pros | Cons |
|----------|------|------|
| HttpClientTestingModule | Complete interceptor chain test | Requires TestBed |
| Mock next.handle() | Tests transform logic | Doesn't test integration |
| E2E with real backend | Full integration | Slow, not unit testing |

**Conclusion**: TestBed is required for interceptor testing.

---

### RQ-004: Testing Services Without HTTP (TokenStorage, Permission)

**Decision**: Use direct instantiation without TestBed

**Rationale**:
- `TokenStorageService` uses `localStorage` directly - no Angular DI needed
- `PermissionService` takes dependencies through constructor - can be mocked
- Direct instantiation is 10-50x faster than TestBed setup
- These services contain pure business logic

**Implementation Pattern**:
```typescript
describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
```

**Conclusion**: Direct instantiation is preferred for services without Angular-specific dependencies.

---

### RQ-005: Mock Strategy for Router in Guards

**Decision**: Use `jasmine.createSpyObj()` for Router mock

**Rationale**:
- Guards only use `router.createUrlTree()` or `router.navigate()`
- Full Router instantiation is unnecessary and complex
- SpyObj allows verification of navigation calls
- Pattern is consistent with Angular testing best practices

**Implementation Pattern**:
```typescript
const mockRouter = jasmine.createSpyObj('Router', ['createUrlTree', 'navigate']);
mockRouter.createUrlTree.and.returnValue({} as UrlTree);
```

**Conclusion**: SpyObj provides lightweight, focused mocking for Router.

---

## Summary Table

| Component Type | TestBed Required | Reason |
|----------------|------------------|--------|
| Guards | No | Pure logic, injectable dependencies |
| TokenStorageService | No | Uses localStorage directly |
| PermissionService | No | Pure logic with injected dependencies |
| NavigationService | No | Pure logic, depends on PermissionService |
| AuthService | Yes | Uses HttpClient |
| TruckService | Yes | Uses HttpClient |
| GeofenceService | Yes | Uses HttpClient |
| NotificationService | Yes | Uses HttpClient |
| AuthInterceptor | Yes | Requires HTTP pipeline integration |

## Performance Expectations

| Test Type | Setup Time | Execution Time |
|-----------|------------|----------------|
| Direct instantiation | <5ms | <10ms |
| TestBed (minimal) | ~100ms | <20ms |
| TestBed + HttpClient | ~150ms | <30ms |

**Target**: Total test suite execution < 30 seconds

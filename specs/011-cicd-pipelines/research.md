# Research: DevOps CI/CD Pipelines

**Feature**: 011-cicd-pipelines | **Date**: 2025-12-26

## GitHub Actions Best Practices

### Decision: Workflow Structure
**Choice**: Separate workflows per domain (backend, frontend, mobile, docker)
**Rationale**:
- Enables parallel execution of independent jobs
- Cleaner logs and easier debugging
- Can be triggered independently or combined via `workflow_call`
**Alternatives Considered**:
- Monolithic workflow: Rejected - harder to maintain, slower feedback loops
- Reusable workflows only: Rejected - adds complexity for our scale

### Decision: Caching Strategy
**Choice**: Use GitHub Actions cache with hash-based keys
**Rationale**:
- Maven: `actions/cache` with `~/.m2/repository` and `hashFiles('**/pom.xml')`
- npm: `actions/setup-node` with `cache: 'npm'` (built-in)
- Reduces build time by 50-70%
**Alternatives Considered**:
- No caching: Rejected - significantly slower builds
- Self-hosted runners with persistent cache: Rejected - overkill for current scale

### Decision: Docker Registry
**Choice**: GitHub Container Registry (ghcr.io)
**Rationale**:
- Native integration with GitHub Actions (GITHUB_TOKEN)
- Free for public repos, generous limits for private
- No additional credentials to manage
**Alternatives Considered**:
- Docker Hub: Rejected - rate limits, separate credentials
- AWS ECR: Rejected - adds AWS dependency unnecessarily

### Decision: Test Parallelization
**Choice**: Matrix strategy for backend microservices
**Rationale**:
- Each microservice runs in parallel job
- Fail-fast disabled to get all results
- Total time = slowest service, not sum of all
**Configuration**:
```yaml
strategy:
  fail-fast: false
  matrix:
    service: [api-gateway, auth-service, gps-ingestion-service, location-service, notification-service]
```

### Decision: Branch Protection
**Choice**: Required status checks on PR
**Rationale**:
- Prevents merging broken code
- All test workflows must pass
- Enforces code quality gates
**Implementation**: Configure via GitHub repository settings

## Technical Constraints

### GitHub Actions Limits (Free Tier)
- 2,000 minutes/month for private repos
- 20 concurrent jobs
- 6 hours max job runtime
- 500 MB artifact storage

### Performance Targets
| Pipeline | Target | Notes |
|----------|--------|-------|
| Backend tests | <10 min | Matrix parallel execution |
| Frontend tests | <5 min | Single job |
| Mobile tests | <5 min | Single job |
| Docker build (all) | <15 min | Parallel builds |

## Security Considerations

### Secrets Management
- `GITHUB_TOKEN`: Auto-provided, used for ghcr.io
- No external secrets needed for MVP
- Future: Add SonarQube token for code quality

### Dependency Scanning
- Use `actions/dependency-review-action` for PR checks
- Alerts on vulnerable dependencies
- Non-blocking initially, can make blocking later

## Integration Points

### Trigger Events
| Event | Workflows Triggered |
|-------|-------------------|
| `push` (any branch) | ci-backend, ci-frontend, ci-mobile |
| `pull_request` | All CI workflows |
| `push` (master only) | docker-build |
| `workflow_dispatch` | All (manual trigger) |

### Path Filters
- Backend: `backend/**`, `pom.xml`
- Frontend: `frontend/**`, `package*.json`
- Mobile: `mobile-expo/**`, `package*.json`
- Docker: Triggered only after tests pass on master

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Maven Caching Guide](https://github.com/actions/cache/blob/main/examples.md#java---maven)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

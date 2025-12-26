# Quickstart: CI/CD Pipelines

**Feature**: 011-cicd-pipelines | **Date**: 2025-12-26

## Overview

This guide explains how to use the CI/CD pipelines for TruckTrack.

## Automatic Triggers

### On Every Push
When you push to any branch, these workflows run automatically:
- **ci-backend.yml**: Tests all 5 backend microservices in parallel
- **ci-frontend.yml**: Tests Angular frontend with coverage
- **ci-mobile.yml**: Tests Expo mobile app

### On Pull Request
All CI workflows run and must pass before merging.

### On Merge to Master
After tests pass on master:
- **docker-build.yml**: Builds and pushes Docker images to ghcr.io

## Manual Triggers

All workflows support manual execution via GitHub Actions UI:

1. Go to **Actions** tab in GitHub
2. Select the workflow (e.g., "Backend Tests")
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Viewing Results

### Test Results
- Navigate to **Actions** tab
- Click on the workflow run
- Expand job details to see test output
- Download artifacts (coverage reports) from bottom of page

### Coverage Reports
Coverage reports are uploaded as artifacts:
- `backend-coverage-{service}`: JaCoCo reports per microservice
- `frontend-coverage`: Jest coverage report
- `mobile-coverage`: Jest coverage report

## Docker Images

After successful master merge, images are available at:
```
ghcr.io/[owner]/trucktrack-api-gateway:latest
ghcr.io/[owner]/trucktrack-auth-service:latest
ghcr.io/[owner]/trucktrack-gps-ingestion-service:latest
ghcr.io/[owner]/trucktrack-location-service:latest
ghcr.io/[owner]/trucktrack-notification-service:latest
```

Image tags:
- `latest`: Most recent master build
- `sha-{commit}`: Specific commit SHA
- `v{version}`: Release version (if tagged)

## Troubleshooting

### Tests Failing
1. Check the workflow logs for specific failures
2. Run tests locally: `mvn test` (backend) or `npm test` (frontend/mobile)
3. Fix issues and push again

### Cache Issues
If builds are slow or behaving unexpectedly:
1. Go to **Actions** → **Caches**
2. Delete relevant cache entries
3. Re-run the workflow

### Docker Build Fails
1. Ensure Dockerfiles are valid: `docker build .` locally
2. Check for missing dependencies in multi-stage build
3. Verify base image availability

## Status Badges

Add these to your README:
```markdown
![Backend Tests](https://github.com/[owner]/truck_track/actions/workflows/ci-backend.yml/badge.svg)
![Frontend Tests](https://github.com/[owner]/truck_track/actions/workflows/ci-frontend.yml/badge.svg)
![Mobile Tests](https://github.com/[owner]/truck_track/actions/workflows/ci-mobile.yml/badge.svg)
![Docker Build](https://github.com/[owner]/truck_track/actions/workflows/docker-build.yml/badge.svg)
```

## Local Development

The CI pipelines mirror local development commands:

| Pipeline | Local Command |
|----------|---------------|
| Backend tests | `cd backend && mvn test` |
| Frontend tests | `cd frontend && npm test` |
| Mobile tests | `cd mobile-expo && npm test` |
| Docker build | `docker build -t service-name backend/service-name` |

## Next Steps

After CI/CD is set up:
1. Configure branch protection rules in GitHub settings
2. Add required status checks for PRs
3. Consider adding SonarQube for code quality analysis
4. Plan deployment pipelines (future feature)

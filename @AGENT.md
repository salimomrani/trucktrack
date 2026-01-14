# TruckTrack - Agent Build Instructions

## Project Setup

### Prerequisites
- Java 17 (OpenJDK or Oracle JDK)
- Node.js 18+ and npm 9+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+
- Apache Kafka 3.6+
- Docker & Docker Compose (optional, for local infra)

### Backend Setup
```bash
# Install dependencies and build all services
cd backend
mvn clean install -DskipTests

# Build specific service
mvn clean install -pl location-service -DskipTests
```

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start
# App runs at http://localhost:4200
```

### Mobile Setup (Expo)
```bash
cd mobile-expo
npm install
npx expo start
```

## Running Tests

### Backend Tests
```bash
# Run all backend tests
cd backend
mvn test

# Run tests for specific service
mvn test -pl location-service
mvn test -pl auth-service
mvn test -pl notification-service

# Run with coverage report
mvn test jacoco:report -pl location-service
# Report: backend/location-service/target/site/jacoco/index.html
```

### Frontend Tests
```bash
cd frontend

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci

# Run with coverage
npm run test:ci -- --code-coverage
# Report: frontend/coverage/index.html
```

### Lint
```bash
cd frontend
npm run lint
npm run lint:fix  # Auto-fix issues
```

## Build Commands

### Backend Production Build
```bash
cd backend
mvn clean package -DskipTests

# Build Docker images (if configured)
mvn spring-boot:build-image -pl api-gateway
```

### Frontend Production Build
```bash
cd frontend
npm run build
# Output: frontend/dist/frontend/
```

### Mobile Production Build
```bash
cd mobile-expo
npx expo build:android  # or build:ios
# Or use EAS Build
npx eas build --platform android
```

## Development Servers

### Start Backend Services
```bash
# Start each service (in separate terminals or use IDE)
cd backend/api-gateway && mvn spring-boot:run
cd backend/auth-service && mvn spring-boot:run
cd backend/location-service && mvn spring-boot:run
cd backend/notification-service && mvn spring-boot:run
cd backend/gps-ingestion-service && mvn spring-boot:run

# Services run on:
# - API Gateway: http://localhost:8080
# - Auth Service: http://localhost:8081
# - Location Service: http://localhost:8082
# - Notification Service: http://localhost:8083
# - GPS Ingestion: http://localhost:8084
```

### Start Frontend
```bash
cd frontend
npm start
# Runs at http://localhost:4200
# Proxies API calls to http://localhost:8080
```

## Database

### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE trucktrack;

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Run Migrations
Flyway migrations run automatically on service startup.
Manual run:
```bash
cd backend/location-service
mvn flyway:migrate
```

## Key Learnings

### Fast Test Cycle
```bash
# Backend: Test single class
mvn test -pl location-service -Dtest=DashboardServiceTest

# Frontend: Test single file
npm test -- --include=**/dashboard*.spec.ts
```

### Common Issues

1. **Port already in use**: Kill existing process or change port in application.yml
2. **Kafka not available**: Services start without Kafka but GPS ingestion won't work
3. **Redis connection refused**: Check Redis is running, or disable cache in dev profile

### Angular Build Optimization
```bash
# Analyze bundle size
npm run build -- --stats-json
npx webpack-bundle-analyzer frontend/dist/frontend/stats.json
```

## Feature Development Quality Standards

### Testing Requirements
- **Backend**: 70% coverage minimum per service
- **Frontend**: 80% coverage for critical components
- All tests must pass before merging

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit with conventional format
git commit -m "feat(location): add dashboard caching"

# Push and create PR
git push -u origin feature/my-feature
gh pr create --title "feat: dashboard caching" --body "..."
```

### Commit Message Format
- `feat(scope):` New feature
- `fix(scope):` Bug fix
- `docs(scope):` Documentation
- `test(scope):` Tests
- `refactor(scope):` Code refactoring
- `perf(scope):` Performance improvement

### Before Marking Task Complete
- [ ] All tests pass
- [ ] Code coverage meets threshold
- [ ] Lint passes with no errors
- [ ] Changes committed with proper message
- [ ] PR created (if applicable)
- [ ] @fix_plan.md updated

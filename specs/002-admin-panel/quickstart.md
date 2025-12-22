# Quickstart Guide: Admin Panel

**Feature**: 002-admin-panel
**Date**: 2025-12-19

## Prerequisites

- [x] Docker running (`docker ps` works)
- [x] Java 17+ (`java -version`)
- [x] Node 18+ (`node --version`)
- [x] PostgreSQL client (`psql --version`)

## Development Setup

### 1. Start Infrastructure

```bash
cd /Users/salimomrani/code/java/kafka/truck_track
./start-all.sh
```

Verify services:
```bash
./status.sh
# All services should be UP
```

### 2. Run Database Migrations

After implementing the new migrations, apply them:

```bash
cd backend
JAVA_HOME=/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home \
mvn flyway:migrate -P local
```

### 3. Start Backend Services

```bash
# Terminal 1: Auth Service (handles user admin)
cd backend/auth-service
JAVA_HOME=/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home \
mvn spring-boot:run

# Terminal 2: Location Service (handles trucks/groups/config/stats)
cd backend/location-service
JAVA_HOME=/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home \
mvn spring-boot:run
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm start
```

Access: http://localhost:4200

---

## Implementation Order

### Phase 1: Backend Foundation

1. **Database Migrations** (location-service + auth-service)
   - `V20__add_user_group_assignments.sql`
   - `V21__add_audit_logs.sql` (auth)
   - `V22__migrate_truck_groups.sql`
   - `V23__add_system_config.sql`
   - `V24__add_location_audit_logs.sql`

2. **Shared Module**
   - `PageResponse<T>` DTO
   - `AuditEvent` Kafka event

3. **Auth Service Admin APIs**
   - `AdminUserController`
   - `AdminUserService`
   - `AuditService`
   - Password validator

4. **Location Service Admin APIs**
   - `AdminTruckController`
   - `AdminGroupController`
   - `AdminConfigController`
   - `AdminStatsController`

### Phase 2: Frontend

5. **Admin Module Setup**
   - Lazy-loaded module
   - Admin guard
   - Admin routing

6. **User Management Pages**
   - User list with pagination
   - User create/edit form
   - Group assignment

7. **Truck Management Pages**
   - Truck list
   - Truck create/edit form
   - Group assignment

8. **Configuration & Dashboard**
   - Config page
   - Statistics dashboard

---

## API Testing

### Get Auth Token

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trucktrack.com","password":"AdminPass123!"}' \
  | jq -r '.token')
```

### Test User Admin Endpoints

```bash
# List users
curl http://localhost:8000/auth/v1/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Create user
curl -X POST http://localhost:8000/auth/v1/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "VIEWER"
  }'
```

### Test Truck Admin Endpoints

```bash
# List trucks
curl http://localhost:8000/location/v1/admin/trucks \
  -H "Authorization: Bearer $TOKEN"

# Create truck
curl -X POST http://localhost:8000/location/v1/admin/trucks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "TRUCK-001",
    "licensePlate": "ABC-123",
    "vehicleType": "Semi-trailer"
  }'
```

### Test Statistics

```bash
# Dashboard stats
curl "http://localhost:8000/location/v1/admin/stats/dashboard?period=WEEK" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Key Files Reference

### Backend - Auth Service

| File | Purpose |
|------|---------|
| `model/User.java` | Existing - no changes needed |
| `model/UserGroupAssignment.java` | NEW - join table entity |
| `model/AuditLog.java` | NEW - audit logging |
| `controller/AdminUserController.java` | NEW - user CRUD |
| `service/AdminUserService.java` | NEW - business logic |
| `service/AuditService.java` | NEW - audit logging |
| `dto/CreateUserRequest.java` | NEW - user creation |
| `validator/ValidPassword.java` | NEW - password validation |

### Backend - Location Service

| File | Purpose |
|------|---------|
| `model/Truck.java` | MODIFY - remove truckGroupId |
| `model/TruckGroupAssignment.java` | NEW - many-to-many |
| `model/SystemConfig.java` | NEW - configuration |
| `model/ConfigHistory.java` | NEW - config audit |
| `model/AuditLog.java` | NEW - audit logging |
| `controller/AdminTruckController.java` | NEW |
| `controller/AdminGroupController.java` | NEW |
| `controller/AdminConfigController.java` | NEW |
| `controller/AdminStatsController.java` | NEW |
| `service/FleetStatisticsService.java` | NEW |
| `repository/FleetStatisticsRepository.java` | NEW - native queries |

### Frontend

| File | Purpose |
|------|---------|
| `admin/admin.module.ts` | NEW - lazy loaded module |
| `admin/admin-routing.module.ts` | NEW - admin routes |
| `core/guards/admin.guard.ts` | NEW - ADMIN role check |
| `admin/users/*` | NEW - user management |
| `admin/trucks/*` | NEW - truck management |
| `admin/groups/*` | NEW - group management |
| `admin/config/*` | NEW - configuration |
| `admin/dashboard/*` | NEW - statistics |

---

## Common Issues

### Migration fails

```bash
# Check current migration version
PGPASSWORD=trucktrack123 psql -h localhost -U trucktrack -d trucktrack -c \
  "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

### API returns 403

- Check user has ADMIN role
- Verify JWT token is not expired
- Check `AdminGuard` configuration

### Stats query slow

- Verify indexes exist on `gps_positions(truck_id, timestamp)`
- Check partition pruning is working
- Consider adding Redis cache

---

## Testing Checklist

- [ ] Create user with valid password → Success
- [ ] Create user with weak password → Validation error
- [ ] Deactivate last admin → Blocked
- [ ] Create truck with duplicate plate → Error
- [ ] Assign truck to multiple groups → Success
- [ ] Dashboard loads in <3s → SC-003
- [ ] All actions logged in audit_logs → FR-005

---

## Next Steps

After implementation, run:
```bash
/speckit.tasks  # Generate task breakdown for implementation
```

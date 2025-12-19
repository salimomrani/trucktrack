# Auth Service

JWT authentication service for TruckTrack.

**Port:** 8083

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/v1/register | Register user |
| POST | /auth/v1/login | Login, get JWT |
| POST | /auth/v1/refresh | Refresh token |
| POST | /auth/v1/logout | Logout |
| GET | /auth/v1/me | Current user |

## Quick Start

```bash
cd backend/auth-service
mvn spring-boot:run
```

## Configuration

Key settings in `application.yml`:

```yaml
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000      # 24h
    refresh-expiration: 604800000  # 7d
```

## User Roles

- `ADMIN` - Full access
- `FLEET_MANAGER` - Manage trucks, alerts
- `DRIVER` - View own truck
- `VIEWER` - Read-only

## Testing

```bash
# Login
curl -X POST http://localhost:8083/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@trucktrack.com","password":"AdminPass123!"}'
```

# Auth Service

Service d'authentification JWT pour TruckTrack.

Gère l'inscription, la connexion, et la validation des tokens JWT. Les tokens sont signés avec HS512 et contiennent le rôle utilisateur pour l'autorisation. Le refresh token permet de renouveler la session sans re-authentification.

**Port:** 8083

## Sécurité

- **Authentification DB**: BCrypt avec cost factor 12
- **Rate Limiting**: Protection brute-force (5 tentatives/15min par IP, lockout 15min)
- **JWT Secret**: Externalisé via `JWT_SECRET` (minimum 64 bytes pour HS512)
- **Service Accounts**: Tokens long-durée pour communication inter-services

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/v1/login | Login, get JWT |
| POST | /auth/v1/refresh | Refresh token |
| GET | /auth/v1/me | Current user |
| GET | /auth/v1/health | Health check |

### Admin Endpoints (ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/users | List users (paginated) |
| POST | /admin/users | Create user |
| PUT | /admin/users/{id} | Update user |
| POST | /admin/users/{id}/deactivate | Deactivate user |
| POST | /admin/users/{id}/reactivate | Reactivate user |
| POST | /admin/users/service-token | Generate service account JWT |

## Quick Start

```bash
# Set required environment variable
export JWT_SECRET=$(openssl rand -base64 64)

cd backend/auth-service
mvn spring-boot:run
```

## Configuration

Key settings in `application.yml`:

```yaml
jwt:
  secret: ${JWT_SECRET}           # Required - min 64 bytes
  access-expiration: 3600000      # 1h
  refresh-expiration: 604800000   # 7d

rate-limit:
  login:
    max-attempts: 5
    window-minutes: 15
    lockout-minutes: 15
```

## Service Account Tokens

Pour la communication inter-services via API Gateway:

```bash
# Generate token (ADMIN required)
curl -X POST "http://localhost:8000/admin/users/service-token?serviceName=notification-service&expirationDays=365" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Use in service config
export SERVICE_ACCOUNT_JWT=<token>
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

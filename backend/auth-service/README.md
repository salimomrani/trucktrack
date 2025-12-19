# Auth Service

Authentication and authorization microservice providing JWT-based security for the TruckTrack system.

## Overview

The Auth Service handles user authentication, JWT token generation/validation, user registration, and role-based access control. It provides secure endpoints for login, registration, token refresh, and user management.

## Technology Stack

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17
- **Database**: PostgreSQL 15 (shared with Location Service)
- **Security**: Spring Security 6.x
- **JWT**: jjwt (io.jsonwebtoken)
- **Password Hashing**: BCrypt
- **Build Tool**: Maven

## Port

- Default Port: `8083`

## Dependencies

- PostgreSQL (localhost:5432)
- Shared Library (common DTOs and exceptions)

## Getting Started

### Prerequisites

```bash
# Ensure PostgreSQL is running
cd infra/docker
docker-compose up -d postgres

# Build shared library first
cd backend
mvn clean install -pl shared -am
```

### Build

```bash
cd backend/auth-service
mvn clean install
```

### Run

```bash
mvn spring-boot:run

# Or with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Run with Docker

```bash
docker build -t truck-track-auth:latest .
docker run -p 8083:8083 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/trucktrack \
  -e JWT_SECRET=your-secret-key-change-in-production \
  truck-track-auth:latest
```

## Configuration

### Application Properties

Key configuration in `application.yml`:

```yaml
server:
  port: 8083

spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://localhost:5432/trucktrack
    username: trucktrack_user
    password: trucktrack_pass

  jpa:
    hibernate:
      ddl-auto: validate

security:
  jwt:
    secret: ${JWT_SECRET:default-secret-key-change-in-production-minimum-256-bits}
    expiration: 86400000  # 24 hours in milliseconds
    refresh-expiration: 604800000  # 7 days in milliseconds

cors:
  allowed-origins:
    - http://localhost:4200  # Angular frontend
    - http://localhost:3000
  allowed-methods:
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
  allowed-headers:
    - "*"
  allow-credentials: true
```

### Environment Variables

- `SPRING_PROFILES_ACTIVE` - Active Spring profile (dev, staging, prod)
- `SPRING_DATASOURCE_URL` - PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for signing JWTs (min 256 bits)
- `JWT_EXPIRATION` - JWT token expiration time in milliseconds
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration time

## Database Schema

### users Table

Used from Location Service database schema (defined in Location Service Flyway migrations).

**Columns**:
- `user_id` (UUID, PK) - Unique user identifier
- `username` (VARCHAR, UNIQUE) - User's username
- `email` (VARCHAR, UNIQUE) - User's email address
- `password_hash` (VARCHAR) - BCrypt hashed password
- `role` (ENUM) - User role (ADMIN, FLEET_MANAGER, DRIVER, VIEWER)
- `enabled` (BOOLEAN) - Account enabled status
- `created_at` (TIMESTAMP) - Account creation timestamp
- `last_login` (TIMESTAMP) - Last login timestamp

## API Endpoints

### Public Endpoints (No Authentication Required)

#### User Registration

```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "FLEET_MANAGER"
}
```

**Validation**:
- Username: 3-50 characters, alphanumeric
- Email: Valid email format
- Password: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit
- Role: Valid enum value (defaults to VIEWER if not specified)

**Response**: `201 Created`

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "role": "FLEET_MANAGER",
  "createdAt": "2025-12-09T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Validation errors
- `409 Conflict` - Username or email already exists

#### User Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response**: `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "role": "FLEET_MANAGER"
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account disabled

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Response**: `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or expired refresh token

### Protected Endpoints (Authentication Required)

#### Get Current User

```http
GET /auth/me
Authorization: Bearer {jwt_token}
```

**Response**: `200 OK`

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "role": "FLEET_MANAGER",
  "enabled": true,
  "createdAt": "2025-12-09T10:30:00Z",
  "lastLogin": "2025-12-09T15:45:00Z"
}
```

#### Update Password

```http
PUT /auth/password
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response**: `200 OK`

```json
{
  "message": "Password updated successfully"
}
```

**Error Responses**:
- `400 Bad Request` - Password validation failed
- `401 Unauthorized` - Current password incorrect

#### Logout

```http
POST /auth/logout
Authorization: Bearer {jwt_token}
```

**Response**: `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

**Note**: In current implementation, JWT tokens remain valid until expiration. For production, implement token blacklisting using Redis.

### Admin Endpoints (ADMIN Role Required)

#### List All Users

```http
GET /auth/users
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `role` - Filter by role
- `enabled` - Filter by enabled status
- `page` - Page number (default: 0)
- `size` - Page size (default: 20)

**Response**: `200 OK`

```json
{
  "users": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "role": "FLEET_MANAGER",
      "enabled": true,
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 0,
  "size": 20
}
```

#### Update User Role

```http
PUT /auth/users/{userId}/role
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

**Response**: `200 OK`

#### Disable User

```http
PUT /auth/users/{userId}/disable
Authorization: Bearer {jwt_token}
```

**Response**: `200 OK`

#### Enable User

```http
PUT /auth/users/{userId}/enable
Authorization: Bearer {jwt_token}
```

**Response**: `200 OK`

## JWT Token Structure

### Access Token Claims

```json
{
  "sub": "johndoe",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "role": "FLEET_MANAGER",
  "iat": 1733746200,
  "exp": 1733832600
}
```

### Refresh Token Claims

```json
{
  "sub": "johndoe",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "refresh",
  "iat": 1733746200,
  "exp": 1734351000
}
```

## JWT Implementation

### Token Generation

Implemented in `AuthService.java`:

```java
public String generateToken(String username, String userId, String role) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", userId);
    claims.put("role", role);
    claims.put("username", username);

    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);

    return Jwts.builder()
            .setClaims(claims)
            .setSubject(username)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
}
```

### Token Validation

```java
public boolean validateToken(String token) {
    try {
        Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
        return true;
    } catch (JwtException | IllegalArgumentException e) {
        return false;
    }
}
```

### Extracting Claims

```java
public Claims extractAllClaims(String token) {
    return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
}

public String extractUserId(String token) {
    return extractAllClaims(token).get("userId", String.class);
}

public String extractRole(String token) {
    return extractAllClaims(token).get("role", String.class);
}
```

## Security Configuration

### Spring Security Setup

Implemented in `SecurityConfig.java`:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers("/auth/users/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        );

    return http.build();
}
```

### Password Encoding

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);  // Strength: 12 rounds
}
```

### CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

## User Roles and Permissions

### Role Hierarchy

1. **ADMIN** - Full system access
   - Manage users (create, update role, disable/enable)
   - Access all trucks and data
   - Configure system settings

2. **FLEET_MANAGER** - Fleet management
   - View all trucks in assigned groups
   - Configure geofences and alert rules
   - View historical data and reports

3. **DRIVER** - Limited access
   - View own truck only
   - Update own profile
   - No administrative functions

4. **VIEWER** - Read-only access
   - View trucks in assigned groups
   - No modification permissions

## Password Security

### Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- Optional: Special characters

### Validation Regex

```java
private static final String PASSWORD_PATTERN =
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";
```

### Hashing

- Algorithm: BCrypt
- Rounds: 12
- Salt: Automatically generated per password

## Monitoring & Observability

### Metrics

Available at `/actuator/metrics` and `/actuator/prometheus`:

- `auth.login.attempts` - Total login attempts
- `auth.login.success` - Successful logins
- `auth.login.failed` - Failed login attempts
- `auth.registration.count` - User registrations
- `auth.token.issued` - JWT tokens issued
- `auth.token.refreshed` - Tokens refreshed

### Distributed Tracing

OpenTelemetry tracing is enabled via Micrometer Tracing Bridge:
- All HTTP requests are traced automatically
- TraceId/SpanId propagated in headers
- Logs include trace context: `[traceId, spanId]`
- Traces exported to Jaeger at http://localhost:16686

### Monitoring Stack

| Tool | URL | Description |
|------|-----|-------------|
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Jaeger | http://localhost:16686 | Distributed tracing |

### Logging

Structured JSON logging with trace correlation:
- Login attempts (success and failure)
- User registration
- Password changes
- Token generation and validation
- Authorization failures

Log format includes trace context:
```
2025-12-19 10:30:00.123 [http-nio-8083-exec-1] [abc123,def456] INFO AuthService - Login successful for user: admin@trucktrack.com
```

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
# Start PostgreSQL
cd infra/docker
docker-compose up -d postgres

# Run integration tests
cd backend/auth-service
mvn verify
```

### Manual Testing

```bash
# Register new user
curl -X POST http://localhost:8083/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "role": "VIEWER"
  }' | jq

# Login
TOKEN_RESPONSE=$(curl -X POST http://localhost:8083/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')

# Get current user
curl http://localhost:8083/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Security Best Practices

### Production Deployment

1. **JWT Secret**: Use strong, randomly generated secret (min 256 bits)
   ```bash
   # Generate secure secret
   openssl rand -base64 32
   ```

2. **Token Expiration**: Configure appropriate token lifetimes
   - Access Token: 15-60 minutes
   - Refresh Token: 7-30 days

3. **HTTPS Only**: Always use HTTPS in production

4. **Token Blacklisting**: Implement Redis-based token blacklist for logout

5. **Rate Limiting**: Implement rate limiting on login endpoint
   ```yaml
   security:
     rate-limiting:
       login-max-attempts: 5
       login-lockout-duration: 300  # 5 minutes
   ```

6. **Account Lockout**: Lock account after N failed login attempts

7. **Password Policy**: Enforce strong password requirements

8. **CORS**: Configure specific allowed origins (not "*")

## Troubleshooting

### Invalid JWT Token

**Problem**: Token validation fails with "Invalid signature"

**Solution**:
- Verify JWT_SECRET is same across all services
- Check token hasn't expired
- Ensure token format is correct (Bearer prefix in Authorization header)

### Login Fails with Valid Credentials

**Problem**: Login returns 401 despite correct password

**Solution**:
```bash
# Check password hash in database
docker exec -it postgres psql -U trucktrack_user -d trucktrack \
  -c "SELECT username, password_hash FROM users WHERE username='testuser';"

# Verify BCrypt rounds configuration matches
```

### CORS Errors

**Problem**: Frontend cannot connect due to CORS

**Solution**:
- Add frontend origin to `cors.allowed-origins` in application.yml
- Ensure `allow-credentials: true` is set
- Check browser console for specific CORS error

## Related Services

- **API Gateway** - Uses JWT filter to validate tokens for all requests
- **All Backend Services** - Receive user context via `X-User-Id`, `X-Username`, `X-User-Role` headers from API Gateway
- **Location Service** - Stores user data in shared database

## Future Enhancements

- OAuth2/OIDC integration (Google, Microsoft, etc.)
- Multi-factor authentication (MFA)
- Session management with Redis
- Token blacklisting for immediate logout
- Password reset via email
- Account verification via email
- API key authentication for device-to-device communication

## License

Proprietary - TruckTrack System

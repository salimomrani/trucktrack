# Quickstart: Gestion des Droits et Permissions (RBAC)

**Feature**: 008-rbac-permissions | **Date**: 2025-12-23

## Quick Verification

### 1. Test Page Access Control

```bash
# Login as ADMIN
curl -X POST http://localhost:8000/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@trucktrack.com","password":"admin123"}' \
  | jq '.token' -r > /tmp/admin_token.txt

ADMIN_TOKEN=$(cat /tmp/admin_token.txt)

# Get admin's accessible pages (should include ADMIN page)
curl http://localhost:8000/auth/v1/permissions/pages \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Expected: ["DASHBOARD", "MAP", "ANALYTICS", "ADMIN", "ALERTS", "PROFILE"]
```

```bash
# Login as FLEET_MANAGER
curl -X POST http://localhost:8000/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager@trucktrack.com","password":"manager123"}' \
  | jq '.token' -r > /tmp/manager_token.txt

MANAGER_TOKEN=$(cat /tmp/manager_token.txt)

# Get manager's accessible pages (should NOT include ADMIN)
curl http://localhost:8000/auth/v1/permissions/pages \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq

# Expected: ["DASHBOARD", "MAP", "ANALYTICS", "ALERTS", "PROFILE"]
```

### 2. Test Data Filtering by Group

```bash
# Using FLEET_MANAGER token - should only see trucks in assigned groups
curl http://localhost:8000/location/v1/trucks \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq '.content | length'

# Using ADMIN token - should see ALL trucks
curl http://localhost:8000/location/v1/trucks \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.content | length'
```

### 3. Test Unauthorized Access (403)

```bash
# Try to access admin endpoint as FLEET_MANAGER
curl -w "\n%{http_code}\n" http://localhost:8000/auth/v1/admin/users \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Expected: 403 Forbidden
```

### 4. Test Frontend Navigation

1. Login as `admin@trucktrack.com` → Should see ALL menu items including "Admin"
2. Login as `manager@trucktrack.com` → Should NOT see "Admin" menu item
3. Login as `dispatcher@trucktrack.com` → Should NOT see "Admin" or "Analytics"
4. Login as `driver@trucktrack.com` → Should only see "Dashboard", "Alertes", "Profil"

### 5. Test Direct URL Access Denial

1. Login as `manager@trucktrack.com`
2. Manually navigate to `http://localhost:4200/admin`
3. Expected: Redirect to Access Denied page with message

## Integration Scenarios

### Scenario A: New User Assignment

```bash
# 1. Admin creates user with FLEET_MANAGER role
curl -X POST http://localhost:8000/auth/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newmanager@trucktrack.com",
    "password": "secure123",
    "role": "FLEET_MANAGER"
  }'

# 2. Admin assigns groups to user
USER_ID="<returned_user_id>"
curl -X PUT http://localhost:8000/auth/v1/users/$USER_ID/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groupIds": ["<group_id_1>", "<group_id_2>"]}'

# 3. New user logs in - should only see trucks in assigned groups
```

### Scenario B: Permission Change

```bash
# 1. Admin changes user role from FLEET_MANAGER to DISPATCHER
curl -X PATCH http://localhost:8000/auth/v1/admin/users/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "DISPATCHER"}'

# 2. User's current session continues with old permissions

# 3. User logs out and logs back in

# 4. New permissions take effect - Analytics no longer accessible
```

### Scenario C: Group Removal

```bash
# 1. Admin removes user from a group
curl -X PUT http://localhost:8000/auth/v1/users/$USER_ID/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groupIds": ["<remaining_group_id>"]}'

# 2. After user relogin, trucks from removed group no longer visible
```

## Test Users (Seed Data)

| Username | Password | Role | Groups |
|----------|----------|------|--------|
| admin@trucktrack.com | admin123 | ADMIN | All |
| manager@trucktrack.com | manager123 | FLEET_MANAGER | Équipe Nord |
| dispatcher@trucktrack.com | dispatcher123 | DISPATCHER | Équipe Nord, Équipe Sud |
| driver@trucktrack.com | driver123 | DRIVER | Truck TK-001 only |
| viewer@trucktrack.com | viewer123 | VIEWER | Équipe Nord |

## Expected Behaviors

### Navigation Menu by Role

| Menu Item | ADMIN | FLEET_MANAGER | DISPATCHER | DRIVER | VIEWER |
|-----------|-------|---------------|------------|--------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Carte | ✓ | ✓ | ✓ | - | ✓ |
| Analytics | ✓ | ✓ | - | - | - |
| Admin | ✓ | - | - | - | - |
| Alertes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Profil | ✓ | ✓ | ✓ | ✓ | ✓ |

### HTTP Status Codes

| Scenario | Status Code |
|----------|-------------|
| Access allowed | 200 OK |
| Not authenticated | 401 Unauthorized |
| Not authorized (wrong role) | 403 Forbidden |
| Resource not in user's groups | 403 Forbidden |
| Resource not found | 404 Not Found |

## Debugging Tips

### Check JWT Token Content

```bash
# Decode JWT token (without validation)
echo $MANAGER_TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq

# Should show:
# {
#   "sub": "manager@trucktrack.com",
#   "role": "FLEET_MANAGER",
#   "groupIds": ["<uuid1>", "<uuid2>"],
#   "userId": "<uuid>"
# }
```

### Check User's Current Groups

```bash
curl http://localhost:8000/auth/v1/permissions/me \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq
```

### Check Server Logs for Access Denials

```bash
# Look for WARN logs
docker logs trucktrack-auth-service 2>&1 | grep "Access denied"
```

## Performance Expectations

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Permission check (page access) | <50ms | Server-side, no DB call |
| Group filter query | <100ms | Single indexed query |
| Navigation load | <200ms | Frontend, cached after first load |
| Login with permission data | <500ms | Includes JWT generation with groups |

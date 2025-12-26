# Cache Headers Contract

This document defines the HTTP cache headers that will be added to existing API responses.

## Response Headers

### Cacheable Endpoints

The following existing endpoints will include cache metadata headers:

| Endpoint | Cache-Control | X-Cache-TTL |
|----------|---------------|-------------|
| `GET /admin/trucks` | `private, max-age=300` | `300` |
| `GET /admin/trucks/{id}` | `private, max-age=300` | `300` |
| `GET /admin/drivers` | `private, max-age=300` | `300` |
| `GET /admin/groups` | `private, max-age=600` | `600` |
| `GET /admin/dashboard/stats` | `private, max-age=60` | `60` |

### Custom Headers

```
X-Cache-Status: HIT | MISS | BYPASS
X-Cache-TTL: <seconds remaining>
X-Cache-Key: <cache key used>
```

### Example Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=300
X-Cache-Status: HIT
X-Cache-TTL: 187
X-Cache-Key: trucks:list:550e8400-e29b-41d4-a716-446655440000

{
  "content": [...],
  "totalElements": 45
}
```

## Non-Cacheable Endpoints

These endpoints will NOT include cache headers (real-time data):

- `GET /location/v1/positions/*` (GPS positions)
- `GET /admin/trips` (trip status)
- `GET /admin/alerts` (alerts)
- `WS /ws/positions` (WebSocket)

## Cache Bypass

Clients can bypass cache by sending:

```http
Cache-Control: no-cache
```

Server will respond with fresh data and `X-Cache-Status: BYPASS`.

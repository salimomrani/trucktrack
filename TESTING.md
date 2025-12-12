# Testing the Truck Tracking System

## GPS Simulation Script

The `simulate-truck-movement.py` script simulates GPS position updates for multiple trucks to test the end-to-end tracking system.

### Prerequisites

```bash
# Install Python dependencies
pip3 install requests
```

### Configuration

The script uses the following default configurations:

- **GPS Ingestion Service**: `http://localhost:8080/gps/v1/positions`
- **Location Service**: `http://localhost:8081/location/v1/trucks`
- **Truck IDs**: Uses 3 predefined UUIDs (must exist in database)
- **Starting Positions**: Paris area coordinates

### Running the Simulation

1. **Start all services**:
   ```bash
   ./start-all.sh
   ```

2. **Run the simulation script**:
   ```bash
   python3 simulate-truck-movement.py
   ```

3. **Stop the simulation**:
   - Press `Ctrl+C` to stop gracefully
   - The script will show final statistics

### What the Script Does

1. **Initializes Trucks**: Creates 3 truck simulators with starting positions
2. **Simulates Movement**: Updates positions every 2 seconds with:
   - Random speed variations (0-80 km/h)
   - Random heading changes
   - Realistic GPS data (altitude, accuracy, satellites)
3. **Sends GPS Data**: POST requests to GPS Ingestion Service
4. **Shows Real-time Updates**: Displays position, speed, heading, and status
5. **Tracks Statistics**: Success/failure rates and event IDs

### Output Example

```
================================================================================
🚛 GPS TRUCK MOVEMENT SIMULATOR
================================================================================
📍 GPS Ingestion Service: http://localhost:8080/gps/v1/positions
📊 Location Service: http://localhost:8081/location/v1/trucks
🚚 Simulating 3 trucks
================================================================================
✓ Initialized truck 11111111... at Paris Center
✓ Initialized truck 22222222... at La Défense
✓ Initialized truck 33333333... at Bercy
================================================================================

📡 Iteration 1 - 14:30:15
--------------------------------------------------------------------------------
🟢 Truck 11111111... | Pos: (48.8566, 2.3522) | Speed: 45.2 km/h | Heading: 180° | EventID: evt_abc123
🟡 Truck 22222222... | Pos: (48.8738, 2.2950) | Speed: 3.1 km/h | Heading: 90° | EventID: evt_def456
🟢 Truck 33333333... | Pos: (48.8456, 2.3708) | Speed: 62.8 km/h | Heading: 270° | EventID: evt_ghi789
--------------------------------------------------------------------------------
📊 Stats: ✓ 3 successful | ❌ 0 failed
```

### Status Icons

- 🟢 **ACTIVE**: Truck is moving (speed > 5 km/h)
- 🟡 **IDLE**: Truck is stationary or slow (speed ≤ 5 km/h)
- ⚫ **OFFLINE**: No recent GPS data
- ❌ **ERROR**: Failed to send GPS data

### Testing the Full Flow

The simulation tests:

1. ✅ **GPS Ingestion**: POST /gps/v1/positions endpoint
2. ✅ **Validation**: GPS data validation (lat/lng, timestamp, etc.)
3. ✅ **Kafka Publishing**: Events sent to `truck-track.gps.position` topic
4. ✅ **Kafka Consumption**: Location service consumes events
5. ✅ **Database Storage**: GPS positions saved to PostgreSQL
6. ✅ **Redis Caching**: Current positions cached (TTL=5min)
7. ✅ **Status Calculation**: ACTIVE/IDLE/OFFLINE based on speed and time
8. ✅ **WebSocket Broadcast**: Real-time updates sent to frontend

### Troubleshooting

**Connection Refused**:
```bash
# Check if services are running
curl http://localhost:8080/gps/v1/health
curl http://localhost:8081/location/v1/health
```

**Validation Errors**:
- Check that truck IDs exist in database
- Verify GPS data is within valid ranges
- Ensure timestamps are within ±5 minutes

**No Updates on Frontend**:
- Check WebSocket connection in browser console
- Verify location-service is broadcasting updates
- Check Redis cache: `redis-cli KEYS truck:position:*`

## Manual Testing

### Send Single GPS Position

```bash
curl -X POST http://localhost:8080/gps/v1/positions \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "11111111-1111-1111-1111-111111111111",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "altitude": 100.0,
    "speed": 50.0,
    "heading": 180,
    "accuracy": 10.0,
    "satellites": 10,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

### Check Truck Status

```bash
curl http://localhost:8081/location/v1/trucks/11111111-1111-1111-1111-111111111111/current-position
```

### List All Trucks

```bash
curl http://localhost:8081/location/v1/trucks
```

## Performance Testing

For load testing, modify the script to:
- Increase number of trucks
- Reduce iteration delay
- Send bulk positions

Example for 100 trucks at 1-second intervals would generate ~360,000 events/hour.


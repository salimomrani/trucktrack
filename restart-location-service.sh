#!/bin/bash

echo "Stopping all location-service instances..."
pkill -9 -f "location-service" 2>/dev/null || true
pkill -9 -f "LocationServiceApplication" 2>/dev/null || true
sleep 3

echo "Starting location-service..."
cd /Users/salimomrani/code/java/kafka/truck_track/backend/location-service
nohup mvn spring-boot:run -Dspring-boot.run.profiles=local > /tmp/location-live.log 2>&1 &

echo "Waiting for service to start..."
sleep 10

echo "Checking logs..."
tail -50 /tmp/location-live.log | grep -E "Started|Tomcat|8081|ERROR"

echo ""
echo "Location service restarted!"
echo "Monitor logs with: tail -f /tmp/location-live.log"

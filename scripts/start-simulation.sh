#!/bin/bash

# Start GPS Truck Movement Simulation
# This script simulates truck movements by sending GPS events to Kafka

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       Starting GPS Truck Movement Simulation             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if required services are running
echo "Checking services..."

# Check Kafka
if ! nc -z localhost 9092 2>/dev/null; then
    echo "❌ Kafka is not running on localhost:9092"
    echo "   Please start Kafka first: cd infra/docker && docker-compose up -d kafka"
    exit 1
fi
echo "✓ Kafka is running"

# Check GPS Ingestion Service
if ! curl -s http://localhost:8080/gps/v1/health > /dev/null 2>&1; then
    echo "❌ GPS Ingestion Service is not running on localhost:8080"
    echo "   Please start the services first: ./start-all.sh"
    exit 1
fi
echo "✓ GPS Ingestion Service is running"

# Check Location Service
if ! curl -s http://localhost:8081/location/v1/health > /dev/null 2>&1; then
    echo "⚠️  Location Service is not responding on localhost:8081"
    echo "   The simulation will continue, but truck positions may not be stored"
fi
echo "✓ Location Service is ready"

echo ""
echo "All systems ready! Starting simulation..."
echo "Press Ctrl+C to stop the simulation"
echo ""

# Run the simulation
cd "$(dirname "$0")"
python3 simulate-truck-movement.py

#!/bin/bash
# Check status of all Truck Track services
# Usage: ./status.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Truck Track - Service Status Check      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to check service status
check_service() {
  local name=$1
  local url=$2
  local port=$3

  # Check if port is in use
  local pid=$(lsof -ti:$port 2>/dev/null || echo "")

  if [ -z "$pid" ]; then
    echo -e "  ${RED}✗${NC} $name - ${RED}NOT RUNNING${NC} (port $port)"
    return 1
  fi

  # Check if service responds
  if curl -s -f "$url" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name - ${GREEN}RUNNING${NC} (PID: $pid, port $port)"
    return 0
  else
    echo -e "  ${YELLOW}⚠${NC} $name - ${YELLOW}STARTING${NC} (PID: $pid, port $port)"
    return 0
  fi
}

# Check Docker infrastructure
echo -e "${BLUE}Docker Infrastructure:${NC}"

cd "$PROJECT_ROOT/infra/docker"

# Check PostgreSQL
if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
  echo -e "  ${GREEN}✓${NC} PostgreSQL - ${GREEN}RUNNING${NC}"
else
  echo -e "  ${RED}✗${NC} PostgreSQL - ${RED}NOT RUNNING${NC}"
fi

# Check Kafka
if docker-compose ps kafka 2>/dev/null | grep -q "Up"; then
  echo -e "  ${GREEN}✓${NC} Kafka - ${GREEN}RUNNING${NC}"
else
  echo -e "  ${RED}✗${NC} Kafka - ${RED}NOT RUNNING${NC}"
fi

# Check Redis
if docker-compose ps redis 2>/dev/null | grep -q "Up"; then
  echo -e "  ${GREEN}✓${NC} Redis - ${GREEN}RUNNING${NC}"
else
  echo -e "  ${RED}✗${NC} Redis - ${RED}NOT RUNNING${NC}"
fi

echo ""

# Check backend services
echo -e "${BLUE}Backend Services:${NC}"

check_service "GPS Ingestion Service" "http://localhost:8080/actuator/health" 8080
check_service "Location Service" "http://localhost:8081/actuator/health" 8081
check_service "Notification Service" "http://localhost:8082/actuator/health" 8082
check_service "Auth Service" "http://localhost:8083/actuator/health" 8083
check_service "API Gateway" "http://localhost:8000/actuator/health" 8000

echo ""

# System resources
echo -e "${BLUE}System Resources:${NC}"

# Count Java processes
JAVA_COUNT=$(ps aux | grep java | grep -v grep | wc -l | xargs)
echo -e "  Java processes: ${JAVA_COUNT}"

# Docker containers
DOCKER_COUNT=$(docker ps -q | wc -l | xargs)
echo -e "  Docker containers: ${DOCKER_COUNT}"

echo ""

# URLs
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  API Gateway:  ${GREEN}http://localhost:8000${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:8000/actuator/health${NC}"

echo ""

# Quick actions
echo -e "${BLUE}Quick Actions:${NC}"
echo -e "  Start all:    ${YELLOW}./start-all.sh${NC}"
echo -e "  Stop all:     ${YELLOW}./stop-all.sh${NC}"
echo -e "  View logs:    ${YELLOW}tail -f logs/*.log${NC}"

echo ""

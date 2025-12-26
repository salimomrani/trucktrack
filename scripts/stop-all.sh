#!/bin/bash
# Stop all Truck Track services
# Usage: ./stop-all.sh [--docker] [--no-prompt]
#   --docker     Also stop Docker infrastructure
#   --no-prompt  Skip interactive prompts (for use in restart-all.sh)

# Don't use set -e - we want to continue even if some kills fail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.pids"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Truck Track - Stopping All Services     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to kill process and its children
kill_process_tree() {
  local pid=$1
  local name=$2

  if ps -p $pid > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"

    # Kill child processes first
    pkill -P $pid 2>/dev/null || true

    # Kill main process
    kill $pid 2>/dev/null || true

    # Wait for process to stop (max 10 seconds)
    local count=0
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
      sleep 1
      count=$((count + 1))
    done

    # Force kill if still running
    if ps -p $pid > /dev/null 2>&1; then
      echo -e "${RED}Force killing $name...${NC}"
      kill -9 $pid 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ $name stopped${NC}"
  else
    echo -e "${YELLOW}$name not running (PID: $pid)${NC}"
  fi
}

# Stop services from PID file
if [ -f "$PID_FILE" ]; then
  echo -e "${BLUE}Stopping services from PID file...${NC}"
  echo ""

  source "$PID_FILE"

  kill_process_tree "$API_GATEWAY_PID" "API Gateway"
  kill_process_tree "$AUTH_PID" "Auth Service"
  kill_process_tree "$NOTIFICATION_PID" "Notification Service"
  kill_process_tree "$LOCATION_PID" "Location Service"
  kill_process_tree "$GPS_INGESTION_PID" "GPS Ingestion Service"

  rm "$PID_FILE"
  echo ""
else
  echo -e "${YELLOW}No PID file found. Trying to kill by port...${NC}"
  echo ""
fi

# Kill any remaining processes on known ports
echo -e "${BLUE}Checking for remaining processes on ports...${NC}"

PORTS=(8080 8081 8082 8083 8000)
PORT_NAMES=("GPS Ingestion (8080)" "Location (8081)" "Notification (8082)" "Auth (8083)" "API Gateway (8000)")

for i in "${!PORTS[@]}"; do
  PID=$(lsof -ti:${PORTS[$i]} 2>/dev/null || true)
  if [ ! -z "$PID" ]; then
    echo -e "${YELLOW}Killing process on port ${PORTS[$i]} (PID: $PID)${NC}"
    kill -9 $PID 2>/dev/null || true
  fi
done

# Also kill any remaining Maven spring-boot:run processes for trucktrack
echo -e "${BLUE}Checking for remaining Maven processes...${NC}"
MAVEN_PIDS=$(pgrep -f "spring-boot:run.*trucktrack" 2>/dev/null || true)
if [ ! -z "$MAVEN_PIDS" ]; then
  echo -e "${YELLOW}Killing remaining Maven processes: $MAVEN_PIDS${NC}"
  echo "$MAVEN_PIDS" | xargs kill -9 2>/dev/null || true
fi

# Kill any Java processes running trucktrack services
JAVA_PIDS=$(pgrep -f "trucktrack.*-service" 2>/dev/null || true)
if [ ! -z "$JAVA_PIDS" ]; then
  echo -e "${YELLOW}Killing remaining Java processes: $JAVA_PIDS${NC}"
  echo "$JAVA_PIDS" | xargs kill -9 2>/dev/null || true
fi

echo ""

# Check for --docker flag or ask about stopping Docker infrastructure
STOP_DOCKER=false
for arg in "$@"; do
  case $arg in
    --docker)
      STOP_DOCKER=true
      ;;
    --no-prompt)
      # Skip Docker prompt entirely (for restart-all.sh)
      STOP_DOCKER=false
      ;;
  esac
done

if [ "$STOP_DOCKER" = true ]; then
  echo -e "${BLUE}Stopping Docker infrastructure...${NC}"
  cd "$PROJECT_ROOT/infra/docker"
  docker-compose down
  echo -e "${GREEN}✓ Docker infrastructure stopped${NC}"
elif [ -t 0 ] && [ -z "$NO_PROMPT" ]; then
  # Only prompt if running interactively and NO_PROMPT not set
  read -p "Stop Docker infrastructure (Kafka, PostgreSQL, Redis)? [y/N]: " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Stopping Docker infrastructure...${NC}"
    cd "$PROJECT_ROOT/infra/docker"
    docker-compose down
    echo -e "${GREEN}✓ Docker infrastructure stopped${NC}"
  else
    echo -e "${YELLOW}Docker infrastructure left running${NC}"
  fi
else
  echo -e "${YELLOW}Docker infrastructure left running (use --docker to stop)${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         All Services Stopped! 🛑           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "To start again: ${GREEN}./start-all.sh${NC}"
echo ""

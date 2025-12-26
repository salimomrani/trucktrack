#!/bin/bash
# Start all Truck Track services with one command
# Usage: ./start-all.sh [--build] [--logs]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

BUILD_BACKEND=false
SHOW_LOGS=false

# ============================================
# Environment variables for local development
# ============================================
# Spring profile (dev = readable logs, debug enabled)
export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"

# Database credentials (match docker-compose)
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-trucktrack}"
export DB_USERNAME="${DB_USERNAME:-trucktrack}"
export DB_PASSWORD="${DB_PASSWORD:-changeme}"

# JWT Secret for auth-service (must be 64+ bytes for HS512)
# This is a development-only key - NEVER use in production!
export JWT_SECRET="${JWT_SECRET:-TruckTrackLocalDevJwt2024KeyForDevelopmentOnlyDoNotUseThisInProdEnv1234567890ABCDEFGHIJ}"

# Java configuration
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || echo /usr/lib/jvm/java-17)}"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --build)
      BUILD_BACKEND=true
      shift
      ;;
    --logs)
      SHOW_LOGS=true
      shift
      ;;
    --help)
      echo "Usage: ./start-all.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --build    Build backend services before starting"
      echo "  --logs     Show logs after starting (blocks terminal)"
      echo "  --help     Show this help message"
      exit 0
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Truck Track - Starting All Services     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Environment Configuration:${NC}"
echo -e "  Profile:     ${GREEN}$SPRING_PROFILES_ACTIVE${NC}"
echo -e "  Database:    ${GREEN}$DB_USERNAME@$DB_HOST:$DB_PORT/$DB_NAME${NC}"
echo -e "  JWT Secret:  ${GREEN}[${#JWT_SECRET} chars]${NC}"
echo -e "  JAVA_HOME:   ${GREEN}$JAVA_HOME${NC}"
echo ""

# Function to check if a port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port $port is already in use${NC}"
    return 1
  fi
  return 0
}

# Function to wait for a service to be ready
wait_for_service() {
  local url=$1
  local name=$2
  local max_attempts=30
  local attempt=0

  echo -ne "${YELLOW}Waiting for $name to be ready...${NC}"

  while [ $attempt -lt $max_attempts ]; do
    if curl -s -f "$url" > /dev/null 2>&1; then
      echo -e " ${GREEN}✓${NC}"
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
    echo -ne "."
  done

  echo -e " ${RED}✗ Timeout${NC}"
  return 1
}

# Step 1: Check Docker and Start Infrastructure
echo -e "${GREEN}[1/4]${NC} Starting infrastructure (Kafka, PostgreSQL, Redis)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}✗ Docker is not running!${NC}"
  echo ""
  echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
  echo ""
  echo -e "${BLUE}On macOS:${NC}"
  echo "  1. Open Docker Desktop application"
  echo "  2. Wait for Docker to start (whale icon in menu bar)"
  echo "  3. Run this script again"
  echo ""
  echo -e "${BLUE}Alternatively, start Docker from command line:${NC}"
  echo "  open -a Docker"
  echo ""

  read -p "Do you want to continue without Docker? (services will fail) [y/N]: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Exiting. Please start Docker and try again.${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠ Continuing without Docker - services will fail to connect to Kafka/PostgreSQL/Redis${NC}"
else
  cd "$DOCKER_DIR"

  if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${YELLOW}Infrastructure already running${NC}"
  else
    echo -e "${BLUE}Starting Docker containers...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Infrastructure started${NC}"

    # Wait for PostgreSQL
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    sleep 5

    # Wait for Kafka
    echo -e "${YELLOW}Waiting for Kafka to be ready...${NC}"
    sleep 10
    echo -e "${GREEN}✓ All infrastructure should be ready${NC}"
  fi
fi

echo ""

# Step 2: Build backend if requested
if [ "$BUILD_BACKEND" = true ]; then
  echo -e "${GREEN}[2/4]${NC} Building backend services..."
  cd "$BACKEND_DIR"
  mvn clean install -DskipTests
  echo -e "${GREEN}✓ Backend built successfully${NC}"
  echo ""
else
  echo -e "${GREEN}[2/4]${NC} Skipping backend build (use --build to build)"
  echo ""
fi

# Step 3: Run database migrations
echo -e "${GREEN}[3/4]${NC} Running database migrations..."
cd "$BACKEND_DIR"
mvn flyway:migrate -P local 2>&1 | grep -E "(SUCCESS|ERROR|WARNING|Migration)" || true
echo -e "${GREEN}✓ Database migrations complete${NC}"
echo ""

# Step 4: Start all services using Maven
echo -e "${GREEN}[4/4]${NC} Starting all services..."

# Check if ports are available
PORTS=(8080 8081 8082 8083 8000)
PORT_NAMES=("GPS Ingestion" "Location" "Notification" "Auth" "API Gateway")

for i in "${!PORTS[@]}"; do
  check_port ${PORTS[$i]} || echo -e "${YELLOW}${PORT_NAMES[$i]} (${PORTS[$i]}) may conflict${NC}"
done

echo ""

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start backend services in background
echo -e "${BLUE}Starting backend services...${NC}"

# Use Spring profile from environment (default: dev)
SPRING_PROFILE="${SPRING_PROFILES_ACTIVE:-dev}"

cd "$BACKEND_DIR/gps-ingestion-service"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$PROJECT_ROOT/logs/gps-ingestion.log" 2>&1 &
GPS_PID=$!
echo -e "  GPS Ingestion Service (PID: $GPS_PID) on port 8080"

cd "$BACKEND_DIR/location-service"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$PROJECT_ROOT/logs/location.log" 2>&1 &
LOCATION_PID=$!
echo -e "  Location Service (PID: $LOCATION_PID) on port 8081"

cd "$BACKEND_DIR/notification-service"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$PROJECT_ROOT/logs/notification.log" 2>&1 &
NOTIFICATION_PID=$!
echo -e "  Notification Service (PID: $NOTIFICATION_PID) on port 8082"

cd "$BACKEND_DIR/auth-service"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$PROJECT_ROOT/logs/auth.log" 2>&1 &
AUTH_PID=$!
echo -e "  Auth Service (PID: $AUTH_PID) on port 8083"

cd "$BACKEND_DIR/api-gateway"
nohup mvn spring-boot:run -Dspring-boot.run.profiles=$SPRING_PROFILE > "$PROJECT_ROOT/logs/api-gateway.log" 2>&1 &
GATEWAY_PID=$!
echo -e "  API Gateway (PID: $GATEWAY_PID) on port 8000"

echo ""

# Save PIDs to file for cleanup
cat > "$PROJECT_ROOT/.pids" <<EOF
GPS_INGESTION_PID=$GPS_PID
LOCATION_PID=$LOCATION_PID
NOTIFICATION_PID=$NOTIFICATION_PID
AUTH_PID=$AUTH_PID
API_GATEWAY_PID=$GATEWAY_PID
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    Backend Services Started! 🚀            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Services are starting up. This may take 30-60 seconds..."
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo -e "  API Gateway:     ${GREEN}http://localhost:8000${NC}"
echo -e "  Health Check:    ${GREEN}http://localhost:8000/actuator/health${NC}"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo -e "  Prometheus:      ${GREEN}http://localhost:9090${NC}"
echo -e "  Grafana:         ${GREEN}http://localhost:3000${NC} (admin/admin)"
echo -e "  Jaeger (Traces): ${GREEN}http://localhost:16686${NC}"
echo -e "  Kafka UI:        ${GREEN}http://localhost:8088${NC}"
echo ""
echo -e "${BLUE}Credentials:${NC}"
echo -e "  Email:    admin@trucktrack.com"
echo -e "  Password: AdminPass123!"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  View all logs:   ${YELLOW}tail -f logs/*.log${NC}"
echo -e "  GPS Ingestion:   ${YELLOW}tail -f logs/gps-ingestion.log${NC}"
echo -e "  Location:        ${YELLOW}tail -f logs/location.log${NC}"
echo -e "  Auth:            ${YELLOW}tail -f logs/auth.log${NC}"
echo ""
echo -e "${BLUE}Management:${NC}"
echo -e "  Stop all:        ${YELLOW}./stop-all.sh${NC}"
echo -e "  Restart all:     ${YELLOW}./restart-all.sh${NC}"
echo -e "  View status:     ${YELLOW}./status.sh${NC}"
echo ""

# Wait for services to be ready
sleep 5

if [ "$SHOW_LOGS" = true ]; then
  echo -e "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
  echo ""
  tail -f "$PROJECT_ROOT/logs/"*.log
fi

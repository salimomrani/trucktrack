#!/bin/bash
# =============================================================================
# SonarQube Analysis Script for TruckTrack Backend
# =============================================================================
#
# Usage:
#   ./scripts/sonar-analyze.sh              # Uses token from .env.local
#   ./scripts/sonar-analyze.sh <token>      # Uses provided token
#   SONAR_TOKEN=xxx ./scripts/sonar-analyze.sh  # Uses env variable
#
# Token priority:
#   1. Command line argument
#   2. SONAR_TOKEN environment variable
#   3. .env.local file in backend/
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$BACKEND_DIR/.env.local"

# Default configuration
DEFAULT_SONAR_HOST_URL="http://localhost:9001"
SONAR_PROJECT_KEY="truck-track"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TruckTrack - SonarQube Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Load .env.local if it exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Loading configuration from .env.local${NC}"
    # Source the file, ignoring comments and empty lines
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

# Get token (priority: arg > env > file)
if [ -n "$1" ]; then
    SONAR_TOKEN="$1"
    echo -e "Using token from command line argument"
elif [ -n "$SONAR_TOKEN" ]; then
    echo -e "Using token from environment/file"
else
    echo -e "${RED}ERROR: No SonarQube token provided.${NC}"
    echo ""
    echo "Options:"
    echo "  1. Create backend/.env.local with SONAR_TOKEN=your-token"
    echo "  2. Pass as argument: ./scripts/sonar-analyze.sh <token>"
    echo "  3. Set environment: export SONAR_TOKEN=<token>"
    echo ""
    exit 1
fi

# Get host URL (from env or default)
SONAR_HOST_URL="${SONAR_HOST_URL:-$DEFAULT_SONAR_HOST_URL}"
echo -e "SonarQube URL: ${BLUE}${SONAR_HOST_URL}${NC}"
echo ""

# Check if SonarQube is running
echo -e "${YELLOW}Checking SonarQube status...${NC}"
if ! curl -s "${SONAR_HOST_URL}/api/system/status" | grep -q '"status":"UP"'; then
    echo -e "${RED}ERROR: SonarQube is not running or not ready.${NC}"
    echo ""
    echo "Start SonarQube with:"
    echo "  cd infra/docker && docker-compose up -d sonarqube sonarqube-db"
    exit 1
fi
echo -e "${GREEN}SonarQube is running!${NC}"
echo ""

# Navigate to backend directory
cd "$BACKEND_DIR"
echo -e "${YELLOW}Working directory: ${BACKEND_DIR}${NC}"
echo ""

# Detect JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    # Try to find Java 17 on macOS
    if [ -d "/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home" ]; then
        export JAVA_HOME="/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home"
    elif command -v /usr/libexec/java_home &> /dev/null; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home)
    fi
fi
echo -e "JAVA_HOME: ${JAVA_HOME:-not set}"
echo ""

# Step 1: Clean and compile with tests
echo -e "${BLUE}Step 1/3: Building project and running tests...${NC}"
mvn clean verify -DskipTests=false -q

# Step 2: Generate JaCoCo coverage report
echo ""
echo -e "${BLUE}Step 2/3: Generating coverage report...${NC}"
mvn jacoco:report -q

# Step 3: Run SonarQube analysis
echo ""
echo -e "${BLUE}Step 3/3: Running SonarQube analysis...${NC}"
mvn sonar:sonar \
    -Psonar \
    -Dsonar.token="$SONAR_TOKEN" \
    -Dsonar.host.url="$SONAR_HOST_URL" \
    -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
    -q

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Analysis Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "View results at: ${BLUE}${SONAR_HOST_URL}/dashboard?id=${SONAR_PROJECT_KEY}${NC}"
echo ""

#!/bin/bash
# Restart all Truck Track services
# Usage: ./restart-all.sh [--build]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Truck Track - Restarting All Services   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Stop all services
echo -e "${BLUE}[1/2] Stopping all services...${NC}"
"$PROJECT_ROOT/stop-all.sh"

echo ""
sleep 2
echo ""

# Start all services
echo -e "${BLUE}[2/2] Starting all services...${NC}"
"$PROJECT_ROOT/start-all.sh" "$@"

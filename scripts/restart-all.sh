#!/bin/bash
# Restart all Truck Track services
# Usage: ./restart-all.sh [--build]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Truck Track - Restarting All Services   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Stop all services (--no-prompt to skip Docker confirmation)
echo -e "${BLUE}[1/2] Stopping all services...${NC}"
"$SCRIPT_DIR/stop-all.sh" --no-prompt

echo ""
sleep 2
echo ""

# Start all services
echo -e "${BLUE}[2/2] Starting all services...${NC}"
"$SCRIPT_DIR/start-all.sh" "$@"

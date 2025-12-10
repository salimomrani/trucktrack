#!/bin/bash
# Stop the Location Service

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_ROOT/.pids"

# Source stop-all.sh to get access to kill_process_tree function and variables
source "$PROJECT_ROOT/stop-all.sh"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Truck Track - Stopping Location Service    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

if [ -f "$PID_FILE" ]; then
  echo -e "${BLUE}Stopping Location Service from PID file...${NC}"
  echo ""

  # Source the PID file to get LOCATION_PID
  source "$PID_FILE"

  if [ -n "$LOCATION_PID" ]; then
    kill_process_tree "$LOCATION_PID" "Location Service"
    
    # Remove LOCATION_PID from the .pids file
    sed -i '' "/LOCATION_PID=/d" "$PID_FILE"
    echo -e "${GREEN}✓ LOCATION_PID removed from .pids file${NC}"
  else
    echo -e "${YELLOW}Location Service PID not found in .pids file.${NC}"
  fi
else
  echo -e "${YELLOW}No PID file found. Location Service might not be running or was not started via start-all.sh.${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Location Service Stop Attempted!      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

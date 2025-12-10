#!/bin/bash
# Start Docker Desktop and wait for it to be ready
# Usage: ./start-docker.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Starting Docker Desktop...           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is already running
if docker info > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Docker is already running!${NC}"
  docker version
  exit 0
fi

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Darwin*)
    echo -e "${BLUE}Detected macOS${NC}"
    echo -e "${YELLOW}Starting Docker Desktop...${NC}"

    # Try to open Docker Desktop
    if [ -d "/Applications/Docker.app" ]; then
      open -a Docker
      echo -e "${GREEN}✓ Docker Desktop opened${NC}"
    else
      echo -e "${RED}✗ Docker Desktop not found in /Applications/${NC}"
      echo ""
      echo -e "${YELLOW}Please install Docker Desktop:${NC}"
      echo "  https://www.docker.com/products/docker-desktop"
      exit 1
    fi
    ;;

  Linux*)
    echo -e "${BLUE}Detected Linux${NC}"
    echo -e "${YELLOW}Starting Docker service...${NC}"

    if command -v systemctl > /dev/null 2>&1; then
      sudo systemctl start docker
      echo -e "${GREEN}✓ Docker service started${NC}"
    else
      echo -e "${RED}✗ systemctl not found${NC}"
      echo "Please start Docker manually"
      exit 1
    fi
    ;;

  *)
    echo -e "${RED}✗ Unsupported OS: $OS${NC}"
    exit 1
    ;;
esac

# Wait for Docker to be ready
echo ""
echo -e "${YELLOW}Waiting for Docker to be ready...${NC}"

MAX_WAIT=60
COUNTER=0

while [ $COUNTER -lt $MAX_WAIT ]; do
  if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker is ready!${NC}"
    echo ""
    docker version
    echo ""
    echo -e "${GREEN}You can now run: ${BLUE}./start-all.sh${NC}"
    exit 0
  fi

  sleep 2
  COUNTER=$((COUNTER + 2))
  echo -ne "."
done

echo ""
echo -e "${RED}✗ Docker did not start within $MAX_WAIT seconds${NC}"
echo ""
echo -e "${YELLOW}Please check Docker Desktop manually${NC}"
exit 1

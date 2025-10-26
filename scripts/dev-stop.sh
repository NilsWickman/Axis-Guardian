#!/bin/bash

###############################################
# Axis Guardian Development Environment Stopper
#
# Stops all development services
#
# Usage:
#   ./scripts/dev-stop.sh
###############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}Stopping Axis Guardian development environment...${NC}"
echo ""

# Stop Python services
if [[ -f /tmp/axis-guardian-webrtc.pid ]]; then
    echo -n "Stopping WebRTC Detection Service... "
    kill $(cat /tmp/axis-guardian-webrtc.pid) 2>/dev/null || true
    rm /tmp/axis-guardian-webrtc.pid
    echo -e "${GREEN}✓${NC}"
fi

if [[ -f /tmp/axis-guardian-vapix.pid ]]; then
    echo -n "Stopping VAPIX API Simulator... "
    kill $(cat /tmp/axis-guardian-vapix.pid) 2>/dev/null || true
    rm /tmp/axis-guardian-vapix.pid
    echo -e "${GREEN}✓${NC}"
fi

# Stop camera streams
if [[ -f /tmp/axis-guardian-cameras.pid ]]; then
    echo -n "Stopping camera streams... "
    kill $(cat /tmp/axis-guardian-cameras.pid) 2>/dev/null || true
    # Also kill any child FFmpeg processes
    pkill -P $(cat /tmp/axis-guardian-cameras.pid) 2>/dev/null || true
    rm /tmp/axis-guardian-cameras.pid
    echo -e "${GREEN}✓${NC}"
fi

# Stop frontend
if [[ -f /tmp/axis-guardian-frontend.pid ]]; then
    echo -n "Stopping frontend dev server... "
    kill $(cat /tmp/axis-guardian-frontend.pid) 2>/dev/null || true
    rm /tmp/axis-guardian-frontend.pid
    echo -e "${GREEN}✓${NC}"
fi

# Stop Docker services
echo -n "Stopping Docker services... "
cd "$PROJECT_ROOT"
docker compose -f docker-compose.dev.yml down
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""

#!/bin/bash
# Test script for unified IP camera emulator

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CAMERA_IP="${1:-172.20.0.11}"
CAMERA_PORT="${2:-80}"

echo -e "${YELLOW}=== Testing Unified IP Camera Emulator ===${NC}"
echo -e "Camera: ${CAMERA_IP}:${CAMERA_PORT}\n"

# Test 1: Health endpoint
echo -e "${YELLOW}Test 1: Health Check${NC}"
if curl -sf "http://${CAMERA_IP}:${CAMERA_PORT}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health endpoint accessible${NC}"
    curl -s "http://${CAMERA_IP}:${CAMERA_PORT}/health" | jq .
else
    echo -e "${RED}✗ Health endpoint failed${NC}"
    exit 1
fi
echo ""

# Test 2: Root endpoint
echo -e "${YELLOW}Test 2: Root Endpoint${NC}"
if curl -sf "http://${CAMERA_IP}:${CAMERA_PORT}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Root endpoint accessible${NC}"
    curl -s "http://${CAMERA_IP}:${CAMERA_PORT}/" | jq .
else
    echo -e "${RED}✗ Root endpoint failed${NC}"
    exit 1
fi
echo ""

# Test 3: WebRTC stats endpoint
echo -e "${YELLOW}Test 3: WebRTC Statistics${NC}"
if curl -sf "http://${CAMERA_IP}:${CAMERA_PORT}/webrtc/stats" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ WebRTC stats endpoint accessible${NC}"
    curl -s "http://${CAMERA_IP}:${CAMERA_PORT}/webrtc/stats" | jq .
else
    echo -e "${RED}✗ WebRTC stats endpoint failed${NC}"
fi
echo ""

# Test 4: ONVIF DeviceInformation (requires python-onvif-zeep)
echo -e "${YELLOW}Test 4: ONVIF GetDeviceInformation${NC}"
if command -v onvif-cli &> /dev/null; then
    if onvif-cli devicemgmt GetDeviceInformation --host ${CAMERA_IP} --port ${CAMERA_PORT} --user admin --password axis123 2>&1 | grep -q "True:"; then
        echo -e "${GREEN}✓ ONVIF GetDeviceInformation successful${NC}"
        onvif-cli devicemgmt GetDeviceInformation --host ${CAMERA_IP} --port ${CAMERA_PORT} --user admin --password axis123
    else
        echo -e "${RED}✗ ONVIF GetDeviceInformation failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ onvif-cli not installed, skipping ONVIF tests${NC}"
    echo "  Install with: pip install onvif-zeep"
fi
echo ""

echo -e "${GREEN}=== Test Complete ===${NC}"

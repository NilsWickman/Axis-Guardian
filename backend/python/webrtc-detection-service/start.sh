#!/bin/bash
# Quick start script for WebRTC Detection Service

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}WebRTC Detection Service - Startup${NC}"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source venv/bin/activate
else
    echo -e "${YELLOW}Virtual environment not found. Please run: make webrtc-detect-install${NC}"
    exit 1
fi

# Start the service
echo -e "${GREEN}Starting WebRTC Detection Service...${NC}"
echo ""
python src/main.py

#!/bin/bash

###############################################
# Axis Guardian Development Environment Starter
#
# Starts complete development stack:
#   1. Docker services (Postgres, MediaMTX, Monitoring)
#   2. Python services (WebRTC, VAPIX)
#   3. Frontend dev server
#
# Usage:
#   ./scripts/dev-start.sh [options]
#
# Options:
#   --docker-only    Start only Docker services
#   --no-frontend    Skip frontend dev server
#   --no-cameras     Skip camera streaming
#   --help           Show this help
###############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_ONLY=false
NO_FRONTEND=false
NO_CAMERAS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker-only)
            DOCKER_ONLY=true
            shift
            ;;
        --no-frontend)
            NO_FRONTEND=true
            shift
            ;;
        --no-cameras)
            NO_CAMERAS=true
            shift
            ;;
        --help|-h)
            grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //'
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Axis Guardian Development Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
        exit 1
    fi

    if ! docker compose version &> /dev/null 2>&1; then
        echo -e "${RED}✗ docker compose not found. Please install Docker Compose.${NC}"
        exit 1
    fi

    if [[ "$DOCKER_ONLY" == false ]]; then
        if ! command -v python3 &> /dev/null; then
            echo -e "${RED}✗ Python 3 not found. Please install Python 3.${NC}"
            exit 1
        fi

        if ! command -v yarn &> /dev/null && [[ "$NO_FRONTEND" == false ]]; then
            echo -e "${YELLOW}⚠ Yarn not found. Frontend will be skipped.${NC}"
            NO_FRONTEND=true
        fi
    fi

    echo -e "${GREEN}✓ All prerequisites met${NC}"
    echo ""
}

# Start Docker services
start_docker_services() {
    echo -e "${BLUE}Starting Docker services...${NC}"

    cd "$PROJECT_ROOT"

    # Pull latest images
    docker compose -f docker-compose.dev.yml pull

    # Start services
    docker compose -f docker-compose.dev.yml up -d

    echo ""
    echo -e "${BLUE}Waiting for services to be ready...${NC}"

    # Wait for PostgreSQL
    echo -n "  Postgres: "
    for i in {1..30}; do
        if docker exec axis-guardian-postgres pg_isready -U dev &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done

    # Wait for Prometheus
    echo -n "  Prometheus: "
    for i in {1..30}; do
        if curl -s http://localhost:9090/-/healthy &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done

    # Wait for Grafana
    echo -n "  Grafana: "
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done

    # Wait for MediaMTX
    echo -n "  MediaMTX: "
    for i in {1..30}; do
        if curl -s http://localhost:9997/v3/config/global/get &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done

    echo ""
    echo -e "${GREEN}✓ Docker services ready${NC}"
    echo ""
}

# Start Python services
start_python_services() {
    echo -e "${BLUE}Starting Python services...${NC}"

    # Start WebRTC Detection Service
    echo "  Starting WebRTC Detection Service..."
    cd "$PROJECT_ROOT/simulation/webrtc-detection"

    if [[ ! -d ".venv" ]]; then
        echo "    Creating virtual environment with uv..."
        uv venv
        uv pip install -r requirements.txt
    fi
    source .venv/bin/activate

    nohup python src/main.py > logs/webrtc-detection.log 2>&1 &
    echo $! > /tmp/axis-guardian-webrtc.pid
    echo -e "    ${GREEN}✓ Started (PID: $(cat /tmp/axis-guardian-webrtc.pid))${NC}"

    # Start VAPIX API Simulator
    echo "  Starting VAPIX API Simulator..."
    cd "$PROJECT_ROOT/simulation/vapix-api"

    if [[ ! -d ".venv" ]]; then
        echo "    Creating virtual environment with uv..."
        uv venv
        uv pip install -r requirements.txt
    fi
    source .venv/bin/activate

    nohup python src/main.py > logs/vapix-api.log 2>&1 &
    echo $! > /tmp/axis-guardian-vapix.pid
    echo -e "    ${GREEN}✓ Started (PID: $(cat /tmp/axis-guardian-vapix.pid))${NC}"

    echo ""
    echo -e "${GREEN}✓ Python services started${NC}"
    echo ""
}

# Start camera streams
start_camera_streams() {
    echo -e "${BLUE}Starting camera streams...${NC}"

    cd "$PROJECT_ROOT"
    nohup ./simulation/scripts/stream-mock-cameras.sh all > /tmp/axis-guardian-cameras.log 2>&1 &
    echo $! > /tmp/axis-guardian-cameras.pid

    echo -e "${GREEN}✓ Camera streams started (PID: $(cat /tmp/axis-guardian-cameras.pid))${NC}"
    echo ""
}

# Start frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend dev server...${NC}"

    cd "$PROJECT_ROOT/frontend"

    if [[ ! -d "node_modules" ]]; then
        echo "  Installing dependencies..."
        yarn install
    fi

    nohup yarn dev > /tmp/axis-guardian-frontend.log 2>&1 &
    echo $! > /tmp/axis-guardian-frontend.pid

    echo -e "${GREEN}✓ Frontend started (PID: $(cat /tmp/axis-guardian-frontend.pid))${NC}"
    echo ""
}

# Display status
show_status() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Services Running               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Docker Services:${NC}"
    echo "  • PostgreSQL:      http://localhost:5432"
    echo "  • MediaMTX API:    http://localhost:9997"
    echo "  • Prometheus:      http://localhost:9090"
    echo "  • Grafana:         http://localhost:3000"
    echo "  • Node Exporter:   http://localhost:9100"
    echo "  • Redis:           localhost:6379"
    echo ""

    if [[ "$DOCKER_ONLY" == false ]]; then
        echo -e "${GREEN}Python Services:${NC}"
        echo "  • WebRTC Detection: http://localhost:8080"
        echo "  • VAPIX Simulator:  http://localhost:8090"
        echo ""

        if [[ "$NO_FRONTEND" == false ]]; then
            echo -e "${GREEN}Frontend:${NC}"
            echo "  • Dev Server:      http://localhost:5173"
            echo ""
        fi
    fi

    echo -e "${YELLOW}Grafana Credentials:${NC}"
    echo "  Username: admin"
    echo "  Password: admin"
    echo ""
    echo -e "${YELLOW}Logs:${NC}"
    echo "  Docker:    docker compose -f docker-compose.dev.yml logs -f"
    echo "  WebRTC:    tail -f simulation/webrtc-detection/logs/webrtc-detection.log"
    echo "  VAPIX:     tail -f simulation/vapix-api/logs/vapix-api.log"
    echo "  Cameras:   tail -f /tmp/axis-guardian-cameras.log"
    echo "  Frontend:  tail -f /tmp/axis-guardian-frontend.log"
    echo ""
    echo -e "${YELLOW}Stop all services:${NC}"
    echo "  ./scripts/dev-stop.sh"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    start_docker_services

    if [[ "$DOCKER_ONLY" == false ]]; then
        start_python_services

        if [[ "$NO_CAMERAS" == false ]]; then
            start_camera_streams
        fi

        if [[ "$NO_FRONTEND" == false ]]; then
            start_frontend
        fi
    fi

    show_status

    echo -e "${GREEN}✓ Development environment ready!${NC}"
    echo ""
}

# Run main
main

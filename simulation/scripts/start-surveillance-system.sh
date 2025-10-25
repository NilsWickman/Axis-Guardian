#!/bin/bash

###############################################
# Unified Surveillance System Launcher
#
# This script starts the complete surveillance system:
# 1. Camera streams (MediaMTX)
# 2. Object detection service (optional)
#
# Usage:
#   ./start-surveillance-system.sh [cameras|detection|all]
#
# Requirements:
#   - FFmpeg installed
#   - MediaMTX running (via Docker Compose)
#   - Python environment for detection (if using detection)
###############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="${PROJECT_ROOT}/simulation/scripts"
PID_DIR="/tmp/surveillance-system"
MEDIAMTX_HOST="${MEDIAMTX_HOST:-localhost}"
MEDIAMTX_PORT="${MEDIAMTX_PORT:-8554}"

# Video configurations
VIDEOS_DIR="${PROJECT_ROOT}/shared/cameras"
declare -A CAMERA_VIDEOS=(
    ["camera1"]="people-detection.mp4"
    ["camera2"]="car-detection.mp4"
    ["camera3"]="person-bicycle-car-detection.mp4"
)

# Create PID directory
mkdir -p "$PID_DIR"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down surveillance system...${NC}"

    # Kill all camera streams
    if [[ -f "${PID_DIR}/cameras.pids" ]]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Stopping camera stream (PID: ${pid})${NC}"
                kill "$pid" 2>/dev/null || true
            fi
        done < "${PID_DIR}/cameras.pids"
        rm "${PID_DIR}/cameras.pids"
    fi

    # Kill detection service
    if [[ -f "${PID_DIR}/detection.pid" ]]; then
        local pid=$(cat "${PID_DIR}/detection.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping detection service (PID: ${pid})${NC}"
            kill "$pid" 2>/dev/null || true
        fi
        rm "${PID_DIR}/detection.pid"
    fi

    echo -e "${GREEN}✓ Surveillance system stopped${NC}"
    exit 0
}

# Register cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# Function to check if FFmpeg is installed
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}Error: FFmpeg is not installed${NC}"
        echo "Install it with: sudo apt-get install ffmpeg"
        exit 1
    fi
}

# Function to check if MediaMTX is running
check_mediamtx() {
    if ! curl -s "http://${MEDIAMTX_HOST}:9997/v3/config/global/get" > /dev/null 2>&1; then
        echo -e "${RED}Error: MediaMTX is not running${NC}"
        echo "Start it with: make database"
        exit 1
    fi
    echo -e "${GREEN}✓ MediaMTX is running${NC}"
}

# Function to stream a single camera with looping
stream_camera() {
    local camera_name="$1"
    local video_file="${CAMERA_VIDEOS[$camera_name]}"
    local video_path="${VIDEOS_DIR}/${video_file}"
    local rtsp_url="rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera_name}"

    if [[ ! -f "$video_path" ]]; then
        echo -e "${RED}Error: Video file not found: ${video_path}${NC}"
        return 1
    fi

    echo -e "${GREEN}Starting ${camera_name}${NC}"
    echo "  Video: ${video_file}"
    echo "  RTSP: ${rtsp_url}"

    # Stream with FFmpeg in background (infinite loop)
    ffmpeg \
        -re \
        -stream_loop -1 \
        -i "${video_path}" \
        -c:v libx264 \
        -preset ultrafast \
        -tune zerolatency \
        -b:v 2M \
        -maxrate 2M \
        -bufsize 4M \
        -g 30 \
        -c:a aac \
        -b:a 128k \
        -rtsp_transport tcp \
        -f rtsp \
        "${rtsp_url}" \
        > /dev/null 2>&1 &

    local pid=$!
    echo "$pid" >> "${PID_DIR}/cameras.pids"
    echo -e "${BLUE}  PID: ${pid}${NC}"
}

# Function to start all camera streams
start_cameras() {
    echo -e "${GREEN}Starting camera streams...${NC}"
    echo ""

    # Clear old PID file
    rm -f "${PID_DIR}/cameras.pids"

    # Start each camera
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        stream_camera "$camera"
    done

    echo ""
    echo -e "${GREEN}✓ All cameras started${NC}"
    echo ""
    echo "Stream URLs:"
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        echo "  ${camera}: rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera}"
    done
}

# Function to start detection service
start_detection() {
    echo ""
    echo -e "${GREEN}Starting object detection service...${NC}"

    local detection_dir="${PROJECT_ROOT}/simulation/services/object-detection"

    if [[ ! -d "$detection_dir" ]]; then
        echo -e "${RED}Error: Detection service not found at ${detection_dir}${NC}"
        return 1
    fi

    # Check if virtual environment exists
    if [[ ! -d "${detection_dir}/venv" ]]; then
        echo -e "${YELLOW}Virtual environment not found. Run: make detect-install${NC}"
        return 1
    fi

    # Start detection service in background
    cd "$detection_dir"
    source venv/bin/activate

    python src/main.py > /dev/null 2>&1 &
    local pid=$!
    echo "$pid" > "${PID_DIR}/detection.pid"

    echo -e "${GREEN}✓ Detection service started${NC}"
    echo -e "${BLUE}  PID: ${pid}${NC}"
    echo "  MQTT: surveillance/detections/#"

    cd "$PROJECT_ROOT"
}

# Function to show system status
show_status() {
    echo ""
    echo -e "${BLUE}=== Surveillance System Status ===${NC}"
    echo ""

    # Check cameras
    if [[ -f "${PID_DIR}/cameras.pids" ]]; then
        local count=$(wc -l < "${PID_DIR}/cameras.pids")
        echo -e "${GREEN}✓ Cameras: ${count} streams running${NC}"
    else
        echo -e "${YELLOW}○ Cameras: Not running${NC}"
    fi

    # Check detection
    if [[ -f "${PID_DIR}/detection.pid" ]]; then
        local pid=$(cat "${PID_DIR}/detection.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✓ Detection: Running (PID: ${pid})${NC}"
        else
            echo -e "${YELLOW}○ Detection: Stopped${NC}"
        fi
    else
        echo -e "${YELLOW}○ Detection: Not running${NC}"
    fi

    echo ""
    echo "Press Ctrl+C to stop the system"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [cameras|detection|all]"
    echo ""
    echo "Options:"
    echo "  cameras    - Start only camera streams (infinite loop)"
    echo "  detection  - Start only object detection service"
    echo "  all        - Start cameras + detection (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Start everything"
    echo "  $0 all          # Start everything"
    echo "  $0 cameras      # Start only cameras"
    echo "  $0 detection    # Start only detection"
    echo ""
    echo "Environment Variables:"
    echo "  MEDIAMTX_HOST  - MediaMTX hostname (default: localhost)"
    echo "  MEDIAMTX_PORT  - MediaMTX RTSP port (default: 8554)"
}

# Main script
main() {
    local mode="${1:-all}"

    echo -e "${BLUE}=== Surveillance System Launcher ===${NC}"
    echo ""

    case "$mode" in
        cameras)
            check_ffmpeg
            check_mediamtx
            start_cameras
            show_status
            # Keep running
            while true; do sleep 1; done
            ;;
        detection)
            check_mediamtx
            start_detection
            show_status
            # Keep running
            while true; do sleep 1; done
            ;;
        all)
            check_ffmpeg
            check_mediamtx
            start_cameras
            start_detection
            show_status
            # Keep running
            while true; do sleep 1; done
            ;;
        help|-h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown mode: ${mode}${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

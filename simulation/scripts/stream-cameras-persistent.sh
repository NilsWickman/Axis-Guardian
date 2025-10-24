#!/bin/bash

###############################################
# Persistent Mock Camera Stream Publisher
#
# This script continuously streams cameras with
# automatic restart on failure for 24/7 operation.
#
# Usage:
#   ./stream-cameras-persistent.sh [camera1|camera2|all]
###############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MEDIAMTX_HOST="${MEDIAMTX_HOST:-localhost}"
MEDIAMTX_PORT="${MEDIAMTX_PORT:-8554}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VIDEOS_DIR="${PROJECT_ROOT}/shared/mock/camera-feeds"
RESTART_DELAY="${RESTART_DELAY:-5}"  # Seconds between restarts
MAX_RETRIES="${MAX_RETRIES:-0}"      # 0 = infinite retries

# Video file mappings
declare -A CAMERA_VIDEOS=(
    ["camera1"]="new_site.mp4"
    ["camera2"]="low_old.mp4"
)

# Track restart counts
declare -A RESTART_COUNTS

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
        echo -e "${YELLOW}Warning: MediaMTX may not be running${NC}"
        echo "Start it with: make database"
        return 1
    fi
    return 0
}

# Function to stream a camera with auto-restart
stream_camera_persistent() {
    local camera_name="$1"
    local video_file="${CAMERA_VIDEOS[$camera_name]}"
    local rtsp_url="rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera_name}"
    local video_path="${VIDEOS_DIR}/${video_file}"
    local retry_count=0

    RESTART_COUNTS[$camera_name]=0

    echo -e "${GREEN}Starting persistent stream: ${camera_name}${NC}"
    echo "  Video: ${video_file}"
    echo "  RTSP URL: ${rtsp_url}"
    echo "  Auto-restart: ENABLED"
    echo ""

    while true; do
        # Check if we've hit max retries (if set)
        if [[ $MAX_RETRIES -gt 0 && $retry_count -ge $MAX_RETRIES ]]; then
            echo -e "${RED}[${camera_name}] Max retries ($MAX_RETRIES) reached. Stopping.${NC}"
            break
        fi

        # Log restart if not first attempt
        if [[ $retry_count -gt 0 ]]; then
            echo -e "${YELLOW}[${camera_name}] Restarting stream (attempt $((retry_count + 1)))...${NC}"
            RESTART_COUNTS[$camera_name]=$((RESTART_COUNTS[$camera_name] + 1))
            sleep $RESTART_DELAY
        fi

        # Start FFmpeg stream
        echo -e "${BLUE}[${camera_name}] Starting FFmpeg...${NC}"

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
            2>&1 | grep -v "^frame=" || true

        local exit_code=$?

        # Log the failure
        echo -e "${YELLOW}[${camera_name}] Stream stopped (exit code: $exit_code)${NC}"

        retry_count=$((retry_count + 1))
    done

    echo -e "${RED}[${camera_name}] Stream terminated${NC}"
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all streams...${NC}"

    # Kill all FFmpeg processes
    pkill -P $$ ffmpeg 2>/dev/null || true

    # Show restart statistics
    echo ""
    echo -e "${BLUE}Stream Statistics:${NC}"
    for camera in "${!RESTART_COUNTS[@]}"; do
        echo "  ${camera}: ${RESTART_COUNTS[$camera]} restarts"
    done

    exit 0
}

# Setup signal handlers
trap cleanup SIGINT SIGTERM

# Function to stream all cameras
stream_all_persistent() {
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Persistent Camera Stream Service${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Configuration:${NC}"
    echo "  MediaMTX: ${MEDIAMTX_HOST}:${MEDIAMTX_PORT}"
    echo "  Restart Delay: ${RESTART_DELAY}s"
    echo "  Max Retries: $([ $MAX_RETRIES -eq 0 ] && echo 'Infinite' || echo $MAX_RETRIES)"
    echo "  Cameras: ${!CAMERA_VIDEOS[@]}"
    echo ""

    # Check MediaMTX
    if check_mediamtx; then
        echo -e "${GREEN}✓ MediaMTX is running${NC}"
    else
        echo -e "${YELLOW}⚠ MediaMTX check failed, but continuing anyway...${NC}"
    fi
    echo ""

    # Start each camera in background
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        stream_camera_persistent "$camera" &
    done

    echo -e "${GREEN}All cameras started!${NC}"
    echo "Press Ctrl+C to stop all streams."
    echo ""

    # Wait for all background processes
    wait
}

# Main script
main() {
    local target="${1:-all}"

    # Check prerequisites
    check_ffmpeg

    case "$target" in
        all)
            stream_all_persistent
            ;;
        camera1|camera2)
            if [[ -z "${CAMERA_VIDEOS[$target]}" ]]; then
                echo -e "${RED}Error: Unknown camera: ${target}${NC}"
                exit 1
            fi
            stream_camera_persistent "$target"
            ;;
        *)
            echo -e "${RED}Error: Unknown target: ${target}${NC}"
            echo "Usage: $0 [all|camera1|camera2]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

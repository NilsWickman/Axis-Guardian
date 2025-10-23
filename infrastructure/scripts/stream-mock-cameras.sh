#!/bin/bash

###############################################
# Mock Camera Stream Publisher
#
# This script publishes mock video files to MediaMTX
# as simulated camera feeds for development and testing.
#
# Usage:
#   ./stream-mock-cameras.sh [all|camera1|camera2]
#
# Requirements:
#   - FFmpeg installed
#   - MediaMTX running (via Docker Compose)
#   - Video files in shared/mock/camera-feeds/
###############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MEDIAMTX_HOST="${MEDIAMTX_HOST:-localhost}"
MEDIAMTX_PORT="${MEDIAMTX_PORT:-8554}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VIDEOS_DIR="${PROJECT_ROOT}/shared/mock/camera-feeds/real-footage"

# Video file mappings (using real surveillance footage with detections)
declare -A CAMERA_VIDEOS=(
    ["camera1"]="people-detection.mp4"
    ["camera2"]="car-detection.mp4"
    ["camera3"]="person-bicycle-car-detection.mp4"
)

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
        echo "Start it with: make database (starts all infrastructure)"
        echo "Continuing anyway..."
    else
        echo -e "${GREEN}✓ MediaMTX is running${NC}"
    fi
}

# Function to check if video file exists
check_video() {
    local video_file="$1"
    if [[ ! -f "${VIDEOS_DIR}/${video_file}" ]]; then
        echo -e "${RED}Error: Video file not found: ${VIDEOS_DIR}/${video_file}${NC}"
        return 1
    fi
    return 0
}

# Function to stream a camera feed
stream_camera() {
    local camera_name="$1"
    local video_file="${CAMERA_VIDEOS[$camera_name]}"

    if [[ -z "$video_file" ]]; then
        echo -e "${RED}Error: Unknown camera: ${camera_name}${NC}"
        echo "Available cameras: ${!CAMERA_VIDEOS[@]}"
        return 1
    fi

    if ! check_video "$video_file"; then
        return 1
    fi

    local rtsp_url="rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera_name}"
    local video_path="${VIDEOS_DIR}/${video_file}"

    echo -e "${GREEN}Streaming ${camera_name}${NC}"
    echo "  Video: ${video_file}"
    echo "  RTSP URL: ${rtsp_url}"
    echo "  Press Ctrl+C to stop"
    echo ""

    # Stream with FFmpeg
    # -re: Read input at native frame rate
    # -stream_loop -1: Loop infinitely
    # -i: Input file
    # -c:v libx264: Re-encode with H.264 (can use 'copy' if already H.264)
    # -preset ultrafast: Fast encoding for low latency
    # -tune zerolatency: Optimize for low latency streaming
    # -rtsp_transport tcp: Use TCP for RTSP (required by MediaMTX config)
    # -f rtsp: Output format
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
        "${rtsp_url}"
}

# Function to stream all cameras in parallel
stream_all() {
    echo -e "${GREEN}Starting all mock camera streams${NC}"
    echo ""

    # Create a temporary directory for PID files
    local pid_dir="/tmp/mediamtx-streams"
    mkdir -p "$pid_dir"

    # Start each camera in background
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        stream_camera "$camera" &
        local pid=$!
        echo "$pid" > "${pid_dir}/${camera}.pid"
        echo -e "${GREEN}Started ${camera} (PID: ${pid})${NC}"
    done

    echo ""
    echo "All cameras started. Press Ctrl+C to stop all streams."
    echo "Stream URLs:"
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        echo "  ${camera}: rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera}"
    done

    # Wait for all background processes
    wait

    # Cleanup PID files
    rm -rf "$pid_dir"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [all|camera1|camera2|camera3]"
    echo ""
    echo "Options:"
    echo "  all      - Stream all available cameras"
    echo "  camera1  - Stream camera 1 (people-detection.mp4)"
    echo "  camera2  - Stream camera 2 (car-detection.mp4)"
    echo "  camera3  - Stream camera 3 (person-bicycle-car-detection.mp4)"
    echo ""
    echo "Examples:"
    echo "  $0 all              # Stream all cameras"
    echo "  $0 camera1          # Stream only camera1"
    echo ""
    echo "Environment Variables:"
    echo "  MEDIAMTX_HOST  - MediaMTX hostname (default: localhost)"
    echo "  MEDIAMTX_PORT  - MediaMTX RTSP port (default: 8554)"
}

# Main script
main() {
    local target="${1:-all}"

    # Check prerequisites
    check_ffmpeg
    check_mediamtx

    echo ""

    case "$target" in
        all)
            stream_all
            ;;
        camera1|camera2|camera3)
            stream_camera "$target"
            ;;
        help|-h|--help)
            show_usage
            ;;
        *)
            echo -e "${RED}Error: Unknown target: ${target}${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

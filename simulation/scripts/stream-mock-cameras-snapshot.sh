#!/bin/bash

###############################################
# Mock Camera Snapshot Publisher
#
# This script generates periodic JPEG snapshots from mock video files
# for ultra-low bandwidth scenarios (e.g., SSH tunneling, remote access).
#
# Usage:
#   ./stream-mock-cameras-snapshot.sh [all|camera1|camera2]
#
# Requirements:
#   - FFmpeg installed
#   - Video files in shared/cameras/
###############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VIDEOS_DIR="${PROJECT_ROOT}/shared/cameras"
PREPROCESSED_DIR="${VIDEOS_DIR}/preprocessed"
SNAPSHOTS_DIR="${PROJECT_ROOT}/simulation/snapshots"

# Load .env file if it exists
if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
fi

# Snapshot configuration (from .env or defaults)
SNAPSHOT_INTERVAL="${SNAPSHOT_INTERVAL:-2.0}"
SNAPSHOT_QUALITY="${SNAPSHOT_QUALITY:-30}"
SNAPSHOT_WIDTH="${SNAPSHOT_WIDTH:-320}"

# Video file mappings
declare -A CAMERA_VIDEOS=(
    ["camera1"]="view-HC3-preprocessed.mp4"
    ["camera2"]="view-HC4-preprocessed.mp4"
    ["camera3"]="view-IP2-preprocessed.mp4"
    ["camera4"]="view-IP5-preprocessed.mp4"
)

# Source videos (fallback if preprocessed not available)
declare -A SOURCE_VIDEOS=(
    ["camera1"]="view-HC3.mp4"
    ["camera2"]="view-HC4.mp4"
    ["camera3"]="view-IP2.mp4"
    ["camera4"]="view-IP5.mp4"
)

# Create snapshots directory
mkdir -p "${SNAPSHOTS_DIR}"

# Function to check if FFmpeg is installed
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}Error: FFmpeg is not installed${NC}"
        echo "Install it with: sudo apt-get install ffmpeg"
        exit 1
    fi
}

# Function to get video path (same logic as stream-mock-cameras.sh)
get_video_path() {
    local camera_name="$1"
    local preprocessed_file="${CAMERA_VIDEOS[$camera_name]}"
    local source_file="${SOURCE_VIDEOS[$camera_name]}"
    local use_preprocessed="${USE_PREPROCESSED_VIDEOS:-true}"
    local quality="${PREPROCESSED_QUALITY:-720p}"

    # If USE_PREPROCESSED_VIDEOS is true, try pre-processed version first
    if [[ "$use_preprocessed" == "true" ]]; then
        # Try specified quality first
        if [[ -f "${PREPROCESSED_DIR}/${quality}/${preprocessed_file}" ]]; then
            echo "${PREPROCESSED_DIR}/${quality}/${preprocessed_file}"
            return 0
        fi

        # Try all qualities (highest first)
        for fallback_quality in 4k 1440p 1080p 720p 480p 360p; do
            if [[ -f "${PREPROCESSED_DIR}/${fallback_quality}/${preprocessed_file}" ]]; then
                echo -e "${YELLOW}Using ${fallback_quality} (${quality} not found)${NC}" >&2
                echo "${PREPROCESSED_DIR}/${fallback_quality}/${preprocessed_file}"
                return 0
            fi
        done
    fi

    # Fall back to source video
    if [[ -f "${VIDEOS_DIR}/${source_file}" ]]; then
        if [[ "$use_preprocessed" == "true" ]]; then
            echo -e "${YELLOW}Warning: Pre-processed video not found, using source video${NC}" >&2
        fi
        echo "${VIDEOS_DIR}/${source_file}"
        return 0
    fi

    echo -e "${RED}Error: No video found for ${camera_name}${NC}" >&2
    return 1
}

# Function to generate snapshots for a camera
snapshot_camera() {
    local camera_name="$1"

    if [[ -z "${CAMERA_VIDEOS[$camera_name]}" ]]; then
        echo -e "${RED}Error: Unknown camera: ${camera_name}${NC}"
        echo "Available cameras: ${!CAMERA_VIDEOS[@]}"
        return 1
    fi

    # Get the best available video path
    local video_path
    video_path=$(get_video_path "$camera_name")
    if [[ $? -ne 0 ]]; then
        return 1
    fi

    local snapshot_dir="${SNAPSHOTS_DIR}/${camera_name}"
    mkdir -p "$snapshot_dir"

    local video_name=$(basename "$video_path")
    local is_preprocessed=false

    if [[ "$video_path" == *"/preprocessed/"* ]]; then
        is_preprocessed=true
    fi

    echo -e "${GREEN}Generating snapshots for ${camera_name}${NC}"
    echo "  Video: ${video_name}"
    if [[ "$is_preprocessed" == true ]]; then
        echo -e "  ${GREEN}✓ Using pre-processed video${NC}"
    else
        echo -e "  ${YELLOW}⚠ Using source video${NC}"
    fi
    echo "  Output: ${snapshot_dir}/"
    echo "  Interval: ${SNAPSHOT_INTERVAL}s"
    echo "  Quality: ${SNAPSHOT_QUALITY}"
    echo "  Width: ${SNAPSHOT_WIDTH}px"
    echo "  Press Ctrl+C to stop"
    echo ""

    # Calculate FPS from interval (e.g., 2.0s -> 0.5 fps)
    local fps=$(echo "scale=3; 1 / $SNAPSHOT_INTERVAL" | bc)

    # Generate snapshots continuously in a loop
    # Using -stream_loop -1 to loop the video indefinitely
    # Using fps filter to extract frames at the desired rate
    # Using scale filter to resize to target width (maintaining aspect ratio)
    # Using -q:v for JPEG quality (1=best, 31=worst, we use inverse: 31-quality/3.33)
    local jpeg_q=$(echo "scale=0; 31 - ($SNAPSHOT_QUALITY / 3.33)" | bc)

    # Ensure quality is in valid range (2-31)
    if (( $(echo "$jpeg_q < 2" | bc -l) )); then
        jpeg_q=2
    elif (( $(echo "$jpeg_q > 31" | bc -l) )); then
        jpeg_q=31
    fi

    # Loop the video and extract frames at specified rate
    # Output filename pattern: camera1_NNNN.jpg (always overwrites last N frames)
    # We keep a circular buffer of 10 snapshots
    while true; do
        ffmpeg \
            -re \
            -stream_loop -1 \
            -i "${video_path}" \
            -vf "fps=${fps},scale=${SNAPSHOT_WIDTH}:-2" \
            -q:v ${jpeg_q} \
            -f image2 \
            -update 1 \
            "${snapshot_dir}/latest.jpg" \
            2>/dev/null

        # If ffmpeg exits (error), wait a bit and retry
        echo -e "${YELLOW}FFmpeg exited, restarting in 2 seconds...${NC}" >&2
        sleep 2
    done
}

# Function to snapshot all cameras in parallel
snapshot_all() {
    echo -e "${GREEN}Starting snapshot generation for all cameras${NC}"
    echo ""

    # Create a temporary directory for PID files
    local pid_dir="/tmp/snapshot-streams"
    mkdir -p "$pid_dir"

    # Start each camera in background
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        snapshot_camera "$camera" &
        local pid=$!
        echo "$pid" > "${pid_dir}/${camera}.pid"
        echo -e "${GREEN}Started ${camera} (PID: ${pid})${NC}"
    done

    echo ""
    echo "All snapshot generators started. Press Ctrl+C to stop all."
    echo "Snapshot locations:"
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        echo "  ${camera}: ${SNAPSHOTS_DIR}/${camera}/latest.jpg"
    done

    # Wait for all background processes
    wait

    # Cleanup PID files
    rm -rf "$pid_dir"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [all|camera1|camera2|camera3|camera4]"
    echo ""
    echo "Options:"
    echo "  all      - Generate snapshots for all available cameras"
    echo "  camera1  - Generate snapshots for camera 1"
    echo "  camera2  - Generate snapshots for camera 2"
    echo "  camera3  - Generate snapshots for camera 3"
    echo "  camera4  - Generate snapshots for camera 4"
    echo ""
    echo "Environment Variables (from .env):"
    echo "  SNAPSHOT_INTERVAL  - Seconds between snapshots (default: 2.0)"
    echo "  SNAPSHOT_QUALITY   - JPEG quality 1-100 (default: 30)"
    echo "  SNAPSHOT_WIDTH     - Width in pixels (default: 320)"
    echo ""
    echo "Snapshots are continuously generated and stored in:"
    echo "  simulation/snapshots/{camera_name}/latest.jpg"
}

# Main script
main() {
    local target="${1:-all}"

    # Check prerequisites
    check_ffmpeg

    echo ""

    case "$target" in
        all)
            snapshot_all
            ;;
        camera1|camera2|camera3|camera4)
            snapshot_camera "$target"
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

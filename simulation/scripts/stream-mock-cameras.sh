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
VIDEOS_DIR="${PROJECT_ROOT}/shared/cameras"
PREPROCESSED_DIR="${VIDEOS_DIR}/preprocessed"
SCRIPTS_DIR="${PROJECT_ROOT}/simulation/scripts"

# GPU detection
GPU_ENCODER=""
GPU_ENCODING_ENABLED="${GPU_ENCODING_ENABLED:-true}"

# Detect GPU capabilities on first run
detect_gpu_encoder() {
    if [[ "$GPU_ENCODING_ENABLED" != "true" ]]; then
        echo "libx264"
        return
    fi

    if [[ -z "$GPU_ENCODER" ]]; then
        if [[ -x "${SCRIPTS_DIR}/detect_gpu_capabilities.sh" ]]; then
            GPU_ENCODER=$("${SCRIPTS_DIR}/detect_gpu_capabilities.sh" detect)

            if [[ "$GPU_ENCODER" != "libx264" ]]; then
                echo -e "${GREEN}✓ GPU hardware encoding available: ${GPU_ENCODER}${NC}" >&2
            else
                echo -e "${YELLOW}⚠ No GPU encoding available, using software encoding${NC}" >&2
            fi
        else
            GPU_ENCODER="libx264"
        fi
    fi

    echo "$GPU_ENCODER"
}

# Video file mappings
# Priority: Use pre-processed videos if available, otherwise fall back to source
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

# Function to check if video file exists and get the best version
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
            echo -e "${YELLOW}Run 'make preprocess-videos' to generate optimized videos${NC}" >&2
        fi
        echo "${VIDEOS_DIR}/${source_file}"
        return 0
    fi

    echo -e "${RED}Error: No video found for ${camera_name}${NC}" >&2
    echo -e "${YELLOW}Expected: ${PREPROCESSED_DIR}/${quality}/${preprocessed_file} or ${VIDEOS_DIR}/${source_file}${NC}" >&2
    return 1
}

# Function to stream a camera feed
stream_camera() {
    local camera_name="$1"
    local sync_start_time="${2:-}"  # Optional: synchronized start time for multi-camera sync

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

    local rtsp_url="rtsp://${MEDIAMTX_HOST}:${MEDIAMTX_PORT}/${camera_name}"
    local video_name=$(basename "$video_path")
    local is_preprocessed=false

    if [[ "$video_path" == *"/preprocessed/"* ]]; then
        is_preprocessed=true
    fi

    echo -e "${GREEN}Streaming ${camera_name}${NC}"
    echo "  Video: ${video_name}"
    if [[ "$is_preprocessed" == true ]]; then
        echo -e "  ${GREEN}✓ Using pre-processed video (optimized)${NC}"
    else
        echo -e "  ${YELLOW}⚠ Using source video (not optimized)${NC}"
    fi
    echo "  RTSP URL: ${rtsp_url}"
    if [[ -n "$sync_start_time" ]]; then
        echo -e "  ${GREEN}✓ Synchronized start enabled${NC}"
    fi
    echo "  Press Ctrl+C to stop"
    echo ""

    # Build synchronized timing flags if sync_start_time is provided
    local sync_flags=""
    if [[ -n "$sync_start_time" ]]; then
        # Use start_at_zero and setpts to reset PTS on each loop iteration
        # This ensures all cameras stay synchronized even across loop boundaries
        # The setpts filter resets the presentation timestamp to start from 0
        sync_flags="-start_at_zero"
    fi

    # Stream with FFmpeg
    # For pre-processed videos: Use optimized settings for low-latency RTSP
    # For source videos: Re-encode for compatibility
    if [[ "$is_preprocessed" == true ]]; then
        # Detect codec to determine if we can use stream copy
        local codec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${video_path}" 2>/dev/null)

        if [[ "$codec" == "h264" ]]; then
            # H.264 videos: Optimized streaming
            # Check if video is too high resolution/bitrate for current setup
            local width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "${video_path}" 2>/dev/null)

            if [[ "$width" -gt 1280 ]]; then
                # High res video (>720p): Re-encode to reduce bitrate for smoother streaming
                local encoder=$(detect_gpu_encoder)
                local encoder_flags

                if [[ "$encoder" != "libx264" ]]; then
                    echo -e "  ${GREEN}✓ Using GPU encoder: $encoder${NC}"
                    encoder_flags=$("${SCRIPTS_DIR}/detect_gpu_capabilities.sh" flags "$encoder" "2M" "fast")
                else
                    echo -e "  ${YELLOW}⚠ High resolution ($width px), re-encoding for smoother streaming${NC}" >&2
                    echo -e "  ${YELLOW}  For best performance, re-render at 720p: make prerender-videos-force${NC}" >&2
                    encoder_flags="-c:v libx264 -preset veryfast -tune zerolatency -profile:v baseline -level 3.1 -b:v 2M -maxrate 2M -bufsize 1M -g 30 -keyint_min 30 -sc_threshold 0"
                fi

                # Build video filter with PTS reset for loop synchronization
                local vf_scale=""
                if [[ -n "$sync_start_time" ]]; then
                    # Add setpts filter to reset timestamps on each loop
                    vf_scale="scale=1280:-2,setpts=PTS-STARTPTS"
                else
                    vf_scale="scale=1280:-2"
                fi

                # VAAPI requires input scaling via filter
                if [[ "$encoder" == "h264_vaapi" ]]; then
                    # VAAPI can't use setpts easily, use scale_vaapi only
                    local vf_vaapi="scale_vaapi=1280:-2"
                    ffmpeg \
                        -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi \
                        -re \
                        -stream_loop -1 \
                        ${sync_flags} \
                        -i "${video_path}" \
                        -vf "${vf_vaapi}" \
                        ${encoder_flags} \
                        -fflags nobuffer \
                        -flags low_delay \
                        -rtsp_transport tcp \
                        -rtbufsize 10M \
                        -max_delay 0 \
                        -f rtsp \
                        "${rtsp_url}"
                else
                    ffmpeg \
                        -re \
                        -stream_loop -1 \
                        ${sync_flags} \
                        -i "${video_path}" \
                        -vf "${vf_scale}" \
                        ${encoder_flags} \
                        -fflags nobuffer \
                        -flags low_delay \
                        -rtsp_transport tcp \
                        -rtbufsize 10M \
                        -max_delay 0 \
                        -f rtsp \
                        "${rtsp_url}"
                fi
            else
                # 720p or lower: Stream copy (no re-encoding)
                ffmpeg \
                    -re \
                    -stream_loop -1 \
                    ${sync_flags} \
                    -i "${video_path}" \
                    -c:v copy \
                    -c:a copy \
                    -bsf:v h264_mp4toannexb \
                    -rtsp_transport tcp \
                    -rtbufsize 10M \
                    -max_delay 0 \
                    -fflags nobuffer \
                    -flags low_delay \
                    -f rtsp \
                    "${rtsp_url}"
            fi
        else
            # MPEG-4 or other codecs: Re-encode to H.264
            local encoder=$(detect_gpu_encoder)
            local encoder_flags

            if [[ "$encoder" != "libx264" ]]; then
                echo -e "  ${GREEN}✓ Re-encoding with GPU encoder: $encoder${NC}"
                encoder_flags=$("${SCRIPTS_DIR}/detect_gpu_capabilities.sh" flags "$encoder" "4M" "fast")
            else
                echo -e "  ${YELLOW}⚠ Video is ${codec}, re-encoding to H.264 for RTSP compatibility${NC}" >&2
                echo -e "  ${YELLOW}  Recommendation: Re-render with 'make prerender-videos-force' for better performance${NC}" >&2
                encoder_flags="-c:v libx264 -preset ultrafast -tune zerolatency -profile:v baseline -level 3.1 -b:v 4M -maxrate 4M -bufsize 2M -g 30 -keyint_min 30 -sc_threshold 0"
            fi

            # VAAPI requires hardware acceleration setup
            if [[ "$encoder" == "h264_vaapi" ]]; then
                ffmpeg \
                    -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi \
                    -re \
                    -stream_loop -1 \
                    ${sync_flags} \
                    -i "${video_path}" \
                    ${encoder_flags} \
                    -fflags nobuffer \
                    -flags low_delay \
                    -rtsp_transport tcp \
                    -rtbufsize 10M \
                    -max_delay 0 \
                    -f rtsp \
                    "${rtsp_url}"
            else
                ffmpeg \
                    -re \
                    -stream_loop -1 \
                    ${sync_flags} \
                    -i "${video_path}" \
                    ${encoder_flags} \
                    -fflags nobuffer \
                    -flags low_delay \
                    -rtsp_transport tcp \
                    -rtbufsize 10M \
                    -max_delay 0 \
                    -f rtsp \
                    "${rtsp_url}"
            fi
        fi
    else
        # Source videos: Re-encode with optimized low latency settings
        local encoder=$(detect_gpu_encoder)
        local encoder_flags

        if [[ "$encoder" != "libx264" ]]; then
            echo -e "  ${GREEN}✓ Encoding with GPU encoder: $encoder${NC}"
            encoder_flags=$("${SCRIPTS_DIR}/detect_gpu_capabilities.sh" flags "$encoder" "4M" "fast")
        else
            encoder_flags="-c:v libx264 -preset ultrafast -tune zerolatency -profile:v baseline -level 3.1 -b:v 4M -maxrate 4M -bufsize 2M -g 30 -keyint_min 30 -sc_threshold 0"
        fi

        # VAAPI requires hardware acceleration setup
        if [[ "$encoder" == "h264_vaapi" ]]; then
            ffmpeg \
                -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi \
                -re \
                -stream_loop -1 \
                ${sync_flags} \
                -i "${video_path}" \
                ${encoder_flags} \
                -fflags nobuffer \
                -flags low_delay \
                -c:a aac \
                -b:a 128k \
                -rtsp_transport tcp \
                -rtbufsize 10M \
                -max_delay 0 \
                -f rtsp \
                "${rtsp_url}"
        else
            ffmpeg \
                -re \
                -stream_loop -1 \
                ${sync_flags} \
                -i "${video_path}" \
                ${encoder_flags} \
                -fflags nobuffer \
                -flags low_delay \
                -c:a aac \
                -b:a 128k \
                -rtsp_transport tcp \
                -rtbufsize 10M \
                -max_delay 0 \
                -f rtsp \
                "${rtsp_url}"
        fi
    fi
}

# Function to stream all cameras in parallel with synchronized start
stream_all() {
    echo -e "${GREEN}Starting all mock camera streams with synchronized timing${NC}"
    echo ""

    # Create a temporary directory for PID files
    local pid_dir="/tmp/mediamtx-streams"
    mkdir -p "$pid_dir"

    # Generate a synchronized start timestamp for all cameras
    # This ensures all FFmpeg processes start from the same temporal reference
    local sync_start_time=$(date +%s)
    echo -e "${GREEN}✓ Synchronized start time: ${sync_start_time}${NC}"
    echo ""

    # Start each camera in background with synchronized start time
    for camera in "${!CAMERA_VIDEOS[@]}"; do
        stream_camera "$camera" "$sync_start_time" &
        local pid=$!
        echo "$pid" > "${pid_dir}/${camera}.pid"
        echo -e "${GREEN}Started ${camera} (PID: ${pid})${NC}"
    done

    echo ""
    echo "All cameras started with synchronized timing. Press Ctrl+C to stop all streams."
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
    echo "Usage: $0 [all|camera1|camera2|camera3|camera4]"
    echo ""
    echo "Options:"
    echo "  all      - Stream all available cameras"
    echo "  camera1  - Stream camera 1 (auditorium - high corner view 3)"
    echo "  camera2  - Stream camera 2 (auditorium - high corner view 4)"
    echo "  camera3  - Stream camera 3 (auditorium - IP camera view 2)"
    echo "  camera4  - Stream camera 4 (auditorium - IP camera view 5)"
    echo ""
    echo "Examples:"
    echo "  $0 all              # Stream all cameras"
    echo "  $0 camera1          # Stream only camera1"
    echo "  $0 camera3          # Stream auditorium camera IP2"
    echo ""
    echo "Pre-processed Videos:"
    echo "  This script automatically uses pre-processed videos with baked-in detections"
    echo "  for optimal performance. If pre-processed videos are not found, it falls back"
    echo "  to source videos with real-time re-encoding."
    echo ""
    echo "  To generate pre-processed videos:"
    echo "    make preprocess-videos"
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
        camera1|camera2|camera3|camera4)
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

#!/bin/bash

###############################################
# GPU Capabilities Detection Script
#
# Detects available hardware encoding capabilities
# for FFmpeg and returns the best encoder to use.
#
# Supported encoders (in priority order):
#   1. h264_nvenc (NVIDIA NVENC)
#   2. h264_qsv (Intel QuickSync)
#   3. h264_vaapi (Intel/AMD VAAPI)
#   4. h264_videotoolbox (Apple VideoToolbox - macOS)
#   5. libx264 (Software fallback)
#
# Usage:
#   ./detect_gpu_capabilities.sh
#
# Output:
#   Encoder name (e.g., "h264_nvenc", "libx264")
###############################################

set -e

# Silence FFmpeg banner
export FFREPORT=level=quiet

# Function to check if FFmpeg encoder is available
check_encoder() {
    local encoder="$1"
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "^ V.*${encoder}"; then
        return 0
    else
        return 1
    fi
}

# Function to test if encoder actually works (not just listed)
test_encoder() {
    local encoder="$1"
    local test_result

    # Create a small test video (1 second, 10 frames, black screen)
    test_result=$(ffmpeg -f lavfi -i color=c=black:s=320x240:d=1:r=10 \
        -c:v "${encoder}" -f null - 2>&1 || true)

    # Check if encoding succeeded (no error messages)
    if echo "$test_result" | grep -qi "error\|failed\|not found\|unsupported"; then
        return 1
    else
        return 0
    fi
}

# Function to get NVIDIA GPU info
get_nvidia_info() {
    if command -v nvidia-smi &> /dev/null; then
        local gpu_name=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
        echo "$gpu_name"
    else
        echo "none"
    fi
}

# Function to get Intel GPU info
get_intel_info() {
    if command -v vainfo &> /dev/null; then
        local gpu_info=$(vainfo 2>&1 | grep -i "intel" | head -1 || echo "none")
        echo "$gpu_info"
    elif lspci 2>/dev/null | grep -qi "VGA.*Intel"; then
        echo "Intel GPU (detected via lspci)"
    else
        echo "none"
    fi
}

# Main detection logic
detect_best_encoder() {
    local encoder="libx264"  # Default fallback
    local gpu_type="Software"
    local gpu_info=""

    # 1. Check for NVIDIA NVENC
    if check_encoder "h264_nvenc" && test_encoder "h264_nvenc"; then
        encoder="h264_nvenc"
        gpu_type="NVIDIA NVENC"
        gpu_info=$(get_nvidia_info)

    # 2. Check for Intel QuickSync
    elif check_encoder "h264_qsv" && test_encoder "h264_qsv"; then
        encoder="h264_qsv"
        gpu_type="Intel QuickSync"
        gpu_info=$(get_intel_info)

    # 3. Check for VAAPI (Intel/AMD on Linux)
    elif check_encoder "h264_vaapi" && test_encoder "h264_vaapi"; then
        encoder="h264_vaapi"
        gpu_type="VAAPI"
        gpu_info=$(get_intel_info)

    # 4. Check for Apple VideoToolbox (macOS)
    elif check_encoder "h264_videotoolbox" && test_encoder "h264_videotoolbox"; then
        encoder="h264_videotoolbox"
        gpu_type="Apple VideoToolbox"
        gpu_info="Apple Silicon / Intel"

    # 5. Fallback to software encoding
    else
        encoder="libx264"
        gpu_type="Software (CPU)"
        gpu_info="No GPU acceleration available"
    fi

    # Output result (just encoder name for scripting)
    echo "$encoder"

    # Output debug info to stderr (can be captured separately)
    if [[ "${VERBOSE:-0}" == "1" ]]; then
        echo "GPU Type: $gpu_type" >&2
        echo "GPU Info: $gpu_info" >&2
        echo "Selected Encoder: $encoder" >&2
    fi
}

# Get encoder-specific optimization flags
get_encoder_flags() {
    local encoder="$1"
    local bitrate="${2:-4M}"
    local preset="${3:-fast}"

    case "$encoder" in
        h264_nvenc)
            # NVIDIA NVENC flags
            # Preset mapping: ultrafast=p1, veryfast=p2, fast=p3, medium=p4, slow=p5
            local nvenc_preset="p3"
            case "$preset" in
                ultrafast) nvenc_preset="p1" ;;
                veryfast) nvenc_preset="p2" ;;
                fast) nvenc_preset="p3" ;;
                medium) nvenc_preset="p4" ;;
                slow) nvenc_preset="p5" ;;
            esac

            echo "-c:v h264_nvenc -preset ${nvenc_preset} -tune ll -profile:v baseline -level 3.1 -b:v ${bitrate} -maxrate ${bitrate} -bufsize 2M -g 30 -bf 0 -rc vbr"
            ;;

        h264_qsv)
            # Intel QuickSync flags
            local qsv_preset="fast"
            case "$preset" in
                ultrafast|veryfast) qsv_preset="veryfast" ;;
                fast) qsv_preset="fast" ;;
                medium|slow) qsv_preset="medium" ;;
            esac

            echo "-c:v h264_qsv -preset ${qsv_preset} -profile:v baseline -level 3.1 -b:v ${bitrate} -maxrate ${bitrate} -bufsize 2M -g 30 -bf 0 -look_ahead 0"
            ;;

        h264_vaapi)
            # VAAPI flags (requires device selection)
            echo "-vaapi_device /dev/dri/renderD128 -c:v h264_vaapi -profile:v 578 -level 31 -b:v ${bitrate} -maxrate ${bitrate} -bufsize 2M -g 30 -bf 0"
            ;;

        h264_videotoolbox)
            # Apple VideoToolbox flags
            echo "-c:v h264_videotoolbox -profile:v baseline -level 3.1 -b:v ${bitrate} -maxrate ${bitrate} -bufsize 2M -g 30 -bf 0 -realtime 1"
            ;;

        libx264)
            # Software fallback flags
            local x264_preset="veryfast"
            case "$preset" in
                ultrafast) x264_preset="ultrafast" ;;
                veryfast) x264_preset="veryfast" ;;
                fast) x264_preset="fast" ;;
                medium) x264_preset="medium" ;;
                slow) x264_preset="slow" ;;
            esac

            echo "-c:v libx264 -preset ${x264_preset} -tune zerolatency -profile:v baseline -level 3.1 -b:v ${bitrate} -maxrate ${bitrate} -bufsize 2M -g 30 -keyint_min 30 -sc_threshold 0"
            ;;

        *)
            # Unknown encoder - use safe defaults
            echo "-c:v libx264 -preset veryfast -tune zerolatency -profile:v baseline -level 3.1 -b:v ${bitrate}"
            ;;
    esac
}

# Main script
main() {
    local command="${1:-detect}"

    case "$command" in
        detect)
            detect_best_encoder
            ;;
        flags)
            local encoder="${2:-libx264}"
            local bitrate="${3:-4M}"
            local preset="${4:-fast}"
            get_encoder_flags "$encoder" "$bitrate" "$preset"
            ;;
        info)
            VERBOSE=1 detect_best_encoder > /dev/null
            ;;
        *)
            echo "Usage: $0 [detect|flags|info]" >&2
            echo "" >&2
            echo "Commands:" >&2
            echo "  detect          - Detect best available encoder (default)" >&2
            echo "  flags <encoder> - Get optimization flags for encoder" >&2
            echo "  info            - Show detailed GPU information" >&2
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

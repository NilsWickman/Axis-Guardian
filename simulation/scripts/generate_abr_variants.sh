#!/bin/bash

###############################################
# Adaptive Bitrate Streaming (ABR) Variants Generator
#
# Generates multiple quality variants of source videos
# for adaptive bitrate streaming.
#
# Creates:
#   - Low quality (480p, 1Mbps)
#   - Medium quality (720p, 2.5Mbps)
#   - High quality (1080p, 5Mbps)
#
# Usage:
#   ./generate_abr_variants.sh <input_video> [output_dir]
#
# Example:
#   ./generate_abr_variants.sh shared/cameras/view-HC3.mp4 shared/cameras/abr/
###############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [[ $# -lt 1 ]]; then
    echo -e "${RED}Error: Input video required${NC}"
    echo "Usage: $0 <input_video> [output_dir]"
    exit 1
fi

INPUT_VIDEO="$1"
OUTPUT_DIR="${2:-$(dirname "$INPUT_VIDEO")/abr}"

# Check if input exists
if [[ ! -f "$INPUT_VIDEO" ]]; then
    echo -e "${RED}Error: Input video not found: $INPUT_VIDEO${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Extract base name
BASENAME=$(basename "$INPUT_VIDEO" | sed 's/\.[^.]*$//')

# Check for GPU encoder
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GPU_ENCODER="libx264"

if [[ -x "${SCRIPT_DIR}/detect_gpu_capabilities.sh" ]]; then
    GPU_ENCODER=$("${SCRIPT_DIR}/detect_gpu_capabilities.sh" detect)
    if [[ "$GPU_ENCODER" != "libx264" ]]; then
        echo -e "${GREEN}✓ Using GPU encoder: ${GPU_ENCODER}${NC}"
    fi
fi

# Function to encode variant
encode_variant() {
    local quality="$1"
    local resolution="$2"
    local bitrate="$3"
    local output_file="${OUTPUT_DIR}/${BASENAME}-${quality}.mp4"

    echo -e "${BLUE}Encoding ${quality} variant (${resolution}, ${bitrate})...${NC}"

    local encoder_flags
    if [[ "$GPU_ENCODER" != "libx264" ]]; then
        encoder_flags=$("${SCRIPT_DIR}/detect_gpu_capabilities.sh" flags "$GPU_ENCODER" "$bitrate" "medium")
    else
        encoder_flags="-c:v libx264 -preset medium -profile:v baseline -level 3.1 -b:v $bitrate -maxrate $bitrate -bufsize $((${bitrate%M} * 2))M"
    fi

    # VAAPI requires special handling
    if [[ "$GPU_ENCODER" == "h264_vaapi" ]]; then
        ffmpeg -y \
            -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi \
            -i "$INPUT_VIDEO" \
            -vf "scale_vaapi=$resolution" \
            $encoder_flags \
            -g 30 -keyint_min 30 -sc_threshold 0 \
            -c:a aac -b:a 128k \
            -movflags +faststart \
            "$output_file" 2>&1 | grep -v "^frame="
    else
        ffmpeg -y \
            -i "$INPUT_VIDEO" \
            -vf "scale=$resolution" \
            $encoder_flags \
            -g 30 -keyint_min 30 -sc_threshold 0 \
            -c:a aac -b:a 128k \
            -movflags +faststart \
            "$output_file" 2>&1 | grep -v "^frame="
    fi

    if [[ $? -eq 0 ]]; then
        local filesize=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}✓ ${quality} variant created: ${filesize}${NC}"
        echo "  Output: $output_file"
    else
        echo -e "${RED}✗ Failed to create ${quality} variant${NC}"
    fi
}

echo -e "${BLUE}Generating ABR variants for: $BASENAME${NC}"
echo ""

# Generate variants
encode_variant "low" "854:480" "1M"
encode_variant "medium" "1280:720" "2500K"
encode_variant "high" "1920:1080" "5M"

echo ""
echo -e "${GREEN}✓ ABR variant generation complete${NC}"
echo "Output directory: $OUTPUT_DIR"
echo ""
echo "Variants created:"
ls -lh "${OUTPUT_DIR}/${BASENAME}"-*.mp4 | awk '{print "  " $9 " (" $5 ")"}'

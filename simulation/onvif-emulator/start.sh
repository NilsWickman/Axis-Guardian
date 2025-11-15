#!/bin/bash
# Start ONVIF Camera Emulator (for local development without Docker)

set -e

echo "Starting ONVIF Camera Emulator..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment with uv..."
    uv venv
    uv pip install -r requirements.txt
fi

# Activate virtual environment
source .venv/bin/activate

# Set default environment variables if not set
export CAMERA_ID=${CAMERA_ID:-camera1}
export ONVIF_HOST=${ONVIF_HOST:-0.0.0.0}
export ONVIF_PORT=${ONVIF_PORT:-8000}
export ONVIF_ENABLE_AUTH=${ONVIF_ENABLE_AUTH:-true}
export ONVIF_USERNAME=${ONVIF_USERNAME:-admin}
export ONVIF_PASSWORD=${ONVIF_PASSWORD:-axis123}
export MEDIAMTX_HOST=${MEDIAMTX_HOST:-localhost}
export MEDIAMTX_RTSP_PORT=${MEDIAMTX_RTSP_PORT:-8554}
export LOG_LEVEL=${LOG_LEVEL:-INFO}

echo ""
echo "Configuration:"
echo "  Camera ID: $CAMERA_ID"
echo "  ONVIF Port: $ONVIF_PORT"
echo "  Authentication: $ONVIF_ENABLE_AUTH"
echo "  MediaMTX: $MEDIAMTX_HOST:$MEDIAMTX_RTSP_PORT"
echo ""

# Start the emulator
python -m src.main

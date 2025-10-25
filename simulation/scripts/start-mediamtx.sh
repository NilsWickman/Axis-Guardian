#!/bin/bash
# Start MediaMTX media server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MEDIAMTX_DIR="$PROJECT_ROOT/simulation/mediamtx"
MEDIAMTX_BIN="$MEDIAMTX_DIR/mediamtx"
MEDIAMTX_CONFIG="$MEDIAMTX_DIR/mediamtx.custom.yml"
PID_FILE="$MEDIAMTX_DIR/mediamtx.pid"

# Check if MediaMTX is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "MediaMTX is already running (PID: $PID)"
        exit 0
    else
        echo "Removing stale PID file"
        rm "$PID_FILE"
    fi
fi

# Check if binary exists
if [ ! -f "$MEDIAMTX_BIN" ]; then
    echo "Error: MediaMTX binary not found at $MEDIAMTX_BIN"
    echo "MediaMTX source code is available but binary is missing."
    echo "Building from source..."
    cd "$MEDIAMTX_DIR" && make build
    if [ ! -f "$MEDIAMTX_BIN" ]; then
        echo "Error: Failed to build MediaMTX"
        exit 1
    fi
fi

# Check if config exists
if [ ! -f "$MEDIAMTX_CONFIG" ]; then
    echo "Error: MediaMTX config not found at $MEDIAMTX_CONFIG"
    exit 1
fi

# Start MediaMTX in background
echo "Starting MediaMTX..."
cd "$MEDIAMTX_DIR"
nohup "$MEDIAMTX_BIN" "$MEDIAMTX_CONFIG" > "$MEDIAMTX_DIR/mediamtx.log" 2>&1 &
MEDIAMTX_PID=$!

# Save PID
echo $MEDIAMTX_PID > "$PID_FILE"

# Wait a moment and check if it's running
sleep 2
if ps -p $MEDIAMTX_PID > /dev/null 2>&1; then
    echo "✓ MediaMTX started successfully (PID: $MEDIAMTX_PID)"
    echo ""
    echo "Services available at:"
    echo "  RTSP:   rtsp://localhost:8554/camera{1,2,3}"
    echo "  HLS:    http://localhost:8888/camera{1,2,3}"
    echo "  WebRTC: http://localhost:8889/camera{1,2,3}"
    echo "  API:    http://localhost:9997"
    echo ""
    echo "Log file: $MEDIAMTX_DIR/mediamtx.log"
else
    echo "Error: MediaMTX failed to start"
    echo "Check log: $MEDIAMTX_DIR/mediamtx.log"
    rm "$PID_FILE"
    exit 1
fi

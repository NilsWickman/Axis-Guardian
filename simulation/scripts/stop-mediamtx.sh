#!/bin/bash
# Stop MediaMTX media server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MEDIAMTX_DIR="$PROJECT_ROOT/simulation/mediamtx"
PID_FILE="$MEDIAMTX_DIR/mediamtx.pid"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "MediaMTX is not running (no PID file found)"
    # Try to find and kill any running MediaMTX processes anyway
    pkill -f "mediamtx.*mediamtx.*yml" 2>/dev/null && echo "Killed running MediaMTX processes"
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "MediaMTX is not running (stale PID file)"
    rm "$PID_FILE"
    exit 0
fi

# Stop the process
echo "Stopping MediaMTX (PID: $PID)..."
kill "$PID"

# Wait for it to stop (max 5 seconds)
for i in {1..5}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "✓ MediaMTX stopped successfully"
        rm "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "MediaMTX did not stop gracefully, forcing..."
    kill -9 "$PID"
    rm "$PID_FILE"
    echo "✓ MediaMTX force stopped"
fi

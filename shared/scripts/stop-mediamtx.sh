#!/bin/bash
# Stop MediaMTX media server
# Note: This stops both Docker and native binary instances

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MEDIAMTX_DIR="$PROJECT_ROOT/simulation/mediamtx"
PID_FILE="$MEDIAMTX_DIR/mediamtx.pid"

# Check and stop Docker-based MediaMTX first
if command -v docker &> /dev/null; then
    if docker ps --format '{{.Names}}' | grep -q '^axis-guardian-mediamtx$'; then
        echo "Stopping MediaMTX Docker container..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" stop mediamtx
        echo "✓ MediaMTX Docker container stopped"
    fi
fi

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

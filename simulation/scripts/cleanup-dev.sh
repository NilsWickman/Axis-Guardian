#!/bin/bash
# Cleanup development processes for Axis-Guardian

echo "Cleaning up development processes..."

# Kill Vite frontend
pkill -f "vite.*config.*vite.config" 2>/dev/null || true

# Kill WebRTC detection service
pkill -f "simulation/services/webrtc-detection.*python" 2>/dev/null || true

# Kill camera streaming scripts
pkill -f "simulation/scripts/stream-mock-cameras" 2>/dev/null || true

# Kill FFmpeg camera streams
pkill -f "ffmpeg.*rtsp://localhost:8554" 2>/dev/null || true

# Kill npm-run-all
pkill -f "npm-run-all.*dev" 2>/dev/null || true

# Stop MediaMTX (without full script output)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/stop-mediamtx.sh" >/dev/null 2>&1 || true

# Give processes time to clean up
sleep 2

echo "✓ Cleanup complete"

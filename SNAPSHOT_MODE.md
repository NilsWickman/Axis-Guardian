# Snapshot Mode - Low Bandwidth Operation

## Overview

Snapshot mode is designed for **ultra-low bandwidth scenarios** such as:
- SSH tunneling over slow connections (1kbit/s - 300b/s)
- Remote access over cellular/satellite links
- Monitoring over VPN with limited bandwidth
- Development environments with bandwidth constraints

Instead of continuous video streaming, snapshot mode generates **periodic JPEG snapshots** at configurable intervals with adjustable quality and resolution.

## Quick Start

### 1. Configure Snapshot Mode

Edit `.env` to enable and configure snapshot mode:

```bash
# Enable snapshot mode
USE_SNAPSHOT_MODE=true

# Snapshot capture interval in seconds (higher = less bandwidth)
SNAPSHOT_INTERVAL=2.0

# JPEG quality (1-100, lower = smaller files, 30-50 recommended for low bandwidth)
SNAPSHOT_QUALITY=30

# Snapshot resolution (width in pixels, height auto-calculated, 320-640 recommended)
SNAPSHOT_WIDTH=320

# Run detection on snapshots (set to false to only send images, no processing)
SNAPSHOT_RUN_DETECTION=true
```

### 2. Start the System

**Option A: Integrated with `make dev` (Recommended)**
```bash
# Just run make dev - it automatically detects snapshot mode from .env
make dev
```

When `USE_SNAPSHOT_MODE=true` is set in `.env`, `make dev` will:
- ✅ Skip MediaMTX (not needed for snapshots)
- ✅ Start snapshot generator instead of video streaming
- ✅ Start WebRTC detection service (for HTTP endpoints)
- ✅ Start frontend
- ✅ Display snapshot configuration and URLs

**Option B: Manual snapshot mode only**
```bash
# Start snapshot generator only (without frontend)
make snapshot-mode
```

### 3. Access Snapshot View

Open your browser to: **http://localhost:5173/cameras/snapshot**

## Bandwidth Comparison

| Mode | Resolution | FPS | Bandwidth | Use Case |
|------|------------|-----|-----------|----------|
| WebRTC (High) | 1080p | 30 | ~3-5 Mbps | Local network, high-speed |
| WebRTC (Med) | 720p | 15 | ~1-2 Mbps | Standard remote access |
| Snapshot (High) | 640px | 0.5 | ~15-20 KB/s | Low bandwidth |
| **Snapshot (Low)** | **320px** | **0.5** | **~5-10 KB/s** | **Ultra-low bandwidth** |

**Example Bandwidth Calculations:**
- 320px width, quality 30, 2-second interval: ~8-12 KB/s per camera
- 640px width, quality 50, 1-second interval: ~20-30 KB/s per camera
- 160px width, quality 20, 5-second interval: ~2-4 KB/s per camera

## Architecture

```
Video Files (shared/cameras/*.mp4)
  ↓ FFmpeg extraction (fps filter)
stream-mock-cameras-snapshot.sh
  ↓ Periodic JPEG snapshots
simulation/snapshots/{camera_id}/latest.jpg
  ↓ HTTP endpoint
WebRTC Detection Service: /snapshot/{camera_id}
  ↓ Polling (client-side)
Frontend: /cameras/snapshot
  ↓ Image display + metadata
User sees latest snapshots
```

## Components

### 1. Snapshot Generator Script

**Location:** `simulation/scripts/stream-mock-cameras-snapshot.sh`

Generates periodic JPEG snapshots from video files using FFmpeg:
- Loops video files indefinitely
- Extracts frames at specified rate (1/SNAPSHOT_INTERVAL fps)
- Scales to target width (maintaining aspect ratio)
- Compresses to JPEG with target quality
- Saves as `latest.jpg` (always overwrites)

**Usage:**
```bash
# Generate snapshots for all cameras
./simulation/scripts/stream-mock-cameras-snapshot.sh all

# Generate snapshots for specific camera
./simulation/scripts/stream-mock-cameras-snapshot.sh camera1
```

### 2. HTTP Snapshot Endpoint

**Location:** `simulation/webrtc-detection/src/signaling.py`

Serves latest snapshots via HTTP GET:
- Endpoint: `GET /snapshot/{camera_id}`
- Returns: `image/jpeg` with no-cache headers
- Reads from: `simulation/snapshots/{camera_id}/latest.jpg`

**Testing:**
```bash
# Fetch snapshot (requires snapshot generator running)
curl http://localhost:8080/snapshot/camera1 -o snapshot.jpg

# Or view in browser
firefox http://localhost:8080/snapshot/camera1
```

### 3. Frontend Snapshot View

**Location:** `frontend/src/views/camera-views/SnapshotView.vue`

Vue component that:
- Polls snapshot endpoints at configurable intervals
- Displays snapshots in a grid layout
- Shows last update time and bandwidth usage
- Auto-starts polling on mount
- Cleans up object URLs to prevent memory leaks

**Route:** `http://localhost:5173/cameras/snapshot`

## Configuration Options

### Environment Variables (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_SNAPSHOT_MODE` | `false` | Enable snapshot mode globally |
| `SNAPSHOT_INTERVAL` | `2.0` | Seconds between snapshots (0.5 - 60) |
| `SNAPSHOT_QUALITY` | `30` | JPEG quality (1-100, lower = smaller) |
| `SNAPSHOT_WIDTH` | `320` | Width in pixels (160-1920) |
| `SNAPSHOT_RUN_DETECTION` | `true` | Run object detection (future feature) |

### Frontend Controls

The snapshot view provides runtime controls:
- **Update Interval:** 1s, 2s, 5s, 10s
- **Start/Stop:** Toggle polling on/off
- **Per-Camera Bandwidth:** Shows KB/s for each camera

## Optimization Tips

### For 1kbit/s - 300b/s connections:

1. **Minimize snapshot size:**
   ```bash
   SNAPSHOT_WIDTH=160
   SNAPSHOT_QUALITY=20
   SNAPSHOT_INTERVAL=5.0
   ```
   Result: ~2-4 KB/s per camera

2. **Reduce camera count:**
   - Monitor only critical cameras
   - Use frontend controls to stop updates for unused cameras

3. **Increase interval:**
   - 5-10 seconds for static scenes
   - 1-2 seconds for active monitoring

4. **Disable pre-processed videos:**
   ```bash
   USE_PREPROCESSED_VIDEOS=false
   ```
   (Smaller source videos = faster snapshot generation)

### For development over SSH:

```bash
# In .env
SNAPSHOT_WIDTH=480
SNAPSHOT_QUALITY=40
SNAPSHOT_INTERVAL=2.0
```

Result: ~10-15 KB/s per camera

## Troubleshooting

### Snapshots not appearing

**Check if snapshot generator is running:**
```bash
ps aux | grep stream-mock-cameras-snapshot
```

**Check snapshot files exist:**
```bash
ls -lh simulation/snapshots/camera1/latest.jpg
```

**Start generator manually:**
```bash
bash simulation/scripts/stream-mock-cameras-snapshot.sh all
```

### High bandwidth usage

**Reduce snapshot size:**
- Lower `SNAPSHOT_WIDTH` (e.g., 160-320)
- Lower `SNAPSHOT_QUALITY` (e.g., 20-30)
- Increase `SNAPSHOT_INTERVAL` (e.g., 5-10 seconds)

**Measure actual bandwidth:**
```bash
# Check snapshot file size
ls -lh simulation/snapshots/camera1/latest.jpg

# Calculate bandwidth: (size_in_kb) / (interval_in_seconds)
# Example: 15 KB / 2 seconds = 7.5 KB/s
```

### Frontend shows "Failed to load snapshot"

**Verify endpoint is accessible:**
```bash
curl -I http://localhost:8080/snapshot/camera1
```

**Check CORS headers:**
- Frontend expects CORS to be enabled on port 8080
- Configured in `simulation/webrtc-detection/src/signaling.py`

**Restart services:**
```bash
# Stop all
Ctrl+C

# Restart snapshot generator
make snapshot-mode

# Restart frontend (in another terminal)
cd frontend && yarn dev
```

### Memory usage increasing

Frontend automatically cleans up object URLs. If memory still increases:
- Stop/start polling to force cleanup
- Refresh browser page
- Reduce update interval

## Makefile Commands

```bash
# Start snapshot mode (all cameras)
make snapshot-mode

# Or manually:
bash simulation/scripts/stream-mock-cameras-snapshot.sh all
bash simulation/scripts/stream-mock-cameras-snapshot.sh camera1
```

## Future Enhancements

1. **Motion-triggered snapshots:** Only capture when motion detected
2. **Server-side detection overlay:** Draw bounding boxes on snapshots
3. **Adaptive quality:** Adjust quality based on bandwidth
4. **Snapshot history:** Keep last N snapshots per camera
5. **WebSocket push:** Server pushes snapshots instead of polling
6. **Differential updates:** Only send changed regions (JPEG diffs)

## API Reference

### GET /snapshot/{camera_id}

Returns latest JPEG snapshot for specified camera.

**Parameters:**
- `camera_id` (path): Camera identifier (camera1, camera2, camera3, camera4)

**Response:**
- `200 OK`: Returns `image/jpeg` with snapshot data
- `404 Not Found`: Snapshot not available (generator not running)
- `500 Internal Server Error`: Error reading snapshot file

**Headers:**
```
Content-Type: image/jpeg
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

**Example:**
```bash
curl http://localhost:8080/snapshot/camera1 -o snapshot.jpg
```

## Development Notes

- Snapshots are stored in `simulation/snapshots/{camera_id}/latest.jpg`
- Directory is created automatically by snapshot generator
- File is continuously overwritten (no history)
- FFmpeg loops videos indefinitely (`-stream_loop -1`)
- JPEG quality inverse calculation: `31 - (quality / 3.33)`
- Frontend polls at configurable intervals (default: 2 seconds)

## See Also

- `IMPROVEMENTS_SUMMARY.md` - All performance optimizations
- `CLAUDE.md` - Project architecture and development workflow
- `DOCKER_DEV_SETUP.md` - Docker development environment setup

# Streamlined Development Setup - Changes Summary

## What Changed

### 1. Removed Mock Video Copying
**Before:** Videos were copied from `shared/mock/camera-feeds/` to `frontend/mock-server/videos/`
**After:** FFmpeg streams directly from `shared/mock/camera-feeds/real-footage/`

**Why:** Unnecessary duplication. The camera streaming script already reads from the source location.

### 2. Removed Mock Backend Server
**Before:** `make dev` started a mock HTTP server on port 8000
**After:** Frontend uses Pinia stores with mock data directly

**Why:** Data is managed through Pinia stores in the frontend. No backend API is currently needed for development.

### 3. Minimal Infrastructure by Default
**Before:** `make setup` and `make dev` started PostgreSQL, MQTT, MinIO, and MediaMTX
**After:** Only MediaMTX is started (via new `make infrastructure` command)

**Why:**
- WebRTC detection service doesn't use PostgreSQL, MQTT, or MinIO
- PostgreSQL is for future TypeScript backend services (not yet implemented)
- MQTT is only needed for the async detection service (`make detect`)
- MinIO is for recording storage (future feature)

## New Commands

```bash
make infrastructure     # Start MediaMTX only (minimal, what you need now)
make database          # Start full infrastructure (PostgreSQL, MQTT, MinIO, MediaMTX)
```

## Updated Workflow

### Initial Setup
```bash
make setup              # Installs deps + starts MediaMTX
```

### Daily Development
```bash
make dev                # Auto-starts MediaMTX if needed, then runs:
                        # - Frontend (Vue dev server on :5173)
                        # - Cameras (FFmpeg streams to MediaMTX)
                        # - WebRTC Detection (:8080)
```

## What's Currently Running with `make dev`

**3 services in parallel:**

1. **Frontend** (port 5173) - Vue app with Pinia stores containing mock data
2. **Camera Streams** - FFmpeg streaming 3 videos to MediaMTX RTSP
3. **WebRTC Detection** (port 8080) - Python service with YOLOv8 + WebRTC data channels

**Infrastructure (Docker):**
- **MediaMTX** - RTSP/HLS/WebRTC streaming broker

## What's NOT Running (and why that's OK)

- ❌ **Mock Backend Server** - Frontend has data in Pinia stores
- ❌ **PostgreSQL** - No backend services using it yet
- ❌ **MQTT** - Only needed for async detection service (`make detect`)
- ❌ **MinIO** - Only needed for recording storage (future)

## Port Changes

### Removed from `make cleanup-ports`
- Port 8000 (mock server) - no longer used

### Current Ports
- 5173 - Frontend
- 8080 - WebRTC Detection
- 8554 - MediaMTX RTSP
- 8888 - MediaMTX HLS
- 8889 - MediaMTX WebRTC
- 9997 - MediaMTX API

## When You'll Need Full Infrastructure

Run `make database` when:
- Implementing TypeScript backend services (Auth, Alarm, Control)
- Using the MQTT-based detection service (`make detect`)
- Testing recording/playback features (MinIO storage)
- Running database migrations and seeding

## Files Changed

- `Makefile` - Removed mock-videos, added infrastructure target, updated dev/setup
- `package.json` - Removed dev:mock-server from parallel execution
- `simulation/docker-compose/docker-compose.minimal.yml` - New minimal compose file
- `CLAUDE.md` - Updated documentation to reflect new workflow

## Migration Guide

If you have the old setup running:

```bash
# Stop everything
docker compose -f simulation/docker-compose/docker-compose.dev.yml down -v

# Start fresh with minimal setup
make infrastructure

# Run the system
make dev
```

## Benefits

✅ **Faster startup** - Only MediaMTX container instead of 4
✅ **Less resource usage** - No PostgreSQL/MQTT/MinIO running unnecessarily
✅ **Clearer purpose** - Easy to see what infrastructure is actually needed
✅ **Simpler debugging** - Fewer moving parts
✅ **No file copying** - Videos stream from source location

## Backward Compatibility

The full infrastructure is still available via `make database` for when backend services are implemented.

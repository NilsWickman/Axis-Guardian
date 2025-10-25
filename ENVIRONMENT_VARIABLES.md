# Environment Variables Configuration

This document describes the centralized environment variable configuration for the Axis-Guardian project.

## Overview

All environment variables are now centralized in the **root `.env` file** at the project root. Individual services read from this shared configuration file.

### Root Configuration File

**Location:** `<project-root>/.env`

This file contains all configuration for:
- Database (PostgreSQL with PostGIS)
- MediaMTX (Streaming Server)
- WebRTC Detection Service
- Object Detection Service
- Frontend (Vite)
- Auth & Security
- Axis Devices (Production)

## Service Configuration

### 1. WebRTC Detection Service

**Config File:** `simulation/webrtc-detection/src/config.py`

Reads from root `.env` and uses these variables:
- `WEBRTC_DETECTION_HOST` (default: 0.0.0.0)
- `WEBRTC_DETECTION_PORT` (default: 8080)
- `STUN_SERVER`
- `MODEL_PATH`
- `CONFIDENCE_THRESHOLD`
- `IOU_THRESHOLD`
- `FRAME_SKIP`
- `MAX_FPS`
- `DETECTION_RESOLUTION`
- `AUTO_SCALE_DETECTION`
- `DRAW_ON_FRAME`
- `CAMERA1_URL`, `CAMERA2_URL`, `CAMERA3_URL`
- `LOG_LEVEL`

**Local Override:** If needed, create `simulation/webrtc-detection/.env` to override specific values (file not tracked in git).

### 2. Object Detection Service (MQTT-based)

**Config File:** `simulation/object-detection/src/config.py`

Reads from root `.env` and uses these variables:
- `MQTT_HOST`
- `MQTT_PORT`
- `MQTT_TOPIC_PREFIX`
- `CAMERA1_URL`, `CAMERA2_URL`, `CAMERA3_URL`
- `MODEL_SIZE`
- `CONFIDENCE_THRESHOLD`
- `IOU_THRESHOLD`
- `DETECT_CLASSES`
- `FRAME_SKIP`
- `MAX_FPS`
- Timestamp sync variables (see root `.env`)

**Local Override:** If needed, create `simulation/object-detection/.env` to override specific values (file not tracked in git).

### 3. Frontend (Vue/Vite)

**Config File:** `frontend/config/build/vite.config.ts`

The frontend now reads from the **root `.env` file** using Vite's `envDir` option.

Uses `VITE_*` prefixed variables from root `.env`:
- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_RTSP_PROXY_URL`
- `VITE_LOG_LEVEL`
- `VITE_ENABLE_MOCK_DATA`

**Configuration:**
```typescript
export default defineConfig({
  envDir: path.resolve(__dirname, '../../../'),  // Points to project root
  // ... other config
})
```

**Note:** Variables must be prefixed with `VITE_` to be accessible in the browser bundle.

### 4. Native Services

All native services (MediaMTX, PostgreSQL, Python services) read from the root `.env` file directly using environment variables or configuration loaders.

## Port Configuration

| Service | Port | Variable | Notes |
|---------|------|----------|-------|
| Frontend | 5173 | (hardcoded in Vite) | Vue dev server |
| WebRTC Detection | 8081 | `WEBRTC_DETECTION_PORT` | Signaling + data channels |
| MediaMTX RTSP | 8554 | `MEDIAMTX_RTSP_PORT` | Camera streams |
| MediaMTX HLS | 8888 | `MEDIAMTX_HLS_PORT` | HTTP Live Streaming |
| MediaMTX WebRTC | 8889 | `MEDIAMTX_WEBRTC_PORT` | Low-latency streaming |
| MediaMTX API | 9997 | `MEDIAMTX_API_PORT` | Management API |
| PostgreSQL | 5432 | `POSTGRES_PORT` | Native database installation |

## Key Changes Made

### ✅ Root `.env` File
- Created comprehensive root `.env` with all service configurations
- Organized into logical sections with comments
- Updated `.env.example` to match

### ✅ Python Services
- Updated `webrtc-detection/src/config.py` to read from root `.env`
- Updated `object-detection/src/config.py` to read from root `.env`
- Added `extra = "ignore"` to Pydantic Config to allow shared .env
- Added `protected_namespaces = ()` to allow `model_*` field names

### ✅ Port Configuration
- WebRTC Detection uses port 8081
- Updated `config.py` to use `WEBRTC_DETECTION_PORT` from root `.env`
- Updated frontend to use `VITE_RTSP_PROXY_URL` environment variable
- PostgreSQL uses standard port 5432 (native installation)

### ✅ Frontend Configuration
- Configured Vite to read from root `.env` using `envDir` option
- Removed `frontend/.env` and `frontend/.env.example` files
- Updated `useWebRTCDetection.ts` to use environment variable
- All services now use a single shared `.env` file

### ✅ Removed All Local `.env` Files
- **Removed** all local `.env` and `.env.example` files from:
  - Python simulation services (webrtc-detection, object-detection)
  - Frontend directory
- All services (Python and Frontend) now exclusively use root `.env`
- Users can create local `.env` files if needed for overrides (not tracked in git)

## Usage

### Initial Setup
```bash
# Copy example to create your local .env
cp .env.example .env

# Edit as needed
vim .env
```

### Service-Specific Overrides
If you need to override values for a specific service, create a local `.env` file:

```bash
# For webrtc-detection
cd simulation/webrtc-detection
cat > .env << 'EOF'
# Local overrides for webrtc-detection
# These values override the root .env
WEBRTC_DETECTION_PORT=9081
CONFIDENCE_THRESHOLD=0.7
EOF
```

**Note:** Local `.env` files are not tracked in git and will override root `.env` values.

### Verification
Test that services read the configuration correctly:

```bash
# Test WebRTC Detection
cd simulation/webrtc-detection
python3 -c "from src.config import settings; print(f'Port: {settings.port}')"

# Test Object Detection
cd simulation/object-detection
python3 -c "from src.config import settings; print(f'MQTT: {settings.mqtt_host}:{settings.mqtt_port}')"
```

## Best Practices

1. **Never commit `.env` files** - They contain sensitive configuration
2. **Always update `.env.example`** when adding new variables
3. **Use root `.env` for shared values** - Only override locally when necessary
4. **Document new variables** in this file and inline comments
5. **Use descriptive variable names** with service prefixes (e.g., `WEBRTC_DETECTION_PORT`)

## Troubleshooting

### Pydantic Validation Errors
If you see "Extra inputs are not permitted" errors:
- Ensure `extra = "ignore"` is in the Pydantic Config class
- Check that `case_sensitive = False` is set


### Port Conflicts
If you encounter port conflicts:
```bash
# Check what's using a port
lsof -i :8081

# Use the cleanup script
make cleanup-ports
```

## Migration Notes

Services migrated to native installations:
- ✅ PostgreSQL with PostGIS (native installation)
- ✅ MediaMTX (native binary in `simulation/mediamtx/`)
- ✅ Python services (virtual environments)
- ✅ Frontend (Vite dev server)

All services now use the root `.env` file for configuration.

## Files Modified

1. `.env` - Comprehensive root configuration
2. `.env.example` - Template with all variables
3. `simulation/webrtc-detection/src/config.py`
4. `simulation/object-detection/src/config.py`
5. `frontend/config/build/vite.config.ts` - Added `envDir` to read from root
6. `frontend/src/composables/useWebRTCDetection.ts`

## Files Removed

**Docker-related:**
1. `simulation/docker-compose/` - All Docker Compose files ❌
2. `simulation/webrtc-detection/Dockerfile` ❌
3. `simulation/webrtc-detection/docker-compose.yml` ❌
4. `simulation/services/camera-streamer/` - Docker-only service ❌

**Local environment files:**
1. `simulation/webrtc-detection/.env` ❌
2. `simulation/webrtc-detection/.env.example` ❌
3. `simulation/object-detection/.env.example` ❌
4. `frontend/.env` ❌
5. `frontend/.env.example` ❌

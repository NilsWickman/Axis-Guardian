# Tracking Service Integration - 2025-11-30

## Overview

Successfully integrated the camera emulator with the backend tracking service. Detections from camera emulators are now POSTed to the tracking service, which performs ground plane projection and multi-camera track correlation.

## Architecture

```
Camera Emulator (Python)           Tracking Service (TypeScript)
┌─────────────────────────┐       ┌─────────────────────────────┐
│ view-HC3-preprocessed   │       │                             │
│   ↓                     │       │  /api/emulator-detections   │
│ Detection JSON          │──────▶│       ↓                     │
│   ↓                     │ POST  │  Bbox → Ground Plane        │
│ WebRTC + DataChannel    │       │       ↓                     │
└─────────────────────────┘       │  Track Correlation          │
                                  │       ↓                     │
┌─────────────────────────┐       │  Global Tracks + Trails     │
│ view-HC4-preprocessed   │──────▶│                             │
└─────────────────────────┘       └─────────────────────────────┘
```

## Configuration

### Camera Emulator Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRACKING_ENABLED` | `false` | Enable/disable tracking service integration |
| `TRACKING_SERVICE_URL` | `http://localhost:3010` | Tracking service base URL |

### Camera ID Mapping

| Emulator Camera | Tracking Camera ID |
|-----------------|-------------------|
| camera-HC3 | camera1 |
| camera-HC4 | camera2 |

## Camera Configuration (from sitemap)

```json
{
  "camera1": {
    "position": { "x": 1.3, "y": 10.9, "z": 1.5 },
    "azimuth": 321,
    "elevation": 45,
    "fov": 60,
    "maxDistance": 100
  },
  "camera2": {
    "position": { "x": 15.75, "y": 10.9, "z": 1.5 },
    "azimuth": 253,
    "elevation": 45,
    "fov": 60,
    "maxDistance": 100
  }
}
```

## Test Results

### Integration Test Run

Started camera emulator with tracking enabled:

```bash
CAMERA_DATA_PATH=../shared/cameras/preprocessed/1080p \
TRACKING_ENABLED=true \
python src/main.py
```

Emulator output confirmed integration:
```
INFO:__main__:Tracking service integration enabled:
INFO:__main__:  URL: http://localhost:3010
INFO:__main__:  Camera ID: camera1
INFO:__main__:Camera emulator 'camera-HC3' started on port 9101
INFO:__main__:  Video: ../shared/cameras/preprocessed/1080p/view-HC3-preprocessed.mp4
INFO:__main__:  Detections: 5428 frames

INFO:__main__:Tracking service integration enabled:
INFO:__main__:  URL: http://localhost:3010
INFO:__main__:  Camera ID: camera2
INFO:__main__:Camera emulator 'camera-HC4' started on port 9102
INFO:__main__:  Video: ../shared/cameras/preprocessed/1080p/view-HC4-preprocessed.mp4
INFO:__main__:  Detections: 5082 frames
```

### Tracking Service Stats

```json
{
  "totalTracks": 2,
  "activeConfirmedTracks": 2,
  "activeUnconfirmedTracks": 0,
  "inactiveTracks": 0,
  "cameras": 2,
  "config": {
    "correlationDistanceM": 1.5,
    "mergeWindowMs": 200,
    "trackExpiryMs": 5000,
    "maxTrailLength": 20,
    "minDetectionsToConfirm": 3,
    "maxVelocityMs": 10
  }
}
```

### Active Tracks

| Track ID | Detection Count | Current Position (m) | Camera |
|----------|-----------------|---------------------|--------|
| global-2 | 2,470+ | (0.71, 12.04) | camera1 |
| global-25 | 1,841+ | (0.81, 12.11) | camera1 |

### Position Accuracy

Given camera1 at position (1.3, 10.9) facing azimuth 321° (NW):
- Detected people at ~(0.7-0.8, 12.0) meters
- This places them 1-1.5 meters in front of the camera
- Consistent with detection bounding boxes showing people in center-right of frame

## API Endpoints

### Tracking Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tracks` | List confirmed tracks |
| GET | `/api/tracks/all` | List all tracks (including unconfirmed) |
| GET | `/api/tracks/:id` | Get specific track |
| POST | `/api/emulator-detections` | Inject emulator detections |
| POST | `/api/detections` | Inject detections (x/y/width/height format) |
| GET | `/api/cameras` | List cameras |
| GET | `/api/stats` | Get statistics |

### Detection Payload Format

Camera emulator sends:
```json
{
  "camera_id": "camera1",
  "detections": [
    {
      "confidence": 0.85,
      "bbox": {
        "left": 0.778,
        "top": 0.500,
        "right": 0.859,
        "bottom": 0.860
      }
    }
  ]
}
```

The `/api/emulator-detections` endpoint converts this to the internal format with x/y/width/height.

## Files Modified

### Camera Emulator (`camera-emulator/src/main.py`)

- Added `aiohttp.ClientSession` for HTTP requests
- Added `TRACKING_SERVICE_URL` environment variable
- Added `tracking_camera_id` parameter to `CameraEmulator.__init__`
- Added `_post_to_tracking_service()` async method
- Modified `_send_detections()` to POST to tracking service
- Modified `start()` to create HTTP session
- Modified `main()` with camera ID mappings and `TRACKING_ENABLED` flag

### Tracking Service

- `src/api/routes.ts` - Added `EmulatorDetectionSchema` and `/api/emulator-detections` endpoint
- `src/detection/camera-registry.ts` - Added `registerCamera()` method
- `src/server.ts` - Added `CreateServerOptions` interface with cameras parameter
- `src/cli/start-with-sitemap.ts` - CLI tool to start server with sitemap config
- `src/config/sitemap-loader.ts` - Load cameras from sitemap JSON

## Running the Integration

### 1. Start the Tracking Service

```bash
cd tracking-service
npx tsx src/cli/start-with-sitemap.ts \
  --sitemap ../frontend/public/sitemap-rectangular-room.json
```

### 2. Start Camera Emulators with Tracking

```bash
cd camera-emulator
source venv/bin/activate
CAMERA_DATA_PATH=../shared/cameras/preprocessed/1080p \
TRACKING_ENABLED=true \
python src/main.py
```

### 3. Verify Integration

```bash
# Check tracking service health
curl http://localhost:3010/api/health

# Check active tracks
curl http://localhost:3010/api/tracks/all

# Check statistics
curl http://localhost:3010/api/stats
```

## Next Steps

1. Connect frontend to tracking service WebSocket for real-time track updates
2. Add track visualization on site map (using trails from tracking service)
3. Implement multi-camera track correlation when both cameras see the same person

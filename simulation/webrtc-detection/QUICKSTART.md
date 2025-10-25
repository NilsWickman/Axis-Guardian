# WebRTC Detection - Quick Start Guide

Get started with ultra-low latency object detection using WebRTC data channels in under 5 minutes.

## Prerequisites

- Python 3.12+
- FFmpeg installed
- Node.js 22.19.0+
- MediaMTX (for RTSP streaming)

## Quick Start

### 1. Install Dependencies

Create a Python virtual environment and install dependencies:
```bash
cd simulation/webrtc-detection
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

This installs all required packages (aiortc, OpenCV, YOLOv8, etc.).

### 2. Download YOLO Model

Ensure the YOLOv8 model is available:
```bash
# From the webrtc-detection directory
mkdir -p ../../../shared/models
wget -P ../../../shared/models/ https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
```

### 3. Configure Environment

Ensure the root project `.env` file at `/home/nilwi971/projects/Axis-Guardian/.env` contains the necessary configuration:
```bash
# Server Configuration
WEBRTC_DETECTION_HOST=0.0.0.0
WEBRTC_DETECTION_PORT=8080

# Detection Settings
MODEL_PATH=/home/nilwi971/projects/Axis-Guardian/shared/models/yolov8n.pt
CONFIDENCE_THRESHOLD=0.5

# Camera Sources
CAMERA1_URL=rtsp://localhost:8554/camera1
CAMERA2_URL=rtsp://localhost:8554/camera2
CAMERA3_URL=rtsp://localhost:8554/camera3
```

### 4. Start MediaMTX

Start the MediaMTX server for RTSP streaming:
```bash
# From project root
./scripts/start-mediamtx.sh
```

Wait for MediaMTX to start (~5 seconds).

### 5. Start Mock Cameras

In a separate terminal, stream mock video files to MediaMTX:
```bash
# From project root
./simulation/scripts/stream-mock-cameras.sh
```

This streams mock video files as RTSP feeds to MediaMTX. You should see:
```
Starting mock camera streams...
  camera1 - People detection video (people-detection.mp4)
  camera2 - Car detection video (car-detection.mp4)

Stream URLs:
  RTSP:   rtsp://localhost:8554/camera{1,2}
  HLS:    http://localhost:8888/camera{1,2}
  WebRTC: http://localhost:8889/camera{1,2}
```

### 6. Start WebRTC Detection Service

In another terminal:
```bash
cd simulation/webrtc-detection
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python src/main.py
```

You should see:
```
============================================================
WebRTC Detection Service
============================================================
Model: /home/nilwi971/projects/Axis-Guardian/shared/models/yolov8n.pt
Confidence threshold: 0.5
Server: 0.0.0.0:8080
============================================================
[INFO] WebRTC Signaling Server initialized
[INFO] Starting WebRTC Signaling Server on 0.0.0.0:8080
```

### 7. Access Frontend

In yet another terminal, start the frontend:
```bash
cd frontend
npm run dev
```

Open browser to: http://localhost:5173

Navigate to **Camera Views → WebRTC Detection** (or visit http://localhost:5173/webrtc-detection)

## What You'll See

The WebRTC Detection view displays:

- **Live Video Streams**: Ultra-low latency video from cameras
- **Real-time Bounding Boxes**: Detection overlays perfectly synchronized with video
- **Frame Numbers**: Frame counter showing exact synchronization
- **Detection Counts**: Per-camera detection statistics
- **Connection Status**: WebRTC peer connection and data channel states
- **Debug Info**: Frame timing, sync quality, detection details

## Verify It's Working

### Check Service Health

```bash
curl http://localhost:8080/health
```

Expected output:
```json
{
  "status": "healthy",
  "active_connections": 2,
  "camera_sources": {
    "camera1": "rtsp://localhost:8554/camera1",
    "camera2": "rtsp://localhost:8554/camera2",
    "camera3": "rtsp://localhost:8554/camera3"
  }
}
```

### Check Browser Console

Open browser DevTools (F12) and look for:
```
[WebRTC] Connection state: connected
[WebRTC] Data channel opened
[WebRTC] Frame 123: 2 detections
```

### Verify Detection Alignment

In the frontend:
1. Watch the video stream
2. Observe bounding boxes on detected objects
3. Check the frame number updates in sync with video
4. Boxes should perfectly align with objects (no lag or drift)

## Architecture Flow

```
Camera (FFmpeg) → MediaMTX (RTSP) → WebRTC Service
                                          ↓
                          [Video Track Processor]
                                          ↓
                              [YOLOv8 Detector]
                                          ↓
                          [Data Channel Sender]
                                          ↓
                                     Browser ←──┐
                                          ↓     │
                                  [Video Stream]│
                                          ↓     │
                              [Detection Metadata]
                                          ↓
                              [Bounding Box Overlay]
```

Each frame flows through:
1. **RTSP → WebRTC Service**: Frame arrives from camera
2. **Detection Processing**: YOLOv8 runs on frame
3. **Metadata Creation**: JSON with detections + frame number
4. **Simultaneous Send**: Video frame AND metadata sent together
5. **Browser Receive**: Both arrive synchronized
6. **Overlay Render**: Bounding boxes drawn on correct frame

## Common Issues

### No Video Showing

**Check cameras are streaming:**
```bash
# Verify RTSP stream with ffplay
ffplay rtsp://localhost:8554/camera1
```

**Verify MediaMTX is running:**
```bash
# Check process
ps aux | grep mediamtx

# Check API
curl http://localhost:9997/v3/paths/list
```

### Bounding Boxes Not Showing

**Check data channel is open:**
Look for "Data Channel: Open" badge in frontend

**Check detection service logs:**
Should see: `[INFO] Data channel opened for camera1`

### Poor Performance

**Use faster model:**
Edit the root `.env` file at `/home/nilwi971/projects/Axis-Guardian/.env`:
```bash
MODEL_PATH=/home/nilwi971/projects/Axis-Guardian/shared/models/yolov8n.pt  # Fastest
```

**Skip frames:**
```bash
FRAME_SKIP=2  # Process every 2nd frame
```

**Lower max FPS:**
```bash
MAX_FPS=15  # Reduce from 30 FPS
```

### Service Won't Start

**Check virtual environment:**
```bash
# Ensure you activated the virtual environment
cd simulation/webrtc-detection
source .venv/bin/activate
python src/main.py
```

**Check dependencies:**
```bash
pip install -r requirements.txt
```

**Check model path:**
Ensure `MODEL_PATH` in `.env` points to the correct location where yolov8n.pt is stored.

## Next Steps

### Customize Detection Classes

Edit `simulation/webrtc-detection/src/detector.py`:

```python
# Only detect specific classes
ALLOWED_CLASSES = ['person', 'car', 'truck']

def detect(self, frame, frame_timestamp):
    # Filter results
    for box in result.boxes:
        class_name = result.names[int(box.cls[0])]
        if class_name in ALLOWED_CLASSES:
            # Add to detections
```

### Adjust Detection Sensitivity

Edit the root `.env` file at `/home/nilwi971/projects/Axis-Guardian/.env`:
```bash
# More sensitive (more detections, more false positives)
CONFIDENCE_THRESHOLD=0.3

# Less sensitive (fewer detections, higher accuracy)
CONFIDENCE_THRESHOLD=0.7
```

### Add More Cameras

Edit the root `.env` file at `/home/nilwi971/projects/Axis-Guardian/.env`:
```bash
CAMERA4_URL=rtsp://192.168.1.100:554/stream1
CAMERA5_URL=rtsp://192.168.1.101:554/stream1
```

Update `src/signaling.py` to include new cameras in the `camera_urls` dict.

### Enable TURN Server

For remote access or NAT traversal, configure TURN in the root `.env` file at `/home/nilwi971/projects/Axis-Guardian/.env`:
```bash
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=your_username
TURN_PASSWORD=your_password
```

## Comparison: Before vs After

### Before (MQTT-based Detection)

```
Video Stream:    Camera → MediaMTX → Browser (WebRTC/HLS)
Detection Data:  Camera → Detector → MQTT → Browser (WebSocket)

Problems:
- Separate channels = different latencies
- Timestamp-based sync = drift over time
- Bounding boxes misaligned with objects
- Required DETECTION_DELAY_MS compensation
```

### After (WebRTC Data Channels)

```
Video + Detection: Camera → WebRTC Service → Browser (Single Channel)

Benefits:
- Same channel = identical latency
- Frame numbers = perfect synchronization
- Bounding boxes always aligned
- No delay compensation needed
- ~500ms total latency (vs 10-30s for HLS)
```

## Learn More

- [Full Documentation](README.md)
- [Frontend Integration](../../../frontend/src/composables/useWebRTCDetection.ts)
- [Architecture Details](../../../shared/docs/v2-Architecture-Document.md)
- [Surveillance System Guide](../../../SURVEILLANCE_QUICKSTART.md)

## Support

For issues or questions:
1. Check logs: Ensure virtual environment is activated, then run `python src/main.py` and check stderr output
2. Verify MediaMTX: `ps aux | grep mediamtx` or `curl http://localhost:9997/v3/paths/list`
3. Test connection: `curl http://localhost:8080/health`
4. Review browser console: DevTools → Console tab
5. Check environment: Verify root `.env` file contains all necessary configuration

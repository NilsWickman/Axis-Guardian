# WebRTC Detection Service

Real-time object detection service that streams video via WebRTC with frame-synchronized detection metadata sent through WebRTC data channels.

## Overview

This service provides ultra-low latency video streaming with perfectly synchronized object detection overlays. Unlike traditional approaches where video and detection metadata travel separate channels (causing alignment issues), this service sends both through a single WebRTC connection:

- **Video Track**: H.264 video from RTSP cameras
- **Data Channel**: JSON metadata with detections for each frame

## Features

- **Frame-Perfect Synchronization**: Detection metadata arrives with the exact video frame it describes
- **Ultra-Low Latency**: ~500ms end-to-end latency (vs 10-30s for HLS)
- **WebRTC Standards**: Uses standard WebRTC APIs (works in all modern browsers)
- **Multiple Cameras**: Supports concurrent connections to multiple camera streams
- **YOLOv8 Detection**: Real-time object detection with configurable models and thresholds
- **Auto-Reconnect**: Automatic reconnection handling for dropped streams

## Architecture

```
┌─────────────┐     RTSP      ┌──────────────────────┐
│   Camera    │──────────────►│  Detection Service   │
│  (MediaMTX) │               │                      │
└─────────────┘               │  ┌───────────────┐   │
                              │  │ Video Track   │   │
┌─────────────┐   WebRTC      │  │ Processor     │   │
│  Frontend   │◄──────────────┤  └───────────────┘   │
│  Browser    │               │         │            │
└─────────────┘               │         ▼            │
                              │  ┌───────────────┐   │
      ▲                       │  │  YOLOv8       │   │
      │                       │  │  Detector     │   │
      │                       │  └───────────────┘   │
      │                       │         │            │
      │   Data Channel        │         ▼            │
      │   (Metadata)          │  ┌───────────────┐   │
      └───────────────────────┤  │ Data Channel  │   │
                              │  │ Sender        │   │
                              │  └───────────────┘   │
                              └──────────────────────┘
```

## Installation

### Prerequisites

- Python 3.12+
- FFmpeg (for video processing)
- RTSP camera streams (or MediaMTX simulator)

### Setup

1. **Install dependencies**:
```bash
cd backend/python/webrtc-detection-service
pip install -r requirements.txt
```

2. **Download YOLOv8 model** (if not already present):
```bash
# YOLOv8 nano (fastest, ~6MB)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# YOLOv8 medium (better accuracy, ~50MB)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

### Environment Variables

```bash
# Server Configuration
HOST=0.0.0.0                    # Bind address
PORT=8080                       # HTTP signaling server port

# WebRTC Configuration
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=                    # Optional TURN server
TURN_USERNAME=                  # TURN username
TURN_PASSWORD=                  # TURN password

# Detection Settings
MODEL_PATH=yolov8n.pt          # YOLOv8 model file
CONFIDENCE_THRESHOLD=0.5        # Detection confidence (0.0-1.0)
IOU_THRESHOLD=0.45              # IoU threshold for NMS
FRAME_SKIP=1                    # Process every Nth frame (1 = all frames)
MAX_FPS=30                      # Maximum output FPS

# Camera Sources
CAMERA1_URL=rtsp://localhost:8554/camera1
CAMERA2_URL=rtsp://localhost:8554/camera2
CAMERA3_URL=rtsp://localhost:8554/camera3

# Logging
LOG_LEVEL=INFO                  # DEBUG, INFO, WARNING, ERROR
```

## Usage

### Starting the Service

```bash
cd backend/python/webrtc-detection-service
python src/main.py
```

You should see:
```
============================================================
WebRTC Detection Service
============================================================
Model: yolov8n.pt
Confidence threshold: 0.5
Server: 0.0.0.0:8080
============================================================
[INFO] WebRTC Signaling Server initialized
[INFO] Starting WebRTC Signaling Server on 0.0.0.0:8080
```

### API Endpoints

#### POST /offer
WebRTC signaling endpoint for establishing peer connections.

**Request**:
```json
{
  "sdp": "v=0\r\no=- ...",
  "type": "offer",
  "camera_id": "camera1"
}
```

**Response**:
```json
{
  "sdp": "v=0\r\no=- ...",
  "type": "answer"
}
```

#### GET /health
Health check endpoint.

**Response**:
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

### Frontend Integration

Use the `useWebRTCDetection` composable:

```typescript
import { useWebRTCDetection } from '@/composables/useWebRTCDetection'

const {
  isConnected,
  currentDetections,
  frameNumber,
  detectionCount,
  connect,
  disconnect
} = useWebRTCDetection('camera1', {
  signalingUrl: 'http://localhost:8080',
  autoReconnect: true,
  reconnectDelay: 3000
})

// Connect to video element
const videoEl = document.querySelector('video')
await connect(videoEl)

// Access detections (updated in real-time)
watch(currentDetections, (detections) => {
  console.log(`Frame ${frameNumber.value}: ${detections.length} detections`)
  detections.forEach(detection => {
    console.log(`${detection.class_name}: ${detection.confidence}`)
  })
})
```

### Detection Metadata Format

Each frame's metadata sent via data channel:

```json
{
  "camera_id": "camera1",
  "frame_number": 1234,
  "timestamp": 1699876543.123,
  "detection_count": 2,
  "detections": [
    {
      "bbox": {
        "x1": 120.5,
        "y1": 200.3,
        "x2": 320.7,
        "y2": 450.2,
        "width": 200.2,
        "height": 249.9,
        "left": 0.188,
        "top": 0.278,
        "right": 0.501,
        "bottom": 0.625
      },
      "confidence": 0.87,
      "class_id": 0,
      "class_name": "person",
      "timestamp": 1699876543.123,
      "frame_number": 1234
    }
  ]
}
```

**Coordinate Systems**:
- `x1, y1, x2, y2`: Pixel coordinates in original frame
- `width, height`: Bounding box dimensions in pixels
- `left, top, right, bottom`: Normalized VAPIX coordinates (0.0-1.0)

## Performance Tuning

### Model Selection

| Model | Speed | Accuracy | Size | Use Case |
|-------|-------|----------|------|----------|
| yolov8n.pt | Fastest | Good | 6 MB | Real-time, multiple cameras |
| yolov8s.pt | Fast | Better | 22 MB | Balanced performance |
| yolov8m.pt | Medium | High | 50 MB | Single camera, high accuracy |
| yolov8l.pt | Slow | Very High | 88 MB | Offline processing |

### Frame Skip

Process fewer frames to reduce CPU load:
```bash
FRAME_SKIP=2  # Process every 2nd frame (15 FPS from 30 FPS source)
FRAME_SKIP=3  # Process every 3rd frame (10 FPS)
```

### Confidence Threshold

Adjust to balance false positives vs. detection sensitivity:
```bash
CONFIDENCE_THRESHOLD=0.3  # More detections, more false positives
CONFIDENCE_THRESHOLD=0.5  # Balanced (default)
CONFIDENCE_THRESHOLD=0.7  # Fewer detections, higher accuracy
```

## Troubleshooting

### Connection Fails

**Problem**: Frontend can't connect to signaling server

**Solution**:
```bash
# Check service is running
curl http://localhost:8080/health

# Check firewall
sudo ufw allow 8080/tcp

# Enable CORS if needed (edit signaling.py)
```

### Video Not Showing

**Problem**: WebRTC connection established but no video

**Solutions**:
1. Verify RTSP stream is accessible:
```bash
ffplay rtsp://localhost:8554/camera1
```

2. Check MediaMTX is running:
```bash
docker ps | grep mediamtx
```

3. Review service logs:
```bash
# Look for errors in DetectionVideoTrack
python src/main.py  # Check stderr output
```

### Poor Detection Performance

**Problem**: Low FPS or high CPU usage

**Solutions**:
1. Use smaller model (`yolov8n.pt` instead of `yolov8m.pt`)
2. Increase `FRAME_SKIP` to process fewer frames
3. Reduce `MAX_FPS` to limit output rate
4. Lower camera resolution in RTSP source

### Detection Boxes Misaligned

**Problem**: Bounding boxes don't match objects (this service was created to fix this!)

**Verification**:
- Ensure you're using the data channel metadata, not MQTT
- Check `frame_number` in metadata matches video playback
- Verify using `useWebRTCDetection` composable (not `useDetections`)

## Development

### Project Structure

```
webrtc-detection-service/
├── src/
│   ├── main.py           # Entry point
│   ├── config.py         # Configuration management
│   ├── signaling.py      # WebRTC signaling server
│   ├── video_track.py    # Custom video track with detection
│   └── detector.py       # YOLOv8 object detector
├── requirements.txt      # Python dependencies
├── .env.example         # Configuration template
└── README.md            # This file
```

### Adding Detection Classes

Edit `detector.py` to filter specific YOLO classes:

```python
# Only detect persons and vehicles
ALLOWED_CLASSES = ['person', 'car', 'truck', 'bus', 'motorcycle']

def detect(self, frame, frame_timestamp):
    results = self.model(frame, ...)
    detections = []
    for result in results:
        for box in result.boxes:
            class_name = result.names[int(box.cls[0])]
            if class_name in ALLOWED_CLASSES:
                detections.append(...)
```

### Testing

```bash
# Health check
curl http://localhost:8080/health

# Test WebRTC connection (using frontend)
npm run dev  # In frontend directory
# Navigate to WebRTC Detection view
```

## Comparison with MQTT Approach

| Aspect | WebRTC Data Channels | MQTT (Previous) |
|--------|---------------------|-----------------|
| Latency | ~500ms | Variable (1-3s) |
| Synchronization | Perfect (frame-level) | Timestamp-based (drift) |
| Alignment | Always correct | Requires calibration |
| Complexity | Higher (WebRTC setup) | Lower (simple pub/sub) |
| Scalability | Per-connection (P2P) | Centralized broker |
| Use Case | Live viewing | Recording, analytics |

## License

Part of the surveillance system project. See main project README for license information.

## Related Documentation

- [Object Detection Service](../object-detection-service/README.md) - MQTT-based detection
- [Frontend Integration Guide](../../../shared/docs/SURVEILLANCE_QUICKSTART.md)
- [MediaMTX Configuration](../../../simulation/docker-compose/mediamtx.yml)

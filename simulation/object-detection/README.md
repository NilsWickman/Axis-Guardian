# Object Detection Service

Real-time object detection service using YOLOv8 for video surveillance cameras.

## Features

- **Real-time Detection**: Processes RTSP streams with YOLOv8 object detection
- **Multi-Camera Support**: Handles multiple camera streams simultaneously
- **MQTT Publishing**: Publishes detection events to MQTT broker
- **Configurable Classes**: Detect specific object classes (person, car, truck, etc.)
- **Performance Tuning**: Frame skipping and FPS limiting for efficiency

## Architecture

```
RTSP Streams (MediaMTX) → Stream Processor → YOLOv8 Detector → MQTT Publisher
```

**Components:**

- **detector.py**: YOLOv8-based object detection engine
- **stream_processor.py**: RTSP stream consumer with detection pipeline
- **mqtt_publisher.py**: MQTT client for publishing detection events
- **config.py**: Configuration management with Pydantic
- **main.py**: Service orchestrator and entry point

## Installation

### Prerequisites

- Python 3.12+
- CUDA (optional, for GPU acceleration)
- MediaMTX server (for RTSP streams)
- Mosquitto MQTT broker

### System Dependencies

Install required system packages:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3.12 python3.12-venv python3-pip mosquitto mosquitto-clients

# macOS
brew install python@3.12 mosquitto
```

### Python Virtual Environment Setup

```bash
# Navigate to the object detection service directory
cd /home/nilwi971/projects/Axis-Guardian/simulation/object-detection

# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Note**: First run will download YOLOv8 model weights (~6MB for nano model).

## Configuration

Configuration is managed via the root `.env` file located at `/home/nilwi971/projects/Axis-Guardian/.env`.

### Environment Variables

All configuration is centralized in the root `.env` file. The service reads the following variables:

```bash
# Camera streams
CAMERA1_URL=rtsp://localhost:8554/camera1
CAMERA2_URL=rtsp://localhost:8554/camera2

# MQTT broker
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_TOPIC_PREFIX=surveillance/detections

# Detection settings
CONFIDENCE_THRESHOLD=0.5          # Minimum confidence (0.0-1.0)
IOU_THRESHOLD=0.45                # IoU threshold for NMS
MODEL_SIZE=yolov8n                # yolov8n, yolov8s, yolov8m, yolov8l

# Target classes (COCO dataset)
DETECT_CLASSES=person,car,truck,bus,motorbike,bicycle

# Performance
FRAME_SKIP=2                      # Process every Nth frame (1 = all frames)
MAX_FPS=15                        # Maximum processing FPS

# Logging
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR
```

**Note**: The service automatically loads environment variables from the project root `.env` file.

### YOLO Model Sizes

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| yolov8n | 6 MB | Fastest | Good | Development, multiple cameras |
| yolov8s | 22 MB | Fast | Better | Production (CPU) |
| yolov8m | 52 MB | Medium | High | Production (GPU) |
| yolov8l | 87 MB | Slow | Highest | Maximum accuracy |

## Usage

### Quick Start

```bash
# From project root
make detect
```

This starts all required services including the object detection service.

### Manual Start

```bash
# Ensure virtual environment is activated
cd /home/nilwi971/projects/Axis-Guardian/simulation/object-detection
source venv/bin/activate

# Start the service
python src/main.py
```

### Service Dependencies

Before running the object detection service, ensure these services are running:

1. **MediaMTX server**: Provides RTSP camera streams
   ```bash
   # Start MediaMTX
   /home/nilwi971/projects/Axis-Guardian/scripts/start-mediamtx.sh
   ```

2. **MQTT broker**: Receives detection events
   ```bash
   # Start Mosquitto
   mosquitto -c /etc/mosquitto/mosquitto.conf
   # Or use default config
   mosquitto
   ```

3. **Camera streams**: Mock cameras for testing
   ```bash
   # Stream mock cameras
   /home/nilwi971/projects/Axis-Guardian/simulation/scripts/stream-mock-cameras.sh
   ```

### View Detections

Open the detection viewer in your browser:

```bash
# Start HTTP server (if not already running)
python -m http.server 8080

# Open in browser
http://localhost:8080/detection-viewer.html
```

### Port Summary

| Port | Service | Description |
|------|---------|-------------|
| 8080 | HTTP Server | Web viewers (camera-viewer.html, detection-viewer.html) |
| 8554 | MediaMTX RTSP | RTSP camera streams |
| 8888 | MediaMTX HLS | HLS browser-compatible streams |
| 8889 | MediaMTX WebRTC | WebRTC streams |
| 9000 | MinIO | Object storage (console: 9090) |
| 9001 | MQTT WebSocket | MQTT over WebSocket for browser |
| 1883 | MQTT Broker | MQTT message broker |
| 9997 | MediaMTX API | MediaMTX REST API |
| 5433 | PostgreSQL | Database (user: dev, password: dev) |

## Output

### MQTT Topics

**Detection Events:**
```
surveillance/detections/<camera_id>
```

**Payload:**
```json
{
  "camera_id": "camera1",
  "timestamp": 1704067200.123,
  "detection_count": 3,
  "detections": [
    {
      "bbox": {
        "x1": 120.5,
        "y1": 340.2,
        "x2": 450.8,
        "y2": 680.3,
        "width": 330.3,
        "height": 340.1
      },
      "confidence": 0.87,
      "class_id": 0,
      "class_name": "person",
      "timestamp": 1704067200.123
    }
  ]
}
```

**Detection Summary:**
```
surveillance/detections/<camera_id>/summary
```

**Payload:**
```json
{
  "camera_id": "camera1",
  "timestamp": 1704067200.123,
  "total_detections": 5,
  "class_counts": {
    "person": 3,
    "car": 2
  }
}
```

## Performance Tuning

### For Multiple Cameras (CPU):
```bash
MODEL_SIZE=yolov8n
FRAME_SKIP=3
MAX_FPS=10
CONFIDENCE_THRESHOLD=0.6
```

### For Single Camera (GPU):
```bash
MODEL_SIZE=yolov8m
FRAME_SKIP=1
MAX_FPS=30
CONFIDENCE_THRESHOLD=0.4
```

### For High Accuracy (GPU):
```bash
MODEL_SIZE=yolov8l
FRAME_SKIP=1
MAX_FPS=15
CONFIDENCE_THRESHOLD=0.3
```

## Troubleshooting

### Stream Connection Issues

**Error:** `Failed to open stream`

**Solution:**
- Ensure MediaMTX is running: `make camera-status`
- Check cameras are streaming: `make cameras`
- Verify RTSP URL in `.env`

### MQTT Connection Failed

**Error:** `Failed to connect to MQTT broker`

**Solution:**
- Check MQTT broker is running: `ps aux | grep mosquitto`
- Verify MQTT_HOST and MQTT_PORT in `/home/nilwi971/projects/Axis-Guardian/.env`
- Test connection: `mosquitto_pub -h localhost -p 1883 -t test -m "hello"`
- Start broker if not running: `mosquitto`

### Low FPS / High CPU Usage

**Solutions:**
- Increase `FRAME_SKIP` (process fewer frames)
- Decrease `MAX_FPS` (lower processing rate)
- Use smaller model (`yolov8n` instead of `yolov8s`)
- Reduce `CONFIDENCE_THRESHOLD` (fewer low-confidence detections)

### GPU Not Detected

**PyTorch with CUDA:**
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

**Verify:**
```python
import torch
print(torch.cuda.is_available())  # Should print True
```

## Development

### Project Structure

```
simulation/object-detection/
├── src/
│   ├── main.py              # Service entry point
│   ├── config.py            # Configuration management
│   ├── detector.py          # YOLOv8 detection engine
│   ├── stream_processor.py  # RTSP stream consumer
│   └── mqtt_publisher.py    # MQTT event publisher
├── venv/                    # Python virtual environment
├── logs/                    # Service logs (auto-created)
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

**Note**: Configuration is stored in `/home/nilwi971/projects/Axis-Guardian/.env` (project root)

### Adding New Detection Classes

1. Check available COCO classes: https://docs.ultralytics.com/datasets/detect/coco/
2. Update `DETECT_CLASSES` in `/home/nilwi971/projects/Axis-Guardian/.env`
3. Add color mapping in `detector.py:_get_class_color()`
4. Restart service:
   ```bash
   # Deactivate and reactivate if needed
   cd /home/nilwi971/projects/Axis-Guardian/simulation/object-detection
   source venv/bin/activate
   python src/main.py
   ```

### Logs

Logs are written to:
- **Console**: Real-time output
- **File**: `/home/nilwi971/projects/Axis-Guardian/simulation/object-detection/logs/detection-service_<timestamp>.log`

Log rotation: 500 MB per file, 10 days retention.

## Integration

### Frontend Integration

Subscribe to MQTT topics in your Vue.js frontend:

```typescript
import mqtt from 'mqtt';

const client = mqtt.connect('ws://localhost:9001/mqtt');

client.subscribe('surveillance/detections/#');

client.on('message', (topic, payload) => {
  const data = JSON.parse(payload.toString());
  console.log('Detection:', data);
});
```

### Alarm Service Integration

Detections can trigger alarms based on rules:

```typescript
// Example: Person detected in restricted area
if (detection.class_name === 'person' && isRestrictedArea(detection.bbox)) {
  triggerAlarm('Intrusion detected', detection);
}
```

## License

Internal project - Axis Communications

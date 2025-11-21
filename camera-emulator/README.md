# AXIS Camera Emulator

WebRTC-based camera emulator that streams preprocessed MP4 videos with synchronized detection metadata via data channels.

## Features

- **WebRTC Video Streaming**: Streams MP4 files with native browser support
- **Detection Data Channels**: Frame-synchronized detection metadata via msgpack
- **Continuous Looping**: Automatically restarts video when playback completes
- **VAPIX API Emulation**: Compatible endpoints for camera and analytics info
- **Multi-Camera Support**: Run multiple camera instances on different ports

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Camera Emulator Service (Python)                       │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │ WebRTC Server  │◄───────►│ Detection Sync   │       │
│  │ (Video Track)  │         │ (Data Channel)   │       │
│  └────────────────┘         └──────────────────┘       │
│         │                            │                  │
│         ▼                            ▼                  │
│  MP4 File (loop)          Detections JSON (msgpack)    │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼ WebRTC (SDP Signaling)
        ┌─────────────────────────────┐
        │  Frontend (Vue 3)            │
        │  - useWebRTCDetection        │
        │  - Video + Data Channel      │
        └─────────────────────────────┘
```

## Configuration

### Camera Configuration

Edit `src/main.py` to configure cameras:

```python
cameras = [
    {
        'camera_id': 'camera-HC3',
        'video_path': base_path / 'view-HC3-preprocessed.mp4',
        'detections_path': base_path / 'view-HC3-preprocessed.detections.json.gz',
        'port': 9001,
        'vapix_metadata': {
            'camera_model': 'AXIS P3245-LVE',
            'camera_serial': 'ACCC8EF12345',
        }
    }
]
```

### Environment Variables

- `CAMERA_DATA_PATH`: Base path for camera data (default: `/shared/cameras/preprocessed/1080p`)
- `LOG_LEVEL`: Logging verbosity (default: `INFO`)

## Quick Start

### Docker (Recommended)

```bash
cd simulation/camera-emulator

# Build and start
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Local Development

```bash
cd simulation/camera-emulator

# Install dependencies
pip install -r requirements.txt

# Run emulator
python src/main.py
```

## Frontend Integration

The emulator is designed to work with the existing `useWebRTCDetection` composable:

```typescript
// In your Vue component
import { useWebRTCDetection } from '@/composables/useWebRTCDetection'

const {
  connect,
  disconnect,
  detections,
  connectionQuality
} = useWebRTCDetection('camera-HC3')

// Connect to emulator
await connect('http://localhost:9101')
```

## API Endpoints

### WebRTC Signaling

**POST** `/offer`
- Accepts SDP offer from client
- Returns SDP answer
- Establishes WebRTC connection with video + data channel

### VAPIX Emulation

**GET** `/vapix/camera`
- Returns camera information (model, serial, resolution, fps, capabilities)

**GET** `/vapix/analytics`
- Returns analytics configuration and statistics

### Health Check

**GET** `/health`
- Returns emulator status, active connections, data loading status

## Data Format

### Detection Metadata (Data Channel)

Messages sent via WebRTC data channel (msgpack encoded):

```typescript
interface DetectionMetadata {
  camera_id: string
  frame_number: number
  timestamp: number
  detection_count: number
  detections: Detection[]
  detection_frame: number
}

interface Detection {
  bbox: {
    left: number    // Normalized 0-1
    top: number
    right: number
    bottom: number
  }
  confidence: number
  class_id: number
  class_name: string
  track_id?: number
  track_state?: 'new' | 'active' | 'lost'
}
```

## Ports

- **9101**: Camera HC3 (view-HC3-preprocessed.mp4)
- **9102**: Camera HC4 (view-HC4-preprocessed.mp4)

Note: Ports 9101/9102 are used instead of 9001/9002 to avoid conflicts with existing WebRTC services.

## Troubleshooting

### Video not playing

- Check that MP4 files exist in `shared/cameras/preprocessed/1080p/`
- Verify Docker volume mount is correct
- Check container logs: `docker-compose logs -f`

### Detections not synchronized

- Ensure detection JSON files are present and valid
- Check browser console for data channel status
- Verify msgpack decoding in frontend

### WebRTC connection fails

- Check STUN server accessibility
- Verify firewall allows WebRTC traffic
- Test with browser WebRTC diagnostics: `chrome://webrtc-internals`

## Development

### Adding New Cameras

1. Add preprocessed MP4 and detection JSON to `shared/cameras/preprocessed/1080p/`
2. Add camera configuration to `cameras` list in `src/main.py`
3. Expose new port in `Dockerfile` and `docker-compose.yml`
4. Rebuild and restart: `docker-compose up --build`

### Testing

```bash
# Health check
curl http://localhost:9101/health

# Camera info (HC3)
curl http://localhost:9101/vapix/camera

# Analytics info (HC4)
curl http://localhost:9102/vapix/analytics
```

## Performance

- **Frame Rate**: Matches source video FPS (29.97 for HC3/HC4)
- **Detection Sync**: < 1 frame latency via data channels
- **Memory**: ~200MB per camera instance
- **CPU**: ~5-10% per camera at 30 FPS

## Comparison to RTSP Approach

| Feature | WebRTC | RTSP + MediaMTX |
|---------|--------|-----------------|
| Latency | ~100-500ms | ~1-3s (HLS) |
| Detection Sync | Perfect (data channels) | Requires separate WebSocket |
| Browser Support | Native | Requires HLS.js |
| Complexity | Moderate | Higher (multiple services) |
| Scalability | Good | Better |

## License

Part of the Axis-Guardian project.

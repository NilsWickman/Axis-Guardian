# ONVIF Camera Emulator

Realistic ONVIF-compliant IP camera emulator with Profile S + Events support, WS-UsernameToken authentication, and Docker-based multi-camera deployment.

## Features

- **ONVIF Profile S** - Full Device Management + Media Services
- **ONVIF Events** - PullPoint subscriptions with motion and object detection events
- **WS-UsernameToken Authentication** - Digest-based SOAP security
- **Docker Per-Camera Architecture** - Each camera runs in isolated container with unique IP
- **MediaMTX Integration** - Returns real RTSP stream URLs
- **Camera Registry** - Metadata loaded from centralized YAML configuration
- **Event Generation** - Simulated motion detection and object analytics events

## Architecture

```
Docker Network: 172.20.0.0/24
├── camera1 (172.20.0.11:80) → ONVIF SOAP + Events
└── camera2 (172.20.0.12:80) → ONVIF SOAP + Events

Each container provides:
- /onvif/device_service   (Device Management)
- /onvif/media_service    (Media Profiles & Streaming)
- /onvif/events_service   (Event Subscriptions)
- RTSP URLs → MediaMTX (rtsp://host.docker.internal:8554/cameraX)
```

## Quick Start

### 1. Build Docker Image

```bash
make onvif-build
```

### 2. Start ONVIF Cameras

```bash
make onvif-up
```

This starts 2 camera containers accessible at:
- Camera 1: `http://172.20.0.11:80` (host port 8001)
- Camera 2: `http://172.20.0.12:80` (host port 8002)

**Default Credentials:** `admin` / `axis123`

### 3. Test with onvif-cli

```bash
# Install python-onvif-zeep
uv pip install onvif-zeep
# Or use uvx for one-off commands: uvx onvif-cli ...

# Test camera 1
onvif-cli devicemgmt GetDeviceInformation \
  --host 172.20.0.11 \
  --port 80 \
  --user admin \
  --password axis123

# Get media profiles
onvif-cli media GetProfiles \
  --host 172.20.0.11 \
  --port 80 \
  --user admin \
  --password axis123

# Get stream URI
onvif-cli media GetStreamUri \
  --host 172.20.0.11 \
  --port 80 \
  --user admin \
  --password axis123
```

### 4. Test Event Subscriptions

```python
from onvif import ONVIFCamera

# Connect to camera
mycam = ONVIFCamera('172.20.0.11', 80, 'admin', 'axis123')

# Create events service
events = mycam.create_events_service()

# Create PullPoint subscription
subscription = events.CreatePullPointSubscription()

# Pull messages (will receive motion/object events)
messages = subscription.PullMessages({'Timeout': 'PT10S', 'MessageLimit': 10})
print(messages)
```

## Configuration

### Environment Variables

Configuration is managed via the root `.env` file:

```bash
# ONVIF Service
ONVIF_HOST=0.0.0.0
ONVIF_PORT=80
ONVIF_ENABLE_AUTH=true

# Credentials
ONVIF_USERNAME=admin
ONVIF_PASSWORD=axis123

# MediaMTX Integration
MEDIAMTX_HOST=host.docker.internal
MEDIAMTX_RTSP_PORT=8554
MEDIAMTX_API_PORT=9997

# Event Generation (seconds)
ONVIF_EVENT_MOTION_INTERVAL=45
ONVIF_EVENT_OBJECT_INTERVAL=180

# Camera Registry
CAMERA_REGISTRY_PATH=simulation/config/cameras.yaml
```

### Per-Camera Override

Each Docker container can override settings via environment variables:

```yaml
# docker-compose.onvif.yml
environment:
  - CAMERA_ID=camera1
  - RTSP_URL=rtsp://host.docker.internal:8554/camera1
  - ONVIF_EVENT_MOTION_INTERVAL=30  # Override for this camera
```

## ONVIF Services

### Device Management Service

**Endpoint:** `http://{camera_ip}:80/onvif/device_service`

**Supported Operations:**
- `GetDeviceInformation` - Camera model, serial, firmware
- `GetSystemDateAndTime` - Current system time
- `GetCapabilities` - Available ONVIF services
- `GetServices` - Service endpoints and versions
- `GetHostname` - Device hostname
- `GetNetworkInterfaces` - Network configuration
- `GetDNS` - DNS settings
- `GetScopes` - WS-Discovery scopes

### Media Service

**Endpoint:** `http://{camera_ip}:80/onvif/media_service`

**Supported Operations:**
- `GetProfiles` - List all media profiles (main + sub-stream)
- `GetProfile` - Get specific profile details
- `GetStreamUri` - Get RTSP stream URL (points to MediaMTX)
- `GetVideoSources` - Video source configuration
- `GetVideoSourceConfigurations` - Video source config details
- `GetVideoEncoderConfigurations` - H.264 encoder settings
- `GetSnapshotUri` - Snapshot image URL
- `GetVideoEncoderConfigurationOptions` - Available encoder options

**Media Profiles:**
- `profile_1` (MainProfile) - 1920x1080, 30fps, H.264 High, 4Mbps
- `profile_2` (SubProfile) - 640x360, 15fps, H.264 Baseline, 512kbps

### Events Service

**Endpoint:** `http://{camera_ip}:80/onvif/events_service`

**Supported Operations:**
- `GetEventProperties` - List supported event topics
- `CreatePullPointSubscription` - Create event subscription
- `PullMessages` - Retrieve queued events
- `Unsubscribe` - Cancel subscription
- `Renew` - Extend subscription lifetime

**Event Topics:**
- `tns1:VideoSource/MotionAlarm` - Motion detection (true/false)
- `tns1:RuleEngine/ObjectsInside/Detected` - Object detection (person, vehicle, animal)

**Event Generation:**
- Motion events: Every ~45 seconds (configurable)
- Object events: Every ~180 seconds (configurable)
- Events generated in background thread per camera

## Authentication

ONVIF emulator implements **WS-Security UsernameToken** with **PasswordDigest**.

### How It Works

1. Client generates random nonce and timestamp
2. Client creates digest: `Base64(SHA-1(nonce + created + password))`
3. Client sends SOAP request with UsernameToken header
4. Server verifies digest matches expected value
5. Server checks timestamp within 5-minute window (replay attack prevention)

### Disabling Authentication

For testing/development:

```bash
# .env
ONVIF_ENABLE_AUTH=false
```

## Docker Commands

### Build Image
```bash
make onvif-build
```

### Start Cameras
```bash
make onvif-up
```

### Stop Cameras
```bash
make onvif-down
```

### View Logs
```bash
make onvif-logs
```

### Check Status
```bash
make onvif-status
```

### Restart Cameras
```bash
make onvif-restart
```

### Complete System (MediaMTX + ONVIF + Frontend)
```bash
make dev-onvif
```

## Integration with MediaMTX

The ONVIF emulator **does not stream video itself**. It returns RTSP URLs pointing to MediaMTX:

```
ONVIF GetStreamUri() → rtsp://host.docker.internal:8554/camera1
                       ↓
                    MediaMTX RTSP Server
                       ↓
                   Real Video Stream
```

### Workflow

1. FFmpeg publishes mock camera video to MediaMTX:
   ```bash
   bash shared/scripts/stream-mock-cameras.sh
   ```

2. ONVIF emulator provides discovery and configuration

3. Client queries ONVIF for stream URL:
   ```
   GetStreamUri(profile_1) → rtsp://host.docker.internal:8554/camera1
   ```

4. Client connects to MediaMTX RTSP stream

## Camera Registry

Camera metadata is loaded from `simulation/config/cameras.yaml`:

```yaml
cameras:
  - id: camera1
    name: "Main Entrance Camera"
    model: "AXIS P3245-LVE"
    brand: "Axis Communications"
    serial_number: "ACCC8E112345"
    firmware_version: "11.11.77"
    mac_address: "AC:CC:8E:00:00:01"
    resolution:
      width: 1920
      height: 1080
    fps: 30
    location:
      name: "Main Entrance"
      coordinates:
        x: 0
        y: 0
        z: 0
```

This ensures consistent camera metadata across ONVIF, VAPIX, and other services.

## Testing

### Unit Tests

```bash
cd simulation/onvif-emulator
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
pytest
```

### Integration Tests

```bash
# Install onvif-cli
uv pip install onvif-zeep

# Test all cameras
for i in 1 2; do
  echo "Testing camera${i}..."
  onvif-cli devicemgmt GetDeviceInformation \
    --host 172.20.0.1${i} \
    --port 80 \
    --user admin \
    --password axis123
done
```

### Manual Testing with ONVIF Device Manager

1. Download ONVIF Device Manager (Windows)
2. Add device manually:
   - IP: `172.20.0.11`
   - Port: `80`
   - Username: `admin`
   - Password: `axis123`
3. Browse device tree:
   - Device Information
   - Media Profiles
   - Stream URLs
   - Events

## Troubleshooting

### No Response from Camera

**Check container status:**
```bash
docker-compose -f docker-compose.onvif.yml ps
```

**View logs:**
```bash
docker logs onvif-camera1
```

**Test health endpoint:**
```bash
curl http://172.20.0.11:80/health
```

### Authentication Failures

**Verify credentials in `.env`:**
```bash
grep ONVIF_USERNAME .env
grep ONVIF_PASSWORD .env
```

**Test with auth disabled:**
```bash
# Temporarily disable in docker-compose.onvif.yml
environment:
  - ONVIF_ENABLE_AUTH=false
```

### RTSP Stream Not Found

**Verify MediaMTX is running:**
```bash
ps aux | grep mediamtx
curl http://localhost:9997/v3/paths/list
```

**Start camera streams:**
```bash
bash shared/scripts/stream-mock-cameras.sh
```

**Test RTSP directly:**
```bash
ffplay rtsp://localhost:8554/camera1
```

### Docker Network Issues

**Check network:**
```bash
docker network inspect onvif-cameras
```

**Verify `host.docker.internal` resolution:**
```bash
docker exec onvif-camera1 ping host.docker.internal
```

**Alternative:** Use host IP directly in `MEDIAMTX_HOST`

## Limitations

### Current Implementation

- **Simplified SOAP Generation** - Uses template-based XML instead of full zeep library
- **No WS-Discovery** - Cameras must be configured manually (no automatic discovery)
- **No PTZ Support** - Pan/Tilt/Zoom not implemented
- **No Imaging Service** - Image settings (brightness, contrast, etc.) not available
- **WSDL Placeholders** - Full ONVIF WSDL files not included (see `wsdl/README.md`)

### Future Enhancements

- [ ] Full zeep-based SOAP handling with WSDL validation
- [ ] WS-Discovery for automatic camera detection
- [ ] PTZ Service implementation
- [ ] Imaging Service for camera settings
- [ ] Integration with YOLOv8 detections for realistic events
- [ ] ONVIF Profile G (replay/recording)
- [ ] ONVIF Profile T (advanced video streaming)

## Project Integration

The ONVIF emulator integrates with Axis-Guardian:

1. **MediaMTX** - Provides RTSP streams referenced by GetStreamUri
2. **WebRTC Detection** - Future: Events synchronized with actual detections
3. **Camera Registry** - Shared metadata across all simulation services
4. **VAPIX Simulator** - Complementary HTTP API (non-ONVIF Axis features)

## References

- [ONVIF Official Specifications](https://www.onvif.org/profiles/specifications/)
- [python-onvif-zeep Documentation](https://github.com/FalkTannhaeuser/python-onvif-zeep)
- [ONVIF Core Specification](https://www.onvif.org/specs/core/ONVIF-Core-Specification.pdf)
- [WS-Security UsernameToken Profile](http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0.pdf)

## License

Part of the Axis-Guardian project. See root LICENSE file.

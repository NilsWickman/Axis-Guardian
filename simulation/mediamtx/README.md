# MediaMTX - Camera Stream Simulator

This directory contains MediaMTX, a ready-to-use real-time media server for simulating IP camera RTSP streams during development and testing.

## Overview

MediaMTX is integrated into the surveillance system infrastructure to provide:
- **RTSP streaming** for testing camera feed integration
- **WebRTC support** for browser-based camera viewing
- **HLS streaming** for HTTP Live Streaming
- **Recording capabilities** for stream archival
- **Multi-protocol support** (RTSP, RTMP, SRT, WebRTC, HLS)

## Usage

### Native Binary (Current Setup)

MediaMTX runs natively without Docker for better performance and easier debugging:

```bash
make infrastructure     # Starts MediaMTX
make stop-infrastructure # Stops MediaMTX
make dev                # Starts entire surveillance system (auto-starts MediaMTX)
```

### Stream Mock Cameras

To simulate camera feeds using your mock video files:

```bash
make cameras            # Stream all mock cameras (requires FFmpeg)
```

This will:
1. Check if FFmpeg is installed
2. Stream `new_site.mp4` to `rtsp://localhost:8554/camera1`
3. Stream `low_old.mp4` to `rtsp://localhost:8554/camera2`

### Access Streams

Once cameras are streaming, access them via:

- **RTSP**: `rtsp://localhost:8554/camera1`
- **HLS**: `http://localhost:8888/camera1`
- **WebRTC**: `http://localhost:8889/camera1`

### API Access

MediaMTX provides a REST API for management:

- **Base URL**: `http://localhost:9997/v3/`
- **List paths**: `GET http://localhost:9997/v3/paths/list`
- **Get config**: `GET http://localhost:9997/v3/config/global/get`

## Configuration

The MediaMTX configuration is located at:
```
simulation/docker-compose/mediamtx.yml
```

Key settings:
- **Recording**: Disabled by default, can be enabled per-path
- **Authentication**: Open for development (internal auth with `any` user)
- **Paths**: Pre-configured paths for `camera1` and `camera2`

## Streaming Script

The camera streaming script is located at:
```
simulation/scripts/stream-mock-cameras.sh
```

Usage:
```bash
# Stream all cameras
./simulation/scripts/stream-mock-cameras.sh all

# Stream specific camera
./simulation/scripts/stream-mock-cameras.sh camera1

# Custom MediaMTX host
MEDIAMTX_HOST=192.168.1.100 ./simulation/scripts/stream-mock-cameras.sh all
```

## Standalone Binary

This directory also contains the standalone MediaMTX binary (`mediamtx`) and default configuration (`mediamtx.yml`) for local testing outside Docker if needed.

To run standalone:
```bash
cd mediamtx
./mediamtx
```

## Requirements

- **FFmpeg**: Required for streaming video files to MediaMTX
  ```bash
  sudo apt-get install ffmpeg
  ```

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 8554 | RTSP | Camera stream ingress/egress |
| 1935 | RTMP | RTMP streaming |
| 8888 | HTTP | HLS streaming |
| 8889 | HTTP | WebRTC signaling |
| 8890 | UDP | SRT streaming |
| 9997 | HTTP | REST API |
| 9998 | HTTP | Metrics (Prometheus) |

## Troubleshooting

**MediaMTX not running:**
```bash
make database           # Restart all infrastructure
docker ps               # Check if surveillance-mediamtx container is up
```

**FFmpeg not found:**
```bash
sudo apt-get install ffmpeg
```

**Can't stream cameras:**
```bash
# Check if MediaMTX is accessible
curl http://localhost:9997/v3/config/global/get

# Check Docker logs
docker logs surveillance-mediamtx
```

## Documentation

- Official docs: https://mediamtx.org/docs/
- GitHub: https://github.com/bluenviron/mediamtx

## Integration Notes

MediaMTX is used in the surveillance system for:
1. **Development**: Simulating multiple camera feeds during frontend development
2. **Testing**: Testing Device Layer RTSP integration without physical cameras
3. **Demos**: Providing reliable, repeatable camera feeds for demonstrations
4. **CI/CD**: Automated testing of camera handling code

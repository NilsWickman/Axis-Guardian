# Site-Level Video Surveillance System

A comprehensive surveillance system integrating multiple cameras and loudspeakers for real-time site-level monitoring, intrusion detection, and automated deterrence.

> **Development Approach**: This project follows a **frontend-first workflow** where UI is developed with mock data for requirements elicitation, API contracts are defined based on frontend needs, and backend services implement those contracts.

## Architecture

This project uses a **TypeScript/Python stack**:

- **TypeScript**: Frontend (Vue 3) 
- **Python**: Camera mocking, Image analysis.
- **Database and CRUD backend to be decided**

## Quick Start

### Prerequisites

**Required:**
- Node.js 22.19.0
- Python 3.12
- FFmpeg 7.x (for camera simulation)
- PostgreSQL 15+ with PostGIS extension
- MediaMTX 1.x (included in `simulation/mediamtx/`)

**Optional (for GPU acceleration):**
- CUDA 12.x
- cuDNN 8.x

**Development Tools:**
- Make
- Git
- Curl

### Native Installation

This project uses **native installations** for all services. Follow the installation guide below for your operating system.

#### 1. Install PostgreSQL with PostGIS

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-15-postgis-3
```

**macOS:**
```bash
brew install postgresql@15 postgis
```

**Configuration:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS

# Create database and user
sudo -u postgres psql << EOF
CREATE USER dev WITH PASSWORD 'dev';
CREATE DATABASE surveillance_dev OWNER dev;
\c surveillance_dev
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL PRIVILEGES ON DATABASE surveillance_dev TO dev;
EOF
```

#### 2. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version  # Should show 7.x or higher
```

#### 3. Install Python Dependencies

```bash
# Create virtual environments for each service
cd simulation/webrtc-detection
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd ../object-detection
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

#### 4. Install Node.js Dependencies

```bash
# From project root
npm install
```

#### 5. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
vim .env  # or nano .env
```

**Key variables to configure:**
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5432`
- `POSTGRES_USER=dev`
- `POSTGRES_PASSWORD=dev`
- `POSTGRES_DB=surveillance_dev`

### Setup

```bash
# One-time setup (installs dependencies + builds MediaMTX)
make setup

# Start complete surveillance system
make dev
```

### Camera Simulation Quick Start

To run the complete camera simulation and detection pipeline:

**Step 1: Start MediaMTX Media Server**
```bash
make infrastructure     # Starts MediaMTX on localhost
```

**Step 2: Stream Mock Cameras**
```bash
make cameras            # FFmpeg streams video files to MediaMTX as RTSP feeds
```
This creates three camera streams at:
- `rtsp://localhost:8554/camera1` (people detection)
- `rtsp://localhost:8554/camera2` (car detection)
- `rtsp://localhost:8554/camera3` (multi-object detection)

Connect with VLC media player if you want to check it out.

**Step 3: Start Detection Service**

*WebRTC Detection (Recommended):*
```bash
make webrtc-detect      # Start WebRTC detection service on localhost:8081
```

**Step 4: View Results**

```bash
make dev                # Start frontend at localhost:5173
# Navigate to WebRTC Detection view in the UI
```

**All-in-One Command**
```bash
# Start everything (MediaMTX + cameras + WebRTC detection + frontend)
make dev
```

## Development Workflow

### Frontend-First Approach

1. **Phase 1: Frontend Development**
   - Develop UI components with mock data
   - Elicit requirements through interactive prototypes
   - Identify data needs and user interactions
   - Command: `make dev-frontend`

2. **Phase 2: Contract Definition**
   - Define OpenAPI schemas in `shared/schemas/` based on frontend requirements
   - Document API endpoints, request/response models, error cases
   - Review contracts with stakeholders

3. **Phase 3: Type Generation**
   - Generate TypeScript types from OpenAPI schemas
   - Generate API clients for frontend consumption
   - Command: `make generate-openapi`

4. **Phase 4: Backend Implementation**
   - TypeScript services implement API contracts
   - Python services provide device integration and analytics
   - All services adhere to generated type definitions
   - Command: `make dev` (all services)

## Camera Simulation & Detection Pipeline

### Mock IP Camera System

The project includes a sophisticated camera simulation system for development and testing without physical hardware:

**1. Video Source**
- Real surveillance footage stored in `shared/mock/camera-feeds/real-footage/`
- Three mock cameras with different detection scenarios:
  - `camera1`: People detection (`people-detection.mp4`)
  - `camera2`: Vehicle detection (`car-detection.mp4`)
  - `camera3`: Multi-object detection (`person-bicycle-car-detection.mp4`)

**2. MediaMTX Media Server**
- **Purpose**: Acts as a virtual RTSP broker, simulating IP camera streams
- **Streaming**: FFmpeg publishes video files to MediaMTX as RTSP streams
- **Protocols**: Supports RTSP, HLS, WebRTC, RTMP, and SRT
- **Ports**:
  - RTSP: `localhost:8554` (e.g., `rtsp://localhost:8554/camera1`)
  - HLS: `localhost:8888` (browser-compatible HTTP streaming)
  - WebRTC: `localhost:8889` (ultra-low latency browser streaming)
  - API: `localhost:9997` (programmatic control)
- **Recording**: Stores streams to `simulation/mediamtx/recordings/`
- **Configuration**: `simulation/mediamtx/mediamtx.yml` (or `mediamtx.custom.yml`)

**3. Stream Publishing**
- **Script**: `simulation/scripts/stream-mock-cameras.sh`
- **Method**: FFmpeg re-encodes video files in real-time and publishes via RTSP
- **Settings**:
  - H.264 encoding with `ultrafast` preset for low latency
  - TCP transport for reliable streaming
  - Infinite loop playback for continuous testing
- **Usage**:
  ```bash
  make cameras           # Stream all mock cameras
  make camera-status     # Check MediaMTX status
  ```

**4. Object Detection Layer**

**WebRTC Detection Service** (Primary):
- **Technology**: YOLOv8 with WebRTC video tracks + data channels
- **Synchronization**: Frame-perfect alignment (detections travel with video frames)
- **Latency**: ~500ms end-to-end
- **Method**:
  - Consumes RTSP from MediaMTX
  - Runs YOLOv8 detection on each frame
  - Sends video track + JSON metadata via WebRTC data channel
  - Frontend receives synchronized video + bounding box coordinates
- **Port**: `localhost:8081` (signaling server)
- **Models**: Configurable YOLOv8n (fast) to YOLOv8l (accurate)
- **Configuration**:
  - Confidence threshold: `0.5` (adjustable)
  - Frame skip: Process every Nth frame
  - Detection classes: person, car, truck, bus, motorbike, bicycle
- **Use Case**: Live monitoring with real-time overlays
- **Setup**: Python virtual environment with dependencies in `simulation/webrtc-detection/`

**Complete Data Flow**:
```
Video Files → FFmpeg → MediaMTX (RTSP) → WebRTC Detection Service → Browser
                                            ↓
                                       YOLOv8 Detector
                                            ↓
                                    WebRTC Data Channel
                                            ↓
                                    Frontend (Vue 3)
                                            ↓
                                    Canvas Overlay Rendering
```

### Why This Architecture?

**MediaMTX as RTSP Broker**:
- Simulates real IP cameras without physical hardware
- Provides authentic RTSP streams identical to production cameras
- Enables testing with multiple protocols (RTSP, HLS, WebRTC, RTMP)
- Supports recording and playback for regression testing

**WebRTC Data Channels for Detections**:
- Solves synchronization problem (detections arrive with exact frame)
- Eliminates timestamp drift between video and metadata
- Reduces latency from 10-30s (HLS) to ~500ms (WebRTC)
- Single connection handles video + metadata (simpler networking)

**YOLOv8 Integration**:
- Real-time object detection (30 FPS on GPU, 10-15 FPS on CPU)
- Configurable models for performance vs. accuracy tradeoff
- COCO dataset classes (person, car, truck, bus, bicycle, etc.)
- Adjustable confidence thresholds for precision/recall tuning

**FFmpeg Streaming**:
- Re-encodes video at native frame rate for realistic simulation
- Handles H.264 encoding with low-latency presets
- Loops video infinitely for continuous testing and development
- TCP transport for reliable RTSP delivery

### Port Reference Table

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 5173 | Frontend | HTTP | Vue.js development server |
| 8000 | Mock Server | HTTP | Mock backend APIs for frontend development |
| 8081 | WebRTC Detection | HTTP/WebRTC | Signaling server + detection service |
| 5432 | PostgreSQL | PostgreSQL | Database (user: dev, password: dev) |
| 8554 | MediaMTX | RTSP | RTSP camera streams |
| 8888 | MediaMTX | HLS | HTTP Live Streaming (browser-compatible) |
| 8889 | MediaMTX | WebRTC | WebRTC streaming |
| 9997 | MediaMTX | HTTP | MediaMTX REST API |

## Development Tips

### Recommended Development Flow

```bash
# 1. First-time setup
make setup              # Install deps + initialize database

# 2. Frontend-first development (Phase 1)
make dev                # Develop UI with mock data

# 3. After defining API contracts (Phase 2-3)
make api-contract       # Validate schemas and generate types

# 4. Full-stack development (Phase 4)
make dev-all            # Run all services together

# 5. Before committing
make quality            # Check formatting and linting
make build              # Verify all services compile
```

### Troubleshooting

**PostgreSQL connection issues:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@15  # macOS

# Test connection
psql -h localhost -U dev -d surveillance_dev
```

**Camera streams not working:**
```bash
# Check MediaMTX is running
ps aux | grep mediamtx

# Verify FFmpeg is installed
ffmpeg -version

# Test stream manually
ffplay rtsp://localhost:8554/camera1

# Check MediaMTX API
curl http://localhost:9997/v3/config/global/get
```

**Detection service issues:**
```bash
# WebRTC detection: Check signaling server
curl http://localhost:8081/health

# View detection logs
tail -f simulation/webrtc-detection/logs/*.log

# Check Python virtual environment
cd simulation/webrtc-detection
source venv/bin/activate
python -c "import cv2; import torch; print('Dependencies OK')"
```

**No detections showing:**
- Verify confidence threshold isn't too high (try `0.3` in `.env`)
- Check detection classes match video content
- Ensure video streams are active (`make cameras`)
- Review logs for errors
- Verify GPU is available: `python -c "import torch; print(torch.cuda.is_available())"`

**WebRTC connection fails:**
- Check firewall allows port 8081
- Verify STUN server is accessible
- Try using `localhost` instead of IP address for local development
- Check browser console for WebRTC errors

**Dependency issues:**
```bash
# Node.js dependencies
rm -rf node_modules frontend/node_modules
npm install

# Python dependencies
cd simulation/webrtc-detection
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Type errors after schema changes:**
```bash
make api-contract       # Regenerate types from OpenAPI schemas
make build              # Verify compilation
```

**Port conflicts:**
If you see "port already in use" errors:
```bash
# PostgreSQL conflict (5432)
sudo lsof -i :5432

# MediaMTX conflicts (8554, 8888, 8889, 9997)
sudo lsof -i :8554

# WebRTC Detection conflict (8081)
sudo lsof -i :8081

# Kill conflicting processes
kill -9 <PID>
# Or use the cleanup script
make cleanup-ports
```

## Documentation

- **[Native Setup Guide](NATIVE_SETUP.md)** - Comprehensive native installation instructions (PostgreSQL, MediaMTX, Python services)
- [Architecture Document](shared/docs/v2-Architecture-Document.md) - Complete system architecture and design decisions
- [Software Requirements Specification](shared/docs/SRS.md) - User stories and functional requirements
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Centralized configuration management
- [Port Configuration](PORT_CONFIGURATION.md) - Port assignments and how to change them
- [Object Detection Service](simulation/object-detection/README.md) - MQTT-based detection service
- [WebRTC Detection Service](simulation/webrtc-detection/README.md) - Ultra-low latency detection with data channels
- [WebRTC Detection Quickstart](simulation/webrtc-detection/QUICKSTART.md) - 5-minute setup guide

## Project Status

### Infrastructure ✅
- ✅ Native development environment (PostgreSQL with PostGIS, MediaMTX)
- ✅ MediaMTX media server for RTSP/WebRTC camera simulation
- ✅ Camera simulation pipeline with FFmpeg streaming

### Detection & Analytics ✅
- ✅ MQTT-based object detection service (YOLOv8)
- ✅ WebRTC detection service with data channels (frame-perfect sync)
- ✅ Real-time detection overlays in frontend
- ✅ Mock camera feeds with real surveillance footage

### Frontend 🚧
- ✅ Vue 3 + TypeScript + Pinia architecture
- ✅ Site map editor with camera placement
- ✅ WebRTC video streaming with detection overlays
- ✅ Timeline view for alarm history
- ✅ Focus view for camera feeds
- 🚧 Composables for canvas interaction, alarms, timeline
- 🚧 Integration with backend services (currently using mocks)

### Backend Services ⏳
- ✅ Project structure established
- ✅ TypeScript/Python hybrid architecture defined
- ✅ Development tooling configured
- ⏳ API contract definition (Phase 2)
- ⏳ Backend services implementation (Phase 4)
- ⏳ Python device layer integration

### Development Workflow ✅
- ✅ Frontend-first development approach
- ✅ Mock server for API prototyping
- ✅ OpenAPI schema validation and type generation
- ✅ Code quality tooling (ESLint, Prettier)

## License

MIT License
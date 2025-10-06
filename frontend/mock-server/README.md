# AXIS Mock Server

Mock server simulating AXIS camera VAPIX APIs for development and testing.

## Architecture

The mock server provides two streaming layers with clear separation:

### 1. **HTTP Streaming** (Frontend Demo) ✅ Implemented
- **Purpose**: Browser-compatible video streaming for frontend development
- **Use Case**: UI development, demos, E2E testing, prototyping
- **Protocol**: HTTP with standard HTML5 `<video>` elements
- **Endpoints**:
  - `/axis-cgi/media.cgi?camera=N` - MP4/H.264 over HTTP (works in `<video>` tag)
  - `/axis-cgi/mjpg/video.cgi?camera=N` - MJPEG stream
  - `/axis-cgi/jpg/image.cgi?camera=N` - JPEG snapshots
- **Benefits**:
  - ✅ Works directly in browsers with `<video src="...">`
  - ✅ No WebRTC complexity
  - ✅ Simple to integrate
  - ✅ Supports seeking, pause, playback controls
- **Status**: **Fully functional** - recommended for frontend development

### 2. **RTSP Streaming** (Device Layer) 🔜 Planned for Later
- **Purpose**: Full camera protocol simulation for backend/device integration
- **Use Case**: Backend services, VMS integration, device layer testing
- **Protocol**: RTSP/RTP/RTCP (industry standard)
- **Endpoints**: `rtsp://localhost:8554/axis-media/media.amp?camera=N`
- **Benefits**:
  - ✅ Industry-standard protocol
  - ✅ Low-latency streaming
  - ✅ Professional VMS compatibility
  - ✅ Metadata support
- **Status**: **Not yet implemented** - will be added for device-layer simulation

### Why Not WebRTC?
- WebRTC peer-to-peer is complex for server-side mocking
- HTTP streaming meets all frontend demo needs
- RTSP is the industry standard for camera integration
- Separating concerns: HTTP for UI, RTSP for devices

## VAPIX APIs

### Parameter Management
- `GET /axis-cgi/param.cgi?action=list&group=<group>` - List parameters
- `GET /axis-cgi/param.cgi?action=update&<param>=<value>` - Update parameter
- `GET /axis-cgi/param.cgi?action=add&template=streamprofile&...` - Add stream profile

### Device Information
- `POST /axis-cgi/basicdeviceinfo.cgi` - Get device properties (JSON API)
  - Methods: `getAllProperties`, `getProperties`, `getAllUnrestrictedProperties`

### Authentication
- **Default**: HTTP Basic Auth
  - Users: `root:pass`, `admin:admin`, `operator:operator`, `viewer:viewer`
- **Optional**: HTTP Digest Auth (Axis standard)
  - Enable in `server.ts` by uncommenting digest auth middleware

## Running

```bash
npm run dev      # Development with hot reload
npm start        # Production
```

## Coverage

**Current**: ~40-50% of VAPIX APIs
- ✅ Parameter management
- ✅ Device info
- ✅ HTTP video streaming
- ✅ Authentication
- ✅ WebRTC signaling (in progress)
- ❌ PTZ control (not planned)
- ❌ Audio (not planned)
- ❌ RTSP (planned for device layer)

## Video Files

Place video files in `videos/` directory. The server automatically discovers all video files and creates a camera for each one.

Supported formats: `.mp4`, `.avi`, `.mkv`, `.mov`, `.webm`

## Example Usage

```bash
# List cameras
curl -u root:pass http://localhost:8000/axis-cgi/cameras/list

# Get device info
curl -u root:pass -X POST http://localhost:8000/axis-cgi/basicdeviceinfo.cgi \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"1.0","method":"getAllProperties"}'

# Stream video (HTTP)
curl -u root:pass http://localhost:8000/axis-cgi/media.cgi?camera=1 > video.mp4

# WebRTC signaling (browser)
fetch('http://localhost:8000/webrtc/offer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ offer: localDescription })
})
```

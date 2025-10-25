# Port Configuration

This document describes all ports used in the Axis-Guardian development environment and how to change them.

## Current Port Assignments

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Frontend (Vite) | 5173 | HTTP | Vue development server |
| **WebRTC Detection** | **8081** | HTTP/WebRTC | Signaling server + RTCDataChannel |
| MediaMTX RTSP | 8554 | RTSP | Camera stream input |
| MediaMTX HLS | 8888 | HTTP | HLS video streaming |
| MediaMTX WebRTC | 8889 | HTTP/WebRTC | WebRTC video streaming |
| MediaMTX API | 9997 | HTTP | MediaMTX management API |

## How to Change WebRTC Detection Port

The WebRTC Detection service port can be configured in multiple locations. To change from the current port (8081) to a different port:

### 1. Root Environment Configuration

**File:** `.env` (project root)
```env
WEBRTC_DETECTION_PORT=8081  # Change this value
```

**File:** `.env.example` (project root)
```env
WEBRTC_DETECTION_PORT=8081  # Keep in sync with .env
```

### 2. Frontend Configuration

**File:** `.env` (project root)
```env
VITE_RTSP_PROXY_URL=http://localhost:8081  # Change port here
```

**File:** `frontend/src/config/environment.ts`
```typescript
rtspProxyUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'http://localhost:8081',
```

**File:** `frontend/src/composables/useWebRTCDetection.ts`
```typescript
const DEFAULT_OPTIONS: WebRTCDetectionOptions = {
  signalingUrl: 'http://localhost:8081',  // Change port here
  // ...
}
```

### 3. Documentation

**File:** `Makefile` (line ~105)
```makefile
@echo "  WebRTC Detection:  http://localhost:8081 (signaling + data channels)"
```

## Quick Port Change Script

To change the WebRTC port from 8081 to another port (e.g., 9081):

```bash
# Replace 8081 with your desired port in all files
NEW_PORT=9081

# Root environment configuration
sed -i "s/WEBRTC_DETECTION_PORT=8081/WEBRTC_DETECTION_PORT=$NEW_PORT/" .env
sed -i "s/WEBRTC_DETECTION_PORT=8081/WEBRTC_DETECTION_PORT=$NEW_PORT/" .env.example
sed -i "s/localhost:8081/localhost:$NEW_PORT/" .env
sed -i "s/localhost:8081/localhost:$NEW_PORT/" .env.example

# Frontend code
sed -i "s/localhost:8081/localhost:$NEW_PORT/" frontend/src/config/environment.ts
sed -i "s/localhost:8081/localhost:$NEW_PORT/" frontend/src/composables/useWebRTCDetection.ts

# Makefile
sed -i "s/localhost:8081/localhost:$NEW_PORT/" Makefile
```

## Port Conflict Troubleshooting

If you encounter port conflicts:

1. **Check what's using the port:**
   ```bash
   lsof -i :8081
   sudo netstat -tulpn | grep 8081
   ```

2. **Kill the process using the port:**
   ```bash
   # Find the process
   lsof -i :8081

   # Kill it
   kill -9 <PID>
   ```

3. **Use the cleanup script:**
   ```bash
   make cleanup-ports
   ```

## Notes

- All ports are configured in the root `.env` file for centralized management
- The WebRTC Detection service uses port **8081** by default
- PostgreSQL uses the standard port **5432** for native installations
- MediaMTX ports are configured in `simulation/mediamtx/mediamtx.yml`

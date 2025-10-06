# Frontend Integration Guide

## Mock Server Configuration for Frontend Development

The mock server has been configured to work seamlessly with the frontend application without requiring authentication for video streaming endpoints.

## Public Endpoints (No Auth Required)

The following endpoints are publicly accessible for easy frontend development:

### Camera Discovery
```
GET /axis-cgi/cameras/list
```
Returns list of all available cameras with their streaming URLs.

**Example Response:**
```json
[
  {
    "id": "cam-01",
    "name": "Low Old",
    "rtspUrl": "http://localhost:8000/axis-cgi/media.cgi?camera=1",
    "streamUrl": "http://localhost:8000/axis-cgi/media.cgi?camera=1",
    "mjpegUrl": "http://localhost:8000/axis-cgi/mjpg/video.cgi?camera=1",
    "snapshotUrl": "http://localhost:8000/axis-cgi/jpg/image.cgi?camera=1",
    "status": "online",
    "capabilities": {
      "ptz": false,
      "audio": false,
      "analytics": true,
      "http": true,
      "mjpeg": true,
      "rtsp": false,
      "resolution": "1920x1080",
      "fps": 30
    }
  }
]
```

### Video Streaming
```
GET /axis-cgi/media.cgi?camera=N
```
HTTP video stream (H.264/MP4) - works directly in HTML5 `<video>` element.

```
GET /axis-cgi/mjpg/video.cgi?camera=N
```
MJPEG stream.

```
GET /axis-cgi/jpg/image.cgi?camera=N
```
JPEG snapshot.

## Protected Endpoints (Auth Required)

The following endpoints require HTTP Basic authentication:

### Parameter Management
```bash
# Requires auth: root:pass, admin:admin, operator:operator, or viewer:viewer
curl -u root:pass 'http://localhost:8000/axis-cgi/param.cgi?action=list&group=Properties'
```

### Device Information
```bash
curl -u root:pass -X POST http://localhost:8000/axis-cgi/basicdeviceinfo.cgi \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"1.0","method":"getAllProperties"}'
```

## Frontend Integration Example

### Vue.js Component

```vue
<template>
  <div>
    <video
      :src="camera?.rtspUrl"
      autoplay
      muted
      playsinline
      loop
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const cameras = ref([])
const camera = ref(null)

onMounted(async () => {
  // Fetch cameras (no auth required)
  const response = await fetch('http://localhost:8000/axis-cgi/cameras/list')
  cameras.value = await response.json()

  // Select first camera
  if (cameras.value.length > 0) {
    camera.value = cameras.value[0]
  }
})
</script>
```

### React Component

```jsx
import { useState, useEffect } from 'react'

function CameraView() {
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/axis-cgi/cameras/list')
      .then(res => res.json())
      .then(data => {
        setCameras(data)
        if (data.length > 0) {
          setSelectedCamera(data[0])
        }
      })
  }, [])

  return (
    <video
      src={selectedCamera?.rtspUrl}
      autoPlay
      muted
      playsInline
      loop
    />
  )
}
```

## CORS Configuration

The server is configured with CORS enabled for all origins:
```javascript
app.use(cors())
```

This allows frontend development servers running on different ports to access the mock server.

## URL Structure

Note: The `rtspUrl` field currently points to HTTP streaming (not real RTSP):
- **Current**: `http://localhost:8000/axis-cgi/media.cgi?camera=1`
- **Future**: `rtsp://localhost:8554/axis-media/media.amp?camera=1` (when device layer is implemented)

This design allows the frontend to work now with HTTP streaming while maintaining compatibility for future RTSP implementation.

## Testing

### Quick Test in Browser Console
```javascript
// Fetch cameras
fetch('http://localhost:8000/axis-cgi/cameras/list')
  .then(r => r.json())
  .then(console.log)

// Create video element and play stream
const video = document.createElement('video')
video.src = 'http://localhost:8000/axis-cgi/media.cgi?camera=1'
video.autoplay = true
video.muted = true
document.body.appendChild(video)
```

### Using curl
```bash
# List cameras
curl http://localhost:8000/axis-cgi/cameras/list

# Download video
curl http://localhost:8000/axis-cgi/media.cgi?camera=1 > test.mp4

# Get snapshot
curl http://localhost:8000/axis-cgi/jpg/image.cgi?camera=1 > snapshot.jpg
```

## Video File Management

Place video files in `frontend/mock-server/videos/` directory:
```
videos/
├── low_old.mp4      → Camera 1
├── new_site.mp4     → Camera 2
└── parking.mp4      → Camera 3
```

The server automatically discovers video files and creates a camera for each one.

## Troubleshooting

### 401 Unauthorized on camera list
- **Issue**: `/axis-cgi/cameras/list` returns 401
- **Solution**: The endpoint is now public, restart the server

### Video won't play
- **Issue**: Video element shows spinner but no video
- **Check**:
  1. Video file exists in `videos/` directory
  2. Browser console for errors
  3. Network tab shows 200 OK response
  4. Video codec is H.264 (supported by browsers)

### CORS errors
- **Issue**: Cross-origin errors in console
- **Solution**: Server has CORS enabled, should work automatically

### No cameras found
- **Issue**: Empty camera list
- **Check**:
  1. Video files exist in `videos/` directory
  2. Files have supported extensions (.mp4, .avi, .mkv, .mov, .webm)
  3. Server is running on port 8000

## Performance

- Supports multiple concurrent streams
- Automatic video looping
- Range request support (seeking)
- Efficient streaming with Express

## Next Steps

When device-layer testing is needed:
1. Implement true RTSP server
2. Update `rtspUrl` to use `rtsp://` protocol
3. Keep HTTP streaming for frontend compatibility
4. Add metadata streaming support

For now, HTTP streaming provides everything needed for frontend development and demos!

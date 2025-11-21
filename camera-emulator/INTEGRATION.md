# Frontend Integration Guide

Complete guide for integrating the camera emulator with your Vue 3 frontend.

## Quick Start

1. **Start the emulator**:
   ```bash
   cd simulation/camera-emulator
   docker-compose up -d
   ```

2. **Verify it's running**:
   ```bash
   curl http://localhost:9101/health
   curl http://localhost:9102/health
   ```

3. **Connect from your frontend** (see examples below)

## Integration Methods

### Method 1: Using Existing useWebRTCDetection Composable

Your existing composable at `frontend/src/composables/useWebRTCDetection.ts` already supports this emulator!

#### Example Component

```vue
<template>
  <div class="camera-view">
    <video ref="videoRef" autoplay playsinline></video>

    <div class="detection-overlay">
      <div
        v-for="detection in detections"
        :key="detection.track_id"
        class="detection-box"
        :style="getDetectionStyle(detection)"
      >
        <span class="label">
          {{ detection.class_name }} {{ (detection.confidence * 100).toFixed(0) }}%
        </span>
      </div>
    </div>

    <div class="status">
      <p>Status: {{ connectionState }}</p>
      <p>Detections: {{ detections.length }}</p>
      <p>Quality: RTT {{ connectionQuality.rtt }}ms, Loss {{ connectionQuality.packetLoss }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWebRTCDetection } from '@/composables/useWebRTCDetection'

const props = defineProps<{
  cameraId: 'camera-HC3' | 'camera-HC4'
}>()

const videoRef = ref<HTMLVideoElement>()

const {
  connect,
  disconnect,
  detections,
  connectionState,
  connectionQuality,
  videoStream
} = useWebRTCDetection(props.cameraId)

// Map camera IDs to signaling URLs
const signalingUrls = {
  'camera-HC3': 'http://localhost:9101',
  'camera-HC4': 'http://localhost:9102'
}

onMounted(async () => {
  // Connect to emulator
  await connect(signalingUrls[props.cameraId])

  // Attach video stream when available
  if (videoRef.value && videoStream.value) {
    videoRef.value.srcObject = videoStream.value
  }
})

onUnmounted(() => {
  disconnect()
})

// Convert normalized bbox (0-1) to pixel coordinates for overlay
const getDetectionStyle = (detection: any) => {
  if (!videoRef.value) return {}

  const { width, height } = videoRef.value.getBoundingClientRect()
  const bbox = detection.bbox

  return {
    position: 'absolute',
    left: `${bbox.left * width}px`,
    top: `${bbox.top * height}px`,
    width: `${(bbox.right - bbox.left) * width}px`,
    height: `${(bbox.bottom - bbox.top) * height}px`,
    border: '2px solid #00ff00',
    pointerEvents: 'none'
  }
}
</script>

<style scoped>
.camera-view {
  position: relative;
  width: 100%;
  max-width: 1920px;
}

video {
  width: 100%;
  height: auto;
}

.detection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.detection-box {
  box-sizing: border-box;
}

.label {
  position: absolute;
  top: -20px;
  left: 0;
  background: rgba(0, 255, 0, 0.8);
  color: black;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.status {
  margin-top: 10px;
  font-family: monospace;
  font-size: 12px;
}
</style>
```

### Method 2: Direct WebRTC Implementation

If you want to implement WebRTC directly without the composable:

```typescript
import msgpack from 'msgpack-lite'

class CameraEmulatorClient {
  private pc: RTCPeerConnection
  private videoElement: HTMLVideoElement
  private detectionChannel?: RTCDataChannel
  private onDetection?: (data: any) => void

  constructor(
    videoElement: HTMLVideoElement,
    signalingUrl: string,
    onDetection?: (data: any) => void
  ) {
    this.videoElement = videoElement
    this.onDetection = onDetection

    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // Handle incoming video track
    this.pc.ontrack = (event) => {
      this.videoElement.srcObject = event.streams[0]
    }

    // Handle detection data channel
    this.pc.ondatachannel = (event) => {
      if (event.channel.label === 'detections') {
        this.detectionChannel = event.channel

        this.detectionChannel.onmessage = (e) => {
          // Decode msgpack data
          const detectionData = msgpack.decode(new Uint8Array(e.data))
          this.onDetection?.(detectionData)
        }
      }
    }

    // Start connection
    this.connect(signalingUrl)
  }

  private async connect(signalingUrl: string) {
    // Create offer
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Send offer to signaling server
    const response = await fetch(`${signalingUrl}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sdp: this.pc.localDescription!.sdp,
        type: this.pc.localDescription!.type
      })
    })

    const answer = await response.json()

    // Set remote description
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  disconnect() {
    this.detectionChannel?.close()
    this.pc.close()
  }
}

// Usage
const videoEl = document.getElementById('video') as HTMLVideoElement
const client = new CameraEmulatorClient(
  videoEl,
  'http://localhost:9101',
  (detectionData) => {
    console.log('Received detections:', detectionData)
    // Update UI with detection overlays
  }
)
```

### Method 3: Update Environment Configuration

Update your `frontend/src/config/environment.ts` to include emulator URLs:

```typescript
export const environment = {
  // ... existing config ...

  // Camera emulator URLs
  cameraEmulators: {
    'camera-HC3': 'http://localhost:9101',
    'camera-HC4': 'http://localhost:9102'
  }
}
```

Then update `useCameraConnectionManager.ts`:

```typescript
import { environment } from '@/config/environment'

const cameraWebRTCUrls: Record<string, string> = {
  // Use emulator URLs in development
  camera1: environment.cameraEmulators['camera-HC3'],
  camera2: environment.cameraEmulators['camera-HC4'],

  // Or keep existing URLs for real cameras
  // camera1: 'http://localhost:9001',
  // camera2: 'http://localhost:9002'
}
```

## Detection Data Format

The emulator sends detection metadata via WebRTC data channel using msgpack encoding:

```typescript
interface DetectionMetadata {
  camera_id: string           // "camera-HC3" or "camera-HC4"
  frame_number: number         // Current frame number
  timestamp: number            // Video timestamp in seconds
  detection_count: number      // Number of detections in this frame
  detection_frame: number      // Current playback frame
  detections: Detection[]      // Array of detections
}

interface Detection {
  bbox: {
    left: number      // Normalized 0-1
    top: number       // Normalized 0-1
    right: number     // Normalized 0-1
    bottom: number    // Normalized 0-1
  }
  confidence: number  // 0.0-1.0
  class_id: number    // COCO class ID (0=person, 1=bicycle, etc.)
  class_name: string  // "person", "car", etc.
  track_id?: number   // ByteTrack tracking ID
  track_state?: 'new' | 'active' | 'lost'
}
```

## Converting to Pixel Coordinates

Detections use normalized coordinates (0-1). Convert to pixels:

```typescript
function bboxToPixels(
  bbox: { left: number; top: number; right: number; bottom: number },
  videoWidth: number,
  videoHeight: number
) {
  return {
    x: bbox.left * videoWidth,
    y: bbox.top * videoHeight,
    width: (bbox.right - bbox.left) * videoWidth,
    height: (bbox.bottom - bbox.top) * videoHeight
  }
}
```

## Testing

### 1. Test Health Endpoints

```bash
# Camera HC3
curl http://localhost:9101/health
curl http://localhost:9101/vapix/camera
curl http://localhost:9101/vapix/analytics

# Camera HC4
curl http://localhost:9102/health
curl http://localhost:9102/vapix/camera
curl http://localhost:9102/vapix/analytics
```

### 2. Test WebRTC Connection

Open browser console and paste:

```javascript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
})

pc.ontrack = (e) => {
  const video = document.createElement('video')
  video.srcObject = e.streams[0]
  video.autoplay = true
  video.style.width = '100%'
  document.body.appendChild(video)
}

pc.ondatachannel = (e) => {
  if (e.channel.label === 'detections') {
    e.channel.onmessage = (msg) => {
      // Decode msgpack
      import('msgpack-lite').then(msgpack => {
        const data = msgpack.decode(new Uint8Array(msg.data))
        console.log('Detections:', data)
      })
    }
  }
}

pc.createOffer().then(offer => {
  return pc.setLocalDescription(offer)
}).then(() => {
  return fetch('http://localhost:9101/offer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sdp: pc.localDescription.sdp,
      type: pc.localDescription.type
    })
  })
}).then(r => r.json()).then(answer => {
  return pc.setRemoteDescription(new RTCSessionDescription(answer))
})
```

You should see video appear and detection logs in console!

## Monitoring

### View Logs

```bash
# Follow logs
docker-compose logs -f

# Just emulator logs
docker-compose logs -f camera-emulator
```

### Check Connections

```bash
# See active WebRTC connections
curl -s http://localhost:9101/health | jq '.active_connections'
```

## Troubleshooting

### Video not playing

**Problem**: Video element remains black
**Solution**:
- Check browser console for WebRTC errors
- Verify offer/answer exchange completed
- Check that STUN server is accessible
- Try opening `chrome://webrtc-internals` to debug

### No detections received

**Problem**: Data channel not receiving messages
**Solution**:
- Verify data channel opened (check channel.readyState)
- Confirm msgpack decoding is working
- Check browser console for errors
- Verify detection data exists: `curl http://localhost:9101/health`

### Port conflicts

**Problem**: Container won't start
**Solution**:
```bash
# Check what's using ports
lsof -i :9101 -i :9102

# Change ports in docker-compose.yml and src/main.py
```

### Performance issues

**Problem**: Choppy video or dropped frames
**Solution**:
- Check network quality in connection stats
- Reduce video quality if needed
- Verify Docker has sufficient resources
- Check CPU usage: `docker stats axis-camera-emulator`

## Advanced Configuration

### Custom Camera Configuration

Edit `src/main.py` to add more cameras:

```python
cameras = [
    # ... existing cameras ...
    {
        'camera_id': 'camera-custom',
        'video_path': base_path / 'custom-video.mp4',
        'detections_path': base_path / 'custom-detections.json',
        'port': 9103,
        'vapix_metadata': {
            'camera_model': 'AXIS Q1656-LE',
            'camera_serial': 'CUSTOM123',
        }
    }
]
```

Don't forget to:
1. Update `docker-compose.yml` to expose port 9103
2. Rebuild: `docker-compose up --build`

### Environment-based Configuration

Create different compose files for dev/prod:

```yaml
# docker-compose.dev.yml
services:
  camera-emulator:
    environment:
      - LOG_LEVEL=DEBUG
      - CAMERA_DATA_PATH=/shared/cameras/preprocessed/1080p
```

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Deployment

For production use with multiple emulator instances:

```yaml
# docker-compose.prod.yml
services:
  camera-emulator-1:
    build: .
    ports:
      - "9101:9101"
    environment:
      - CAMERA_DATA_PATH=/data/camera1
    restart: always

  camera-emulator-2:
    build: .
    ports:
      - "9102:9102"
    environment:
      - CAMERA_DATA_PATH=/data/camera2
    restart: always
```

## Next Steps

1. ✅ Start the emulator
2. ✅ Test health endpoints
3. ✅ Connect from frontend
4. ✅ Verify video playback
5. ✅ Confirm detection sync
6. 🎉 Build your application!

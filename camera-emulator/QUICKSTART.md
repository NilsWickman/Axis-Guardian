# Camera Emulator - Quick Start Guide

## What This Does

Streams your preprocessed MP4 videos (`view-HC3-preprocessed.mp4`, `view-HC4-preprocessed.mp4`) as emulated VAPIX cameras with synchronized detection metadata over WebRTC.

## 30-Second Setup

```bash
# 1. Navigate to emulator directory
cd simulation/camera-emulator

# 2. Start the emulator
docker-compose up -d

# 3. Verify it's running
curl http://localhost:9101/health
curl http://localhost:9102/health
```

**Done!** Your cameras are now streaming on:
- **Camera HC3**: `http://localhost:9101`
- **Camera HC4**: `http://localhost:9102`

## Connect from Frontend

Your existing `useWebRTCDetection` composable works out of the box:

```vue
<script setup>
import { useWebRTCDetection } from '@/composables/useWebRTCDetection'

const { connect, detections, videoStream } = useWebRTCDetection('camera-HC3')

// Connect to emulator
await connect('http://localhost:9101')
</script>
```

## What You Get

✅ **Video Stream**: MP4 playback via WebRTC
✅ **Frame-synchronized Detections**: Via WebRTC data channel (msgpack)
✅ **VAPIX API**: Camera info and analytics endpoints
✅ **Continuous Looping**: Videos restart automatically
✅ **Multi-camera**: 2 cameras running simultaneously

## Verify It Works

### Test Video + Detections in Browser

Open browser console and paste:

```javascript
const pc = new RTCPeerConnection()

pc.ontrack = e => {
  const video = document.createElement('video')
  video.srcObject = e.streams[0]
  video.autoplay = true
  document.body.appendChild(video)
}

pc.ondatachannel = e => {
  e.channel.onmessage = msg => console.log('Got detection data!')
}

pc.createOffer()
  .then(o => pc.setLocalDescription(o))
  .then(() => fetch('http://localhost:9101/offer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sdp: pc.localDescription.sdp,
      type: pc.localDescription.type
    })
  }))
  .then(r => r.json())
  .then(a => pc.setRemoteDescription(a))
```

You should see the video playing!

## Architecture

```
Preprocessed Data (shared/cameras/preprocessed/1080p/)
├── view-HC3-preprocessed.mp4              → Video Track
└── view-HC3-preprocessed.detections.json.gz → Data Channel (msgpack)
                    ↓
              Camera Emulator
         (WebRTC Server + VAPIX API)
                    ↓
              Your Frontend
       (useWebRTCDetection composable)
```

## Detection Data Format

Each frame sends this via data channel:

```typescript
{
  camera_id: "camera-HC3",
  frame_number: 42,
  timestamp: 1.4,
  detection_count: 3,
  detections: [
    {
      bbox: { left: 0.5, top: 0.3, right: 0.7, bottom: 0.8 }, // normalized 0-1
      confidence: 0.95,
      class_name: "person",
      track_id: 1
    }
  ]
}
```

## Available Endpoints

### Camera HC3 (port 9101)
- `POST /offer` - WebRTC signaling
- `GET /health` - Health check
- `GET /vapix/camera` - Camera info
- `GET /vapix/analytics` - Analytics metadata

### Camera HC4 (port 9102)
- Same endpoints as HC3

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up --build -d

# Check container status
docker ps | grep camera-emulator

# Check resource usage
docker stats axis-camera-emulator
```

## Troubleshooting

**Video not showing?**
- Check browser console for WebRTC errors
- Verify offer/answer exchange: `docker-compose logs`
- Open `chrome://webrtc-internals` to debug

**Port conflicts?**
- Ports 9101/9102 already in use
- Change in `docker-compose.yml` and `src/main.py`
- Rebuild: `docker-compose up --build`

**No detections?**
- Check data channel opened: look for "Detection data channel opened" in logs
- Verify msgpack decoding in frontend
- Test health endpoint: `curl http://localhost:9101/health`

## Next Steps

1. ✅ Emulator is running
2. 📖 Read [INTEGRATION.md](INTEGRATION.md) for detailed frontend examples
3. 📖 Read [README.md](README.md) for full documentation
4. 🎉 Start building your application!

## Key Files

- `src/main.py` - Main emulator code
- `docker-compose.yml` - Deployment config
- `requirements.txt` - Python dependencies
- `INTEGRATION.md` - Detailed integration guide
- `README.md` - Full documentation

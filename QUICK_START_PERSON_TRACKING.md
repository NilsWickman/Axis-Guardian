# Quick Start: Person Position Tracking

## Real-Time WebRTC Integration

The person position tracking system now integrates directly with WebRTC data channels to show **real-time person positions from live camera feeds** on the site map!

## How to Test

### 1. Start the System

```bash
# Start complete system with WebRTC detection
make dev
```

This starts:
- MediaMTX (WebRTC/RTSP server)
- Camera feeds with YOLOv8 detections
- WebRTC detection service (port 8080)
- Frontend (port 5173)

### 2. View Live Detections

Open: **http://localhost:5173**

You have two options to see person positions:

#### Option A: WebRTC Detection View (See Detections First)
1. Navigate to **"Live Detection (WebRTC)"** from sidebar
2. You'll see 4 camera feeds with bounding boxes
3. Watch for person detections in green boxes
4. This confirms detections are working

#### Option B: Site Map View (See Positions on Map)
1. Navigate to **"Site Maps"** from sidebar
2. Select **"Auditorium - Main Hall"**
3. Click **"View 2D"**
4. Look for the **"👤 Positions"** toggle in the header
5. Ensure it's enabled (highlighted)

### 3. Watch Person Positions Appear

When people are detected in the camera feeds, you'll see:

- **Colored dots** appear on the site map at their estimated positions
- **Movement trails** following people as they walk
- **Real-time updates** as detection data flows through WebRTC data channels
- **Statistics panel** showing active person count

**Color coding:**
- 🟢 Green (Emerald) = Camera 1 detections
- 🔵 Blue = Camera 2 detections
- 🔴 Red = Camera 3 detections
- 🟡 Amber = Camera 4 detections

## How It Works

```
Camera Feed (YOLOv8)
  ↓
Person Detected (bbox coordinates)
  ↓
WebRTC Data Channel (MessagePack)
  ↓
Frontend receives detection metadata
  ↓
Transform image coords → world coords
  ↓
Display on site map canvas
```

**Data Flow:**
1. Python WebRTC service detects people with YOLOv8
2. Detection metadata sent via WebRTC data channel (MessagePack binary format)
3. `useWebRTCDetection` receives metadata
4. Emits to `usePersonPositionTracking` via event bus
5. Transforms bounding box center → ground position on site map
6. `PersonPositionOverlay` renders positions in real-time

## Console Logging

Open browser DevTools (F12) to see:

```
[PersonPositionTracking] Registered WebRTC detection handler
```

When detections arrive:
```
Processing WebRTC detection for camera1
Added 2 person positions to site map
```

## Troubleshooting

### No positions showing?

**Check WebRTC connection:**
1. Open **"Live Detection (WebRTC)"** view
2. Status bar should show:
   - ✅ WebRTC: Connected
   - ✅ Data Channel: Open
3. You should see video feeds with detection boxes

**Check console for errors:**
- Open DevTools (F12) → Console tab
- Look for WebRTC connection errors
- Check for transformation errors

**Verify camera feeds are running:**
```bash
# Check MediaMTX streams
curl http://localhost:9997/v3/paths/list

# Should show camera1, camera2, camera3, camera4
```

**Check WebRTC detection service:**
```bash
# Verify service is healthy
curl http://localhost:8080/health

# Should return: {"status": "healthy"}
```

### Positions are inaccurate?

The accuracy depends on camera calibration. The default configuration in `useSiteMapStore.ts` has calibrated positions for the auditorium:

- Camera 1: (16.22m, 0.3m, height: 1.68m, azimuth: 18°)
- Camera 2: (0.9m, 0.5m, height: 1.67m, azimuth: 313°)
- Camera 3: (20.6m, 28.31m, height: 2.62m, azimuth: 140°)
- Camera 4: (10.57m, 16.31m, height: 1.84m, azimuth: 339°)

These positions are based on the actual camera setup in the auditorium scene.

### Performance issues?

If the visualization is laggy:

1. **Reduce confidence threshold** (fewer detections):
   ```typescript
   minConfidence: 0.7  // Instead of 0.5
   ```

2. **Disable trails**:
   ```typescript
   showTrails: false
   ```

3. **Reduce trail length**:
   ```typescript
   maxTrailLength: 10  // Instead of 20
   ```

## Configuration

Edit `frontend/src/views/SiteMapViewer.vue`:

```typescript
// Person position tracking setup
const positionTracking = usePersonPositionTracking({
  enabled: !isEditingMode.value,
  updateIntervalMs: 500,           // How often to check for new detections
  minConfidence: 0.5,               // Minimum detection confidence (0-1)
  enableWebRTCIntegration: true,   // Enable WebRTC data channel integration
})

// Display options
const personOverlayOptions = reactive({
  showTrails: true,           // Movement trails
  showConfidence: true,       // Confidence rings
  showPersonIcon: false,      // Person silhouette icon
  showStats: true,            // Statistics panel
  showHeatmap: false,         // Activity heatmap
})
```

## Expected Behavior

✅ **Working correctly:**
- Positions appear within 1-2 seconds of detection
- Positions move smoothly as people walk
- Trails follow people's paths
- Old positions fade out after 30 seconds
- Statistics show accurate person count

❌ **Not working:**
- No WebRTC connection (check service is running)
- No video feeds (check MediaMTX and cameras)
- No detections (check YOLOv8 confidence threshold)
- Positions don't match reality (check camera calibration)

## Next Steps

Once you verify it's working:

1. **Fine-tune calibration** - Adjust camera positions for better accuracy
2. **Add zone analytics** - Trigger alerts when people enter zones
3. **Track occupancy** - Count people in different areas
4. **Movement analysis** - Analyze common paths and dwell times

## Technical Details

- **WebRTC Protocol**: Real-time video + data channels
- **Serialization**: MessagePack (binary, ~50% smaller than JSON)
- **Coordinate System**: Pinhole camera model with ground plane intersection
- **Update Rate**: Real-time (every frame that has detections)
- **Latency**: ~100-300ms from detection to visualization

## Support

For issues:
1. Check browser console for errors
2. Verify WebRTC service logs: `simulation/webrtc-detection/logs/`
3. See full documentation: `PERSON_POSITION_TRACKING.md`

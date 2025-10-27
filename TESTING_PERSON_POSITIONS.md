# Testing Person Position Tracking

## Quick Start

1. **Start the development environment:**
   ```bash
   make dev
   ```
   This starts:
   - MediaMTX (RTSP/WebRTC server)
   - Camera streams with detections
   - WebRTC detection service
   - Frontend dev server

2. **Access the application:**
   Open your browser to: **http://localhost:5173**

3. **Navigate to the Site Map 2D Viewer:**
   - Click on **"Site Maps"** in the sidebar
   - Select the **"Auditorium - Main Hall"** site map
   - Click **"View 2D"** button

   Or go directly to: **http://localhost:5173/site-maps/map-auditorium/view-2d**

4. **Toggle Person Position Tracking:**
   - Look for the **"👤 Positions"** button in the top controls
   - Click to enable/disable person position visualization
   - When enabled and people are detected, you'll see:
     - Colored markers showing person locations
     - Movement trails following their paths
     - Confidence rings around markers
     - Live statistics panel

## What You Should See

### Site Map Display
- **Canvas**: 2D floor plan of the auditorium (21m × 28m)
- **Cameras**: 4 cameras positioned on the map (emerald, blue, red, amber)
- **Walls**: Building structure and seating dividers
- **Grid**: Background grid for spatial reference

### Person Position Markers
When people are detected by cameras:
- **Green dots** - People detected by Camera 1 (front-right)
- **Blue dots** - People detected by Camera 2 (front-left)
- **Red dots** - People detected by Camera 3 (back-right)
- **Amber dots** - People detected by Camera 4 (center-back)

### Interactive Features
- **Pan**: Click and drag to move around the map
- **Zoom**: Scroll wheel to zoom in/out
- **Hover**: Hover over cameras to see details
- **Toggle Grid**: Show/hide background grid
- **Toggle Labels**: Show/hide camera labels
- **Toggle Positions**: Show/hide person positions

## Expected Behavior

### Position Tracking
- Detections update every **500ms**
- Positions fade out after **30 seconds** of no detection
- Trails show last **20 positions** per person
- Minimum confidence: **0.5** (50%)

### Position Accuracy
The accuracy of person positions depends on:
1. **Camera calibration** - How accurately cameras are positioned on the map
2. **Detection quality** - How well YOLOv8 detects people
3. **Ground plane assumption** - Assumes people are standing on the floor

### Performance
- Lightweight SVG rendering
- Automatic cleanup of old positions
- No impact on video streaming performance

## Troubleshooting

### No Person Positions Showing

**1. Check if cameras are streaming:**
   ```bash
   # In a terminal, check MediaMTX
   curl http://localhost:9997/v3/paths/list
   ```
   You should see: `camera1`, `camera2`, `camera3`, `camera4`

**2. Verify detection service is running:**
   ```bash
   # Check if WebRTC detection service is running
   curl http://localhost:8080/health
   ```
   Should return: `{"status": "healthy"}`

**3. Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for WebSocket connections

**4. Verify cameras are on the site map:**
   - All 4 cameras should be visible on the canvas
   - If not, the site map may not be loaded correctly

**5. Ensure people are in view:**
   - The mock videos might not have people in all frames
   - Try moving around in the camera feeds

### Positions Are Inaccurate

**Camera calibration issues:**
1. Check camera positions in site map:
   - Camera 1: (16.22m, 0.3m, height: 1.68m, azimuth: 18°)
   - Camera 2: (0.9m, 0.5m, height: 1.67m, azimuth: 313°)
   - Camera 3: (20.6m, 28.31m, height: 2.62m, azimuth: 140°)
   - Camera 4: (10.57m, 16.31m, height: 1.84m, azimuth: 339°)

2. Verify site map scale:
   - Default: 60 pixels per meter
   - Check in `useSiteMapStore.ts`

**Ground plane assumption:**
- The system assumes people are on the ground (z=0)
- If cameras are pointed at different heights, accuracy will vary

### Performance Issues

If the UI is slow:
1. **Reduce update frequency:**
   Edit `SiteMapViewer.vue`:
   ```typescript
   updateIntervalMs: 1000,  // Instead of 500
   ```

2. **Disable trails:**
   ```typescript
   showTrails: false
   ```

3. **Increase expiry time:**
   ```typescript
   positionExpiryMs: 10000,  // 10 seconds instead of 30
   ```

4. **Reduce history:**
   ```typescript
   maxPositionHistory: 50,  // Instead of 100
   ```

## Customization

### Change Detection Confidence
In `SiteMapViewer.vue`:
```typescript
minConfidence: 0.3,  // Lower = more detections (but more false positives)
```

### Change Marker Colors
In `PersonPositionOverlay.vue`:
```typescript
const cameraColors: Record<string, string> = {
  'camera1': '#10b981', // Change to any hex color
  'camera2': '#3b82f6',
  'camera3': '#ef4444',
  'camera4': '#f59e0b',
}
```

### Enable Heatmap
```typescript
personOverlayOptions: {
  showHeatmap: true,  // Grid-based activity heatmap
}
```

### Show Person Icons
```typescript
personOverlayOptions: {
  showPersonIcon: true,  // Small person silhouette on markers
}
```

## Advanced Testing

### Test with Real Cameras

1. **Configure real cameras** in `.env`:
   ```bash
   CAMERA1_RTSP_URL=rtsp://your-camera-ip/stream1
   ```

2. **Calibrate camera positions:**
   - Navigate to Site Map Editor
   - Drag cameras to their actual physical locations
   - Set accurate height, rotation, and elevation

3. **Measure site map scale:**
   - Measure a known distance in meters
   - Calculate: `scale = pixels / meters`

### Test Coordinate Transformation

Check browser console for debugging:
```javascript
// In PersonPositionTracking composable
console.log('Detection:', detection)
console.log('World position:', worldPos)
console.log('Camera placement:', cameraPlacement)
```

### Verify Transformation Accuracy

1. Place a person at a known location
2. Check the position marker on the site map
3. Compare with actual location
4. Adjust camera calibration if needed

## Next Steps

Once person position tracking is working:

1. **Add zone alerts** - Trigger alarms when people enter restricted zones
2. **Track occupancy** - Count people in different areas
3. **Analyze movement patterns** - Identify common paths
4. **Person re-identification** - Track individuals across cameras
5. **Dwell time analytics** - Track how long people stay in areas

## Reference

- **Documentation**: `PERSON_POSITION_TRACKING.md`
- **Store**: `frontend/src/stores/personPositions.ts`
- **Transform Utils**: `frontend/src/utils/cameraTransform.ts`
- **Composable**: `frontend/src/composables/usePersonPositionTracking.ts`
- **Overlay Component**: `frontend/src/components/features/site-map/PersonPositionOverlay.vue`

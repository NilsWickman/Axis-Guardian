# Person Position Tracking on Site Map

This feature enables real-time visualization of people's positions on the site map by transforming camera detection coordinates to world coordinates.

## Architecture

### Components

1. **PersonPositionStore** (`frontend/src/stores/personPositions.ts`)
   - Pinia store for managing person positions and tracks
   - Tracks active positions with automatic expiry (default: 30 seconds)
   - Maintains movement trails for each tracked person
   - Configuration options for trails, heatmaps, and display

2. **Camera Transform Utilities** (`frontend/src/utils/cameraTransform.ts`)
   - Implements pinhole camera model for coordinate transformation
   - Transforms image coordinates (pixels) to world coordinates (meters)
   - Accounts for camera position, height, rotation (azimuth), and elevation
   - Supports both precise and simplified transformation methods

3. **Position Tracking Composable** (`frontend/src/composables/usePersonPositionTracking.ts`)
   - Integrates detection stream with position store
   - Automatically processes person detections from all cameras
   - Transforms detections to world coordinates using camera calibration
   - Updates every 500ms (configurable)
   - Minimum confidence threshold: 0.5 (configurable)

4. **PersonPositionOverlay Component** (`frontend/src/components/features/site-map/PersonPositionOverlay.vue`)
   - Vue component that renders person positions on the site map
   - Features:
     - Real-time position markers (color-coded by camera)
     - Movement trails showing person trajectories
     - Confidence indicators (ring around markers)
     - Optional person icons
     - Grid-based heatmap visualization
     - Live statistics overlay

5. **SiteMapViewer Integration** (`frontend/src/views/SiteMapViewer.vue`)
   - Integrated overlay into site map viewer
   - Added toggle control for showing/hiding positions
   - Synced with canvas transformations (zoom, pan)
   - Automatically disabled in edit mode

## How It Works

### Coordinate Transformation Pipeline

```
Camera Detection (bbox in image)
  ↓
Extract bottom-center point (person's feet position)
  ↓
Calculate camera intrinsics from FOV
  ↓
Normalize to camera ray direction
  ↓
Apply camera rotation (azimuth + elevation)
  ↓
Intersect ray with ground plane (z=0)
  ↓
World coordinates on site map (x, y in meters)
  ↓
Convert to site map pixels using scale
  ↓
Display on overlay
```

### Key Formulas

**Camera Intrinsics:**
```
focalLength = (imageWidth / 2) / tan(FOV / 2)
```

**Ground Plane Intersection:**
```
distance = -cameraHeight / rayDirectionZ
worldX = cameraX + rayX * distance
worldY = cameraY + rayY * distance
```

## Configuration

### Site Map Setup

Cameras must be properly configured in the site map with:
- **Position (x, y)**: Camera location in meters
- **Height (z)**: Camera mounting height in meters
- **Azimuth**: Horizontal rotation in degrees (0° = North, 90° = East)
- **Elevation**: Vertical tilt in degrees (positive = up, negative = down)
- **FOV**: Field of view in degrees (typically 90°)
- **Scale**: Site map pixels per meter

### Position Tracking Options

```typescript
usePersonPositionTracking({
  enabled: true,              // Enable/disable tracking
  updateIntervalMs: 500,      // Update frequency (ms)
  minConfidence: 0.5,         // Minimum detection confidence
})
```

### Display Options

```typescript
personOverlayOptions = {
  showTrails: true,           // Show movement trails
  showConfidence: true,       // Show confidence rings
  showPersonIcon: false,      // Show person icon overlay
  showStats: true,            // Show statistics panel
  showHeatmap: false,         // Show heatmap visualization
}
```

## Usage

### Viewing Person Positions

1. Navigate to **Site Map** view
2. Ensure cameras are running with person detection enabled
3. Toggle **"👤 Positions"** button to show/hide positions
4. Person positions appear as colored markers:
   - **Green** (emerald) - Camera 1
   - **Blue** - Camera 2
   - **Red** - Camera 3
   - **Amber** - Camera 4

### Understanding the Visualization

- **Marker size**: Indicates recent detection (larger = more recent)
- **Marker opacity**: Fades over time (0.3-1.0 over 10 seconds)
- **Trail lines**: Show movement path for last 20 positions
- **Confidence ring**: Dashed ring shows detection confidence
- **Statistics panel**: Shows active person count and total positions

## Accuracy Considerations

The coordinate transformation accuracy depends on:

1. **Camera Calibration**
   - Accurate camera position on site map
   - Correct height measurement
   - Precise azimuth and elevation angles
   - Accurate FOV setting

2. **Environmental Factors**
   - Ground plane assumption (people standing on floor)
   - Camera lens distortion (not currently corrected)
   - Mounting stability

3. **Detection Quality**
   - Bounding box accuracy affects foot position estimate
   - Confidence threshold filters low-quality detections

## Future Enhancements

Potential improvements:

1. **Multi-camera fusion**: Combine detections from overlapping camera views
2. **Kalman filtering**: Smooth position estimates and predict trajectories
3. **Lens distortion correction**: Account for camera lens characteristics
4. **Person re-identification**: Track individuals across cameras
5. **Zone analytics**: Alert when persons enter restricted zones
6. **Dwell time tracking**: Track how long persons remain in areas
7. **Path analysis**: Analyze common movement patterns

## Testing

To test the feature:

```bash
# Start the complete development environment
make dev

# Or start individual components
make infrastructure  # MediaMTX
make cameras        # Camera streams
# In separate terminal:
cd frontend && yarn dev
```

Then:
1. Open http://localhost:5173
2. Navigate to Site Map view
3. Ensure cameras are streaming with person detections
4. Observe person positions appearing on the site map

## Troubleshooting

**No positions showing:**
- Verify cameras are online and streaming
- Check detection confidence threshold (try lowering to 0.3)
- Ensure cameras are placed on the site map
- Check browser console for transformation errors

**Incorrect positions:**
- Verify camera calibration parameters (x, y, z, azimuth, elevation)
- Check site map scale (pixels per meter)
- Ensure camera FOV is correct
- Validate camera height measurement

**Performance issues:**
- Reduce update interval (increase `updateIntervalMs`)
- Disable trails or heatmap
- Reduce `maxPositionHistory`
- Increase position expiry time

## API Reference

See inline documentation in:
- `frontend/src/stores/personPositions.ts`
- `frontend/src/utils/cameraTransform.ts`
- `frontend/src/composables/usePersonPositionTracking.ts`

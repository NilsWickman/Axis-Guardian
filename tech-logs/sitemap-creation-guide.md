# Sitemap Creation Guide

## Overview

This guide explains how to create a sitemap JSON file from a floor plan PDF for the Axis-Guardian multi-camera tracking system. The sitemap defines the physical layout of the monitored space, including dimensions, walls, cameras, obstacles, and doors.

## Prerequisites

- Floor plan PDF with measurements (in meters or feet)
- Camera placement information (positions, mounting heights, orientations)
- Camera specifications (model, field of view, resolution)

## File Location and Schema

- **Sitemap files**: `frontend/public/sitemap-*.json`
- **Schema reference**: `shared/config/sitemap.schema.json`

Link the schema in your JSON for validation:
```json
{
  "$schema": "./sitemap.schema.json",
  ...
}
```

## Coordinate System

### Important: Frontend Y-Axis is Flipped

The frontend renders with **Y=0 at the top of the screen**. This means:
- Lower Y values appear at the **top** of the visualization
- Higher Y values appear at the **bottom** of the visualization

```
Frontend Display:          JSON Coordinates:
┌─────────────────┐        y=0  ────────────────
│   y=0 (top)     │             Room back
│                 │
│                 │        y increases
│                 │             ↓
│   y=max (bottom)│
└─────────────────┘        y=max ────────────────
                                Room entrance
```

### Coordinate Origin

- Origin (0, 0) is typically at the **top-left corner** of the floor plan
- X increases to the **right** (East)
- Y increases **downward** on screen (but upward in physical space when looking at a map)

### Azimuth Convention

Camera azimuth follows compass directions:
- **0°** = North (+Y direction in data, but appears as "up" on floor plan)
- **90°** = East (+X direction)
- **180°** = South (-Y direction)
- **270°** = West (-X direction)

## Step-by-Step Process

### Step 1: Analyze the Floor Plan PDF

1. **Identify the overall dimensions** (width × height in meters/feet)
2. **Mark the origin point** - typically a corner of the building
3. **Note all wall segments** - both external boundaries and internal walls
4. **Locate camera positions** - measure from walls/corners
5. **Identify obstacles** - pillars, tables, furniture, equipment
6. **Mark doors and entrances**

### Step 2: Create the Base Structure

```json
{
  "$schema": "./sitemap.schema.json",
  "dimensions": {
    "width": 18,
    "height": 28,
    "unit": "meters"
  },
  "walls": [],
  "cameras": [],
  "obstacles": [],
  "doors": []
}
```

### Step 3: Define Walls

Walls are line segments defined by start and end points. Trace the perimeter of each room.

```json
"walls": [
  {
    "id": "wall-north",
    "start": { "x": 0, "y": 0 },
    "end": { "x": 18, "y": 0 },
    "type": "external"
  },
  {
    "id": "wall-east",
    "start": { "x": 18, "y": 0 },
    "end": { "x": 18, "y": 28 },
    "type": "external"
  },
  {
    "id": "wall-divider",
    "start": { "x": 0, "y": 16 },
    "end": { "x": 18, "y": 16 },
    "type": "internal"
  }
]
```

**Wall Types:**
| Type | Description |
|------|-------------|
| `external` | Outer building walls |
| `internal` | Room dividers, partitions |
| `door` | Doorway openings (rendered differently) |

**Tips for Complex Shapes:**
- Curved walls: Approximate with multiple short line segments
- Angled walls: Use precise coordinates for start/end points
- Ensure walls connect (end of one = start of next) for closed shapes

### Step 4: Add Cameras

Each camera requires position, orientation, and optical properties.

```json
"cameras": [
  {
    "id": "camera1",
    "name": "HC3 (Auditorium)",
    "model": "AXIS P3245-LVE",
    "rtspUrl": "rtsp://localhost:8554/camera1",
    "webrtcUrl": "http://localhost:9101",
    "ipAddress": "192.168.1.101",
    "position": { "x": 16.22, "y": 27.7 },
    "azimuth": 197,
    "elevation": 35,
    "height": 1.68,
    "fieldOfView": 66,
    "resolution": { "width": 1920, "height": 1080 },
    "distortion": { "k1": 0, "k2": 0, "p1": 0, "p2": 0 },
    "color": "cyan-500"
  }
]
```

**Required Camera Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique ID matching pattern `camera1`, `camera2`, etc. |
| `name` | string | Human-readable display name |
| `position` | {x, y} | Floor position in meters |
| `azimuth` | number | Horizontal aim direction (0-360°) |
| `height` | number | Mounting height in meters |
| `fieldOfView` | number | Horizontal FOV in degrees |

**Optional Camera Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `elevation` | 45 | Vertical tilt (0=horizontal, 90=straight down) |
| `resolution` | - | Image dimensions `{width, height}` |
| `distortion` | - | Lens distortion coefficients `{k1, k2, p1, p2}` |
| `color` | - | Tailwind color class for visualization |

### Step 5: Add Obstacles

Obstacles represent physical objects that may block camera views or affect tracking.

#### Rectangle Obstacles (Tables, Desks)

```json
{
  "id": "table-1",
  "type": "rectangle",
  "label": "Registration Table",
  "category": "furniture",
  "position": { "x": 15, "y": 17 },
  "dimensions": { "width": 1.0, "height": 0.5 },
  "rotation": 0,
  "height": 1.0,
  "blocksTracking": false,
  "blocksView": true,
  "color": "#f5f5f4"
}
```

#### Circle Obstacles (Pillars, Columns)

```json
{
  "id": "pillar-1",
  "type": "circle",
  "label": "Pillar 1",
  "category": "structural",
  "position": { "x": 5.5, "y": 25 },
  "radius": 0.25,
  "height": 3.0,
  "blocksTracking": true,
  "blocksView": true,
  "color": "#e2e8f0"
}
```

#### Polygon Obstacles (Irregular Shapes)

```json
{
  "id": "stage",
  "type": "polygon",
  "label": "Stage",
  "category": "structural",
  "position": { "x": 9, "y": 5 },
  "vertices": [
    { "x": -3, "y": -2 },
    { "x": 3, "y": -2 },
    { "x": 4, "y": 2 },
    { "x": -4, "y": 2 }
  ],
  "height": 0.5,
  "blocksTracking": false,
  "blocksView": false
}
```

**Obstacle Categories:**
| Category | Typical Use |
|----------|-------------|
| `furniture` | Tables, desks, chairs |
| `structural` | Pillars, columns, walls |
| `equipment` | AV equipment, displays |
| `seating` | Bench rows, stadium seating |

**Blocking Properties:**
| Property | Effect |
|----------|--------|
| `blocksTracking: true` | Tracks cannot be created inside this obstacle |
| `blocksView: true` | Obstacle occludes camera field of view |

### Step 6: Add Doors

Doors define passageways between rooms.

```json
"doors": [
  {
    "id": "door-main",
    "label": "Main Entrance",
    "start": { "x": 16, "y": 16 },
    "end": { "x": 18, "y": 16 },
    "type": "internal"
  }
]
```

## Common Patterns

### Multi-Room Layout

For buildings with multiple connected rooms:

```json
{
  "dimensions": { "width": 18, "height": 28, "unit": "meters" },
  "walls": [
    // Room 1 (Lecture Hall) - y: 0 to 16
    { "id": "lh-back", "start": {"x": 0, "y": 0}, "end": {"x": 18, "y": 0}, "type": "external" },
    { "id": "lh-left", "start": {"x": 0, "y": 0}, "end": {"x": 0, "y": 16}, "type": "external" },
    { "id": "lh-right", "start": {"x": 18, "y": 0}, "end": {"x": 18, "y": 16}, "type": "external" },

    // Room 2 (Auditorium) - y: 16 to 28
    { "id": "aud-left", "start": {"x": 0, "y": 16}, "end": {"x": 0, "y": 28}, "type": "external" },
    { "id": "aud-bottom", "start": {"x": 0, "y": 28}, "end": {"x": 18, "y": 28}, "type": "external" },
    { "id": "aud-right", "start": {"x": 18, "y": 16}, "end": {"x": 18, "y": 28}, "type": "external" },

    // Dividing wall with door gap
    { "id": "divider-left", "start": {"x": 0, "y": 16}, "end": {"x": 14, "y": 16}, "type": "internal" }
  ],
  "doors": [
    { "id": "door-1", "start": {"x": 14, "y": 16}, "end": {"x": 18, "y": 16}, "type": "internal" }
  ]
}
```

### Slanted/Angled Walls

For non-rectangular rooms:

```json
"walls": [
  { "id": "wall-angled", "start": {"x": 2.5, "y": 16}, "end": {"x": 0, "y": 2}, "type": "external" }
]
```

### Curved Walls (Approximated)

Break curves into multiple segments:

```json
"walls": [
  { "id": "curve-1", "start": {"x": 0, "y": 2}, "end": {"x": 5, "y": 0.5}, "type": "external" },
  { "id": "curve-2", "start": {"x": 5, "y": 0.5}, "end": {"x": 9, "y": 0}, "type": "external" },
  { "id": "curve-3", "start": {"x": 9, "y": 0}, "end": {"x": 13, "y": 0.5}, "type": "external" },
  { "id": "curve-4", "start": {"x": 13, "y": 0.5}, "end": {"x": 18, "y": 2}, "type": "external" }
]
```

### Inclined Floor (Lecture Halls)

For tiered seating or sloped floors:

```json
{
  "floorPlane": {
    "type": "inclined",
    "origin": { "x": 9, "y": 0, "z": 0 },
    "gradient": {
      "direction": 180,
      "slope": 0.12
    }
  }
}
```

## Validation and Testing

### 1. Schema Validation

Use the JSON schema for validation:

```bash
# If you have ajv-cli installed
npx ajv validate -s shared/config/sitemap.schema.json -d frontend/public/sitemap-new.json
```

### 2. Visual Verification

Start the frontend to see the sitemap rendered:

```bash
cd frontend && pnpm dev
# Navigate to the sitemap view in the browser
```

### 3. Backend CLI Visualization

Use the ASCII sitemap tool to verify:

```bash
cd backend
pnpm cli:sitemap --sitemap ../frontend/public/sitemap-new.json
```

## Integration with Camera System

After creating the sitemap, additional configuration is needed:

### 1. Camera Emulator (`camera-emulator/src/config.ts`)

Add camera configurations:

```typescript
const allCameraConfigs = [
  buildCameraConfig('camera-HC3', 'view-HC3', 9101, 'camera1'),
  buildCameraConfig('camera-HC4', 'view-HC4', 9102, 'camera2'),
  // Add new cameras here
]
```

### 2. Backend Camera Registry (`backend/src/detection/camera-registry.ts`)

Add K/R/T calibration matrices for accurate ground-plane projection:

```typescript
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  camera1: {
    K: [[1480, 0, 0], [0, 1480, 0], [0, 0, 1]],
    R: [[...], [...], [...]],
    T: [x, y, z],
    center: [960, 540],
    scale: 1,
  },
  // Add calibration for each camera
}
```

### 3. Detection Files

Generate detection files for each camera view:

```bash
python scripts/preprocess-video.py \
  shared/cameras/view-CAMERA_NAME.mp4 \
  --output shared/cameras/view-CAMERA_NAME.detections.json.gz
```

## Troubleshooting

### Walls Not Connecting

Ensure wall segments share endpoints:
```json
// Bad - gap between walls
{ "start": {"x": 0, "y": 0}, "end": {"x": 10, "y": 0} },
{ "start": {"x": 10.1, "y": 0}, "end": {"x": 18, "y": 0} }

// Good - walls connect
{ "start": {"x": 0, "y": 0}, "end": {"x": 10, "y": 0} },
{ "start": {"x": 10, "y": 0}, "end": {"x": 18, "y": 0} }
```

### Camera FOV Appears Wrong

Check azimuth direction:
- 0° points toward +Y (appears down on screen due to Y-flip)
- Verify camera is pointing in the expected direction

### Obstacles Not Visible

Ensure required properties are set:
- Rectangles need `position` and `dimensions`
- Circles need `position` and `radius`
- Check `blocksView` property

### Projections Inaccurate

Camera calibration (K/R/T matrices) requires ground truth annotations. See `tech-logs/krt-calibration-projection.md` for calibration procedures.

## Reference: Complete Example

See the full working example at:
- `frontend/public/sitemap-rectangular-room.json`

## Related Documentation

- `tech-logs/krt-calibration-projection.md` - Camera calibration and projection math
- `tech-logs/advanced-tracking-pipeline.md` - Tracking algorithm details
- `shared/config/sitemap.schema.json` - Full JSON schema with all properties

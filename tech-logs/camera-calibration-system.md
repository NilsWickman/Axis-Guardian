# Camera Calibration System

Technical documentation for the camera calibration sweep and projection system.

## Overview

The calibration system optimizes camera intrinsic/extrinsic parameters by matching detected person positions to known ground truth locations. It uses a three-phase grid search to find the best configuration.

## Calibration Pipeline

### Phase 1: Coarse Grid Search
Sweeps all parameters with large steps to find approximate solution:
- Position X/Y: room dimensions with 2m steps
- Azimuth: 0-360° with 15° steps
- Elevation: 10-80° with 10° steps
- Height: 2-8m with 1m steps
- FOV: 50-120° with 10° steps

### Phase 2: Fine Grid Search
Refines around best coarse result with smaller steps:
- Position: ±2m with 0.5m steps
- Azimuth: ±10° with 1° steps
- Elevation: ±10° with 0.5° steps
- Height: ±1m with 0.1m steps
- FOV: ±10° with 1° steps

### Phase 3: Distortion Optimization (optional)
Searches for lens distortion coefficients using Brown-Conrady model.

## CLI Usage

```bash
pnpm cli:calibrate \
  --file <detection-file.json.gz> \
  --ground-truth "x1,y1;x2,y2" \
  --samples 30

# With fixed position (only sweep other parameters)
pnpm cli:calibrate \
  --file <detection-file.json.gz> \
  --ground-truth "15.5,1;15,1" \
  --position "16,9" \
  --samples 30

# With room constraints (camera must be on perimeter, pointing inward)
pnpm cli:calibrate \
  --file <detection-file.json.gz> \
  --ground-truth "15.5,1;15,1" \
  --room "18,12" \
  --room-margin 5 \
  --samples 30
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--file` | Path to detection file (.json or .json.gz) |
| `--ground-truth` | Ground truth positions as "x1,y1;x2,y2" |
| `--samples` | Number of frames to sample (default: 20) |
| `--position` | Fix camera position, only sweep other params |
| `--room` | Room dimensions as "width,height" for constraint validation |
| `--room-margin` | Margin from room edge for camera position (default: 0) |
| `--output` | Output file for results (default: calibration-result.json) |

## Ground Truth Selection

Ground truth positions should be:
1. Known, fixed positions where people stand during video
2. Visible in most sampled frames
3. Distributed across the camera's field of view

Example: Two people standing at positions (15.5, 1) and (15, 1) meters.

## Constraint-Aware Search

The `--room` option enables geometric constraints:

1. **Perimeter Position**: Camera must be within `--room-margin` meters of room edge
2. **Inward Pointing**: Camera azimuth must point toward room interior

This eliminates physically impossible configurations (e.g., camera in middle of room, or camera on wall pointing outward).

## X-Axis Flip Fix (2025-12-06)

### Problem
Detections appearing on the right side of the video were projected to the left side of the sitemap (and vice versa).

### Root Cause
Mismatch between declared azimuth convention and implementation:

1. **Declared convention**: Azimuth 0° = North (+Y), 90° = East (+X), clockwise
2. **`rotateAroundZ()`**: Uses counter-clockwise rotation matrix
3. **Line 141** had negation: `degToRad(-azimuthDeg)`

The negation was intended to convert clockwise to counter-clockwise, but combined with the coordinate system transformation, it caused X-axis inversion.

### Fix
Removed negation in `ground-plane.ts:141`:

```typescript
// Before:
const azimuthRad = degToRad(-azimuthDeg)

// After:
const azimuthRad = degToRad(azimuthDeg)
```

### Verification
- All 38 projection tests pass
- Calibration produces correct results
- Detections now appear on correct side of sitemap

## Projection Math

### Coordinate Systems
- **Image**: Origin at top-left, X-right, Y-down (pixels)
- **Camera**: Origin at camera, X-right, Y-down, Z-forward
- **World**: Origin at sitemap origin, X-right (East), Y-up (North), Z-up

### Ray Casting Algorithm

1. Convert image pixel to normalized camera coordinates
2. Create ray in camera space pointing through the pixel
3. Apply elevation rotation (pitch around X-axis)
4. Transform from camera to world coordinates
5. Apply azimuth rotation (yaw around Z-axis)
6. Intersect ray with ground plane (z=0)

### Key Functions

```typescript
// Create ray from normalized image coordinates
function createCameraRay(normalizedX: number, normalizedY: number): Point3D

// Transform ray from camera space to world space
function transformRayToWorld(
  rayCamera: Point3D,
  azimuthDeg: number,
  elevationDeg: number
): Point3D

// Find intersection with ground plane
function intersectGroundPlane(origin: Point3D, direction: Point3D): number | null

// Main projection function
function projectToGround(
  imagePoint: Point2D,
  camera: CameraParams,
  image: ImageParams
): ProjectionResult
```

## Calibration Results

### HC3 Camera (Auditorium)
```json
{
  "position": { "x": 16, "y": 9 },
  "azimuth": 192,
  "elevation": 23.5,
  "height": 4.7,
  "fieldOfView": 85
}
```

Error statistics:
- Mean error: 0.225m (0.113m per person)
- Valid projection rate: 100%

## File Locations

| File | Purpose |
|------|---------|
| `tracking-service/src/calibration/calibrate-camera.ts` | CLI calibration tool |
| `tracking-service/src/calibration/types.ts` | Type definitions |
| `tracking-service/src/projection/ground-plane.ts` | Projection math |
| `shared/config/sitemap-rectangular-room.json` | Camera configuration |
| `tracking-service/calibration-result.json` | Calibration output |

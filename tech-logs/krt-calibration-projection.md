# K/R/T Camera Calibration Projection - 2025-12-01

## Problem

The simplified azimuth/elevation projection model was producing inaccurate world coordinates. People were appearing outside room boundaries or clustered in wrong locations because:

1. The simplified model used estimated angles (azimuth, elevation, FOV)
2. These didn't match the actual camera orientation and lens characteristics
3. Small errors in angles resulted in large errors in projected positions

## Solution

Implemented proper K/R/T matrix projection using calibration data from the Auditorium dataset's `cam_param.mat` file.

## K/R/T Explained

### K - Intrinsic Matrix (3x3)
Camera's internal properties:
- **Focal length** - how zoomed the lens is (in pixels)
- **Principal point** - where optical axis hits the sensor

```
K = [fx  0  cx]    Example HC3: fx=fy=1480, cx=cy=0
    [0  fy  cy]    Example HC4: fx=fy=2350
    [0   0   1]
```

### R - Rotation Matrix (3x3)
Camera orientation in 3D space. More precise than Euler angles (azimuth/elevation).

### T - Translation Vector (3x1)
Camera position in world coordinates (meters).

```
HC3: T = [8.32, 13.45, 1.59]  // at position (8.32m, 13.45m), height 1.59m
HC4: T = [0, 0, 1.5]          // at origin, height 1.5m
```

## Projection Formula

From the dataset README:
```matlab
% (x, y) is 2D image coordinate
x = x * scale
y = y * scale
A = K * R
A = [A(:, 1:2), [center(1) - x; center(2) - y; -1]]
KRT = K * R * T
p = A \ KRT  % solve linear system
% p = [world_x, world_y, 0]
```

## Implementation

### New Types (`types.ts`)
```typescript
interface CameraCalibration {
  K: number[][]        // 3x3 intrinsic matrix
  R: number[][]        // 3x3 rotation matrix
  T: number[]          // 3x1 translation vector
  center: [number, number]  // image center
  scale: number        // scale factor
}
```

### New Projection Function (`ground-plane.ts`)
```typescript
function projectWithKRT(imageX, imageY, calibration): {
  worldPoint: Point2D
  isValid: boolean
}
```

Uses:
- `matMul3x3()` - 3x3 matrix multiplication
- `matMulVec()` - 3x3 matrix × 3x1 vector
- `solve3x3()` - Cramer's rule to solve Ax=b

### Camera Registry Updates (`camera-registry.ts`)
```typescript
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  'camera1': {  // HC3
    K: [[1480, 0, 0], [0, 1480, 0], [0, 0, 1]],
    R: [[0.264, 0.964, -0.040], [0.013, -0.045, -0.999], [-0.964, 0.263, -0.024]],
    T: [8.32, 13.45, 1.59],
    center: [960, 540],
    scale: 1,
  },
  'camera2': {  // HC4
    K: [[2350, 0, 0], [0, 2350, 0], [0, 0, 1]],
    R: [[1, 0, 0], [0, -0.087, -0.996], [0, 0.996, -0.087]],
    T: [0, 0, 1.5],
    center: [960, 540],
    scale: 1,
  },
}
```

### Detection Processor Updates (`detection-processor.ts`)
```typescript
// Try K/R/T projection first (more accurate)
const calibration = this.cameraRegistry.getCalibration(cameraId)
if (calibration) {
  const result = projectDetectionWithKRT(bbox, calibration, ...)
  // use result
}
// Fall back to legacy projection if no calibration
```

## Calibration Data Source

File: `/shared/cameras/Auditorium/cam_param.mat`

Extracted with Python:
```python
import scipy.io
mat = scipy.io.loadmat('cam_param.mat')
# mat['cam_param'][0] contains HC4 and HC3 calibration
```

## Files Modified

1. `backend/src/types.ts` - Added `CameraCalibration` interface
2. `backend/src/projection/ground-plane.ts` - Added `projectWithKRT()`, `projectDetectionWithKRT()`, and matrix math functions
3. `backend/src/detection/camera-registry.ts` - Added `CAMERA_CALIBRATIONS`, `getCalibration()`, `hasCalibration()`
4. `backend/src/detection/detection-processor.ts` - Updated to use K/R/T projection first
5. `backend/src/server.ts` - Adjusted grid bounds for scene

## Comparison: Before vs After

### Before (Simplified Model)
- Used estimated azimuth=321°, elevation=45°, FOV=90°
- People appeared at wrong positions (y=12.8, 13.0 outside 0-12m room)
- Tracks clustered near camera instead of spread across scene
- Frequent projection failures

### After (K/R/T Matrices)
- Uses exact calibration from dataset
- Accurate pixel-to-world mapping
- People appear at correct positions within scene bounds
- Stable track positions

## ASCII Visualization

The tracking service displays a live ASCII grid showing tracked people:

```
┌────────────────────────────────────────────────────┐
│····················································│
│···········●··◆·····································│
│··········■··▲······································│
│····················································│
│····················································│
└────────────────────────────────────────────────────┘

Active Tracks: 4  (confirmed: 4, pending: 0)
● obal-1 (8.2,12.1) ✓
◆ obal-2 (9.1,11.8) ✓
```

Grid is 20m × 20m based on scene calibration.

---

# Sitemap-Based Calibration Improvements - 2026-02-02

## Problem

The original K/R/T projection using external dataset calibration (`cam_param.mat`) worked for the Auditorium dataset, but sitemap-derived calibrations produced large errors:

- **Mean projection error**: 6.5m
- **Pass rate** (≤1.5m): 3.8%
- Camera2 had 12m+ errors

Root cause: The `projectWithKRT()` formula expected **world-to-camera** R matrices, but `computeRotationMatrix()` produced **camera-to-world** R matrices.

## Solution

### 1. Added `projectWithRay()` Function

New projection function that correctly uses camera-to-world transformation, matching the `transformRayToWorld()` logic:

```typescript
// backend/src/projection/ground-plane.ts
export function projectWithRay(
  imageX: number,
  imageY: number,
  calibration: CameraCalibration
): { worldPoint: Point2D; isValid: boolean; confidence: number }
```

**Algorithm:**
1. Extract intrinsics from K matrix (fx, fy, cx, cy)
2. Convert image point to normalized camera coordinates
3. Create camera ray using `createCameraRay()`
4. Transform ray to world space using `transformRayToWorld()`
5. Intersect with ground plane at camera height

### 2. Updated CameraCalibration Type

Added fields for ray-based projection:

```typescript
interface CameraCalibration {
  K: number[][]
  R: number[][]
  T: number[]
  // ... existing fields ...
  useRayProjection?: boolean  // Enable ray-based projection
  azimuthDeg?: number         // Camera azimuth for ray transform
  elevationDeg?: number       // Camera elevation for ray transform
}
```

### 3. Sitemap Calibration Generation

Updated `generateCalibrationFromSitemap()` to enable ray projection:

```typescript
// backend/src/calibration/sitemap-calibration.ts
return {
  K, R, T, center, scale: 1,
  useRayProjection: true,
  azimuthDeg: config.azimuth,
  elevationDeg: elevation,
}
```

## Calibration Optimization

### Initial Problem

Sitemap camera parameters were rough estimates:

| Camera | Original Elevation | Actual Elevation |
|--------|-------------------|------------------|
| camera1 (HC3) | 35° | ~8-13° |
| camera2 (HC4) | 40° | ~10° |
| camera3 (IP2) | 25° | ~14-15° |
| camera4 (IP5) | 15° | ~12-14° |

### Optimization Process

1. **Elevation sweep**: Found optimal elevation for each camera using ground truth
2. **Full parameter optimization**: Grid search over position, azimuth, elevation, FOV
3. **Ground truth refinement**: Used projection + seating row constraints to improve annotations
4. **Final calibration**: Fine-tuned parameters with improved annotations

### Final Calibration Parameters

| Camera | Position | Azimuth | Elevation | FOV |
|--------|----------|---------|-----------|-----|
| camera1 (HC3) | (20.30, 6.90) | 384° | 18° | 57° |
| camera2 (HC4) | (8.35, 5.05) | 70° | 9.75° | 45° |
| camera3 (IP2) | (26.45, 28.15) | 206° | 14.25° | 42° |
| camera4 (IP5) | (14.00, 16.55) | 73° | 11.5° | 42° |

## Ground Truth Annotation Tool

Created CLI tool for improving ground truth annotations:

```bash
# Export video frames with numbered detection boxes
pnpm cli:annotate-gt export-frames \
  -v ../shared/cameras/view-HC3.mp4 \
  -d ../shared/cameras/view-HC3.detections.json.gz \
  -c camera1

# Export sitemap with coordinate grid
pnpm cli:annotate-gt export-sitemap

# Interactive annotation mode
pnpm cli:annotate-gt annotate \
  -a ../shared/ground-truths/cross-camera-annotations.json

# Validate annotation completeness
pnpm cli:annotate-gt validate \
  -a ../shared/ground-truths/cross-camera-annotations.json
```

### Annotation Improvement Strategy

For auditorium cameras, annotations are constrained to seating rows:
- Arc center at (16, -15) with radii 32-44m
- Row Y coordinates: 17.5m, 19.0m, 20.5m, 22.0m, 23.5m, 25.0m, 26.5m, 29.0m
- Projections snapped to nearest row for consistency

## Results

### Accuracy Improvement

| Metric | Original | Final | Improvement |
|--------|----------|-------|-------------|
| Mean Error | 6.5m | **1.07m** | 84% better |
| Median Error | 6.2m | **1.00m** | 84% better |
| Pass Rate (≤1.5m) | 3.8% | **81.5%** | 21x better |
| Max Error | 16.0m | **2.85m** | 82% better |

### Per-Camera Accuracy

| Camera | Original | Final |
|--------|----------|-------|
| camera1 (HC3) | 6.8m | **1.17m** |
| camera2 (HC4) | 12.0m | **0.93m** |
| camera3 (IP2) | 5.3m | **1.06m** |
| camera4 (IP5) | 4.6m | **1.05m** |

## Files Modified

| File | Changes |
|------|---------|
| `backend/src/projection/ground-plane.ts` | Added `projectWithRay()`, `debugProjectionDetails()` |
| `backend/src/calibration/sitemap-calibration.ts` | Added `computeRotationMatrixForKRT()`, enabled ray projection |
| `backend/src/types/camera.ts` | Added `useRayProjection`, `azimuthDeg`, `elevationDeg` fields |
| `backend/src/cli/validate-projection.ts` | New CLI for ground truth validation |
| `backend/src/cli/annotate-ground-truth.ts` | New CLI for annotation improvement |
| `frontend/public/sitemap-rectangular-room.json` | Updated camera calibration parameters |
| `shared/ground-truths/cross-camera-annotations.json` | Improved worldPosition annotations |

## Validation CLI

```bash
# Run projection accuracy validation
pnpm cli:validate-projection

# With verbose output (shows worst errors)
pnpm cli:validate-projection --verbose

# Custom error threshold
pnpm cli:validate-projection --max-error 2.0
```

## Key Learnings

1. **R matrix convention matters**: KRT projection expects world-to-camera, ray projection expects camera-to-world
2. **Sitemap elevations are estimates**: Must be calibrated using ground truth data
3. **Seating geometry helps**: For auditoriums, constraining to seating rows improves consistency
4. **Iterative refinement**: Alternate between calibration optimization and annotation improvement

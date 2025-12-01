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

1. `tracking-service/src/types.ts` - Added `CameraCalibration` interface
2. `tracking-service/src/projection/ground-plane.ts` - Added `projectWithKRT()`, `projectDetectionWithKRT()`, and matrix math functions
3. `tracking-service/src/detection/camera-registry.ts` - Added `CAMERA_CALIBRATIONS`, `getCalibration()`, `hasCalibration()`
4. `tracking-service/src/detection/detection-processor.ts` - Updated to use K/R/T projection first
5. `tracking-service/src/server.ts` - Adjusted grid bounds for scene

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

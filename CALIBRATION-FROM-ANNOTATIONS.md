# Deriving Sitemap and Camera Calibration from Annotations

This document outlines a plan to reverse-engineer the complete sitemap (room layout, camera positions, FOVs, angles) and K/R/T calibration matrices from ground truth annotation data.

## Overview

**Goal:** Replace manually-specified camera parameters and room layout with values derived automatically from annotated correspondences between image bounding boxes and ground positions.

**Input:** Annotations linking:
- Bounding boxes in camera views (normalized pixel coordinates)
- Ground positions on a reference coordinate system (meters)
- Cross-camera links (same person seen by multiple cameras)

**Output:**
- Room dimensions and coordinate system
- Per-camera: position (x, y, z), azimuth, elevation, FOV
- Per-camera: K, R, T matrices
- Obstacle positions (tables, pillars) if annotated

---

## Phase 1: Annotation Collection

### 1.1 Reference Coordinate System Bootstrap

The chicken-and-egg problem: you need a coordinate system to annotate positions, but want to derive the coordinate system from annotations.

**Solution: Two-stage annotation**

**Stage A - Anchor Points:**
1. Identify 4+ fixed reference points visible in video (floor markers, wall corners, furniture corners)
2. Measure their real-world distances with a tape measure
3. These become your coordinate system anchors

**Stage B - Person Annotations:**
1. Use anchor points to establish a temporary grid
2. Annotate person ground positions relative to this grid
3. Link detections across cameras for the same person/timestamp

### 1.2 Required Annotation Data Structure

```typescript
interface CalibrationAnnotation {
  id: string;

  // Ground truth position (will be refined)
  groundPosition: { x: number; y: number };

  // Linked detections from cameras
  linkedDetections: Array<{
    cameraId: string;
    frameNumber: number;
    timestamp: number;
    // Bounding box (normalized 0-1)
    bbox: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
    // Foot position estimate (bottom-center of bbox)
    footPixel?: { x: number; y: number };
  }>;

  // Confidence in annotation accuracy
  confidence: 'certain' | 'approximate' | 'uncertain';

  // Optional: is this an anchor point with measured position?
  isAnchorPoint?: boolean;
}
```

### 1.3 Annotation Requirements

| Requirement | Minimum | Recommended | Purpose |
|-------------|---------|-------------|---------|
| Anchor points | 4 | 8+ | Establish coordinate system |
| Annotations per camera | 20 | 50+ | Camera parameter estimation |
| Cross-camera pairs | 10 | 30+ | Cross-camera alignment |
| Spatial coverage | 60% of FOV | 90% of FOV | Reduce extrapolation error |
| Temporal spread | 5 frames | Full video | Capture different positions |

---

## Phase 2: Room Layout Derivation

### 2.1 Coordinate System from Anchors

With 4+ anchor points with known real-world positions:

```
Anchor points: A1(0,0), A2(18,0), A3(18,12), A4(0,12)
               ↑ measured with tape measure
```

This establishes:
- Origin point
- X-axis direction and scale
- Y-axis direction and scale
- Room dimensions

### 2.2 Room Boundary Detection

**From annotations:**
- Find convex hull of all annotated ground positions
- Expand by margin (people don't walk against walls)
- This gives approximate room boundaries

**From video (optional enhancement):**
- Detect floor/wall boundaries using edge detection
- Project to ground plane using initial camera estimates
- Refine room dimensions

### 2.3 Obstacle Detection

**Tables (blocking lower body):**
1. Find annotations where bbox aspect ratio is unusually wide (seated/occluded)
2. Cluster these positions to find table locations
3. Estimate table dimensions from occlusion patterns

**Pillars (blocking entire view):**
1. Identify "dead zones" where no detections ever appear
2. Cross-reference with camera views to triangulate
3. Requires explicit annotation or gap analysis

---

## Phase 3: Camera Intrinsics Estimation

### 3.1 Focal Length / FOV Estimation

For each camera independently:

**Method: Vanishing Point Analysis**
1. Detect parallel lines in the scene (floor tiles, walls)
2. Find vanishing points
3. Derive focal length from vanishing point positions

**Method: Known Object Size**
1. If any objects of known size are visible (doors = 2m, etc.)
2. Measure pixel size at different distances
3. Derive focal length from size-distance relationship

**Method: Bundle Adjustment (preferred)**
1. Use all correspondences simultaneously
2. Include focal length as optimization variable
3. Minimize reprojection error

### 3.2 Principal Point

Usually assumed to be image center (width/2, height/2). Can be refined during optimization if needed.

### 3.3 Lens Distortion

**If significant barrel/pincushion distortion:**
1. Detect straight lines in scene
2. Measure deviation from straightness
3. Fit Brown-Conrady distortion model (k1, k2, p1, p2)

**Simplified approach:**
Start with zero distortion, add if reprojection errors show systematic radial patterns.

---

## Phase 4: Camera Extrinsics Estimation

### 4.1 Initial Estimate via PnP

For each camera with N ≥ 6 correspondences:

**Perspective-n-Point (PnP) Problem:**
```
Given:
  - 2D image points: [(u1,v1), (u2,v2), ..., (un,vn)]
  - 3D world points: [(X1,Y1,0), (X2,Y2,0), ..., (Xn,Yn,0)]
  - Camera intrinsics K

Find:
  - Rotation matrix R (3x3)
  - Translation vector T (3x1)
```

**Algorithm:** Use EPnP or iterative PnP (OpenCV: `solvePnP`)

**Output per camera:**
- Position: T gives camera position in world coordinates
- Orientation: R gives rotation, decompose to azimuth/elevation

### 4.2 Extracting Interpretable Parameters

From R matrix, extract Euler angles:
```typescript
// R = Rz(azimuth) * Rx(elevation) * Ry(roll)
const elevation = Math.asin(-R[2][0]);
const azimuth = Math.atan2(R[1][0], R[0][0]);
const roll = Math.atan2(R[2][1], R[2][2]);
```

From T vector:
```typescript
// Camera position in world coordinates
const cameraPosition = {
  x: -R.transpose() * T[0],
  y: -R.transpose() * T[1],
  z: -R.transpose() * T[2]  // height
};
```

### 4.3 Cross-Camera Consistency

Use cross-camera annotation links to enforce consistency:
1. Same person at same timestamp → same world position
2. Add constraint: `project(cam1, bbox1) ≈ project(cam2, bbox2)`
3. Joint optimization across all cameras

---

## Phase 5: Bundle Adjustment (Refinement)

### 5.1 Problem Formulation

**Variables to optimize:**
```typescript
interface OptimizationVariables {
  // Per camera (C cameras)
  cameras: Array<{
    fx: number;           // focal length x
    fy: number;           // focal length y
    cx: number;           // principal point x
    cy: number;           // principal point y
    position: [x, y, z];  // 3 DOF
    rotation: [rx, ry, rz]; // 3 DOF (or quaternion)
    distortion?: [k1, k2, p1, p2]; // optional
  }>;

  // Ground positions (N annotations)
  // Can be fixed (from annotations) or variable (to refine)
  groundPoints: Array<{ x: number; y: number }>;
}
```

**Total variables:** ~10-14 per camera + 2 per ground point

### 5.2 Cost Function

```typescript
function computeCost(variables: OptimizationVariables): number {
  let totalError = 0;

  for (const annotation of annotations) {
    const groundPos = variables.groundPoints[annotation.id];

    for (const detection of annotation.linkedDetections) {
      const camera = variables.cameras[detection.cameraId];

      // Project ground point to image
      const projected = projectToImage(groundPos, camera);

      // Compare to actual bbox foot position
      const observed = getBBoxFootPosition(detection.bbox);

      // Squared reprojection error
      const dx = projected.x - observed.x;
      const dy = projected.y - observed.y;
      totalError += dx*dx + dy*dy;
    }
  }

  return totalError;
}
```

### 5.3 Optimization Algorithm

**Levenberg-Marquardt** (recommended):
- Robust to local minima
- Handles large sparse Jacobians efficiently
- Libraries: Ceres Solver (C++), scipy.optimize.least_squares (Python)

**Gauss-Newton:**
- Faster convergence near minimum
- Less robust to poor initialization

### 5.4 Regularization

Add penalty terms to prevent degenerate solutions:

```typescript
// Prevent cameras from moving too far from initial estimates
const positionPenalty = lambda1 * sum(
  (cam.position - initialPosition)^2
);

// Prevent extreme focal lengths
const focalPenalty = lambda2 * sum(
  (cam.fx - expectedFocalLength)^2
);

// Enforce camera height constraints (if known from installation)
const heightPenalty = lambda3 * sum(
  (cam.position.z - knownHeight)^2
);
```

---

## Phase 6: Output Generation

### 6.1 Sitemap JSON Generation

```typescript
interface GeneratedSitemap {
  dimensions: {
    width: number;   // derived from anchor points
    height: number;
    unit: 'meters';
  };

  cameras: Array<{
    id: string;
    position: { x: number; y: number };
    height: number;
    azimuth: number;      // degrees, 0=North
    elevation: number;    // degrees, positive=down
    fieldOfView: number;  // degrees, horizontal

    // Full calibration matrices
    calibration: {
      K: number[][];  // 3x3 intrinsic matrix
      R: number[][];  // 3x3 rotation matrix
      T: number[];    // 3x1 translation vector
      distortion?: { k1: number; k2: number; p1: number; p2: number };
    };
  }>;

  obstacles: Array<{
    id: string;
    type: 'circle' | 'rectangle';
    position: { x: number; y: number };
    // dimensions...
  }>;

  // Metadata
  derivedFrom: {
    annotationCount: number;
    averageReprojectionError: number;
    calibrationDate: string;
  };
}
```

### 6.2 Validation Metrics

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Mean reprojection error | < 5px | 5-15px | > 15px |
| Max reprojection error | < 20px | 20-50px | > 50px |
| Cross-camera consistency | < 0.3m | 0.3-0.5m | > 0.5m |
| Ground truth match rate | > 95% | 85-95% | < 85% |

---

## Implementation Roadmap

### Step 1: Annotation Tool Enhancement
- [ ] Add anchor point annotation mode
- [ ] Add real-world distance input for anchors
- [ ] Export annotations in calibration format
- [ ] Visualize annotation coverage per camera

### Step 2: Initial Estimation Pipeline
- [ ] Implement coordinate system from anchors
- [ ] Implement per-camera PnP solver
- [ ] Extract azimuth/elevation/position from R/T
- [ ] Validate against current manual calibration

### Step 3: Bundle Adjustment
- [ ] Implement cost function
- [ ] Integrate optimization library (recommend: `levenberg-marquardt` npm or Python scipy)
- [ ] Add regularization terms
- [ ] Implement convergence monitoring

### Step 4: Obstacle Detection
- [ ] Implement seated-person clustering for tables
- [ ] Implement dead-zone analysis for pillars
- [ ] Manual verification/adjustment UI

### Step 5: Integration
- [ ] Generate sitemap JSON from optimized parameters
- [ ] Replace manual sitemap with derived version
- [ ] A/B comparison of tracking accuracy
- [ ] Fallback to manual if derivation fails

---

## Technical Considerations

### Scale Ambiguity

Without absolute distance measurements (anchor points), the system can only determine relative positions. The entire coordinate system could be scaled by any factor.

**Solution:** Require at least one known distance (e.g., room width, distance between two markers).

### Height Ambiguity

Camera height and focal length are partially coupled. A camera at 3m with 60° FOV produces similar projections to a camera at 2.5m with ~50° FOV for certain configurations.

**Solutions:**
1. Fix camera heights from installation specs
2. Use known object heights (door frames, people) as constraints
3. Use multiple viewing angles to break ambiguity

### Local Minima

Bundle adjustment can converge to local minima, especially with poor initialization.

**Solutions:**
1. Use PnP for good initial estimates
2. Run optimization from multiple starting points
3. Use robust cost functions (Huber loss) to handle outliers

### Degenerate Configurations

Certain annotation patterns provide weak constraints:
- All points in a line → position along line is ambiguous
- All points at similar distances → focal length poorly constrained
- No cross-camera links → cameras not aligned to common frame

**Solution:** Validate annotation coverage before running optimization.

---

## Dependencies

**Python (recommended for prototyping):**
```
numpy
scipy
opencv-python  # for solvePnP
```

**TypeScript/Node.js (for integration):**
```
ml-levenberg-marquardt  # optimization
mathjs                  # matrix operations
```

---

## References

1. Hartley & Zisserman, "Multiple View Geometry in Computer Vision"
2. OpenCV Camera Calibration documentation
3. Ceres Solver documentation (bundle adjustment)
4. EPnP: Efficient Perspective-n-Point Camera Pose Estimation

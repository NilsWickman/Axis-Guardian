# SfM Site Map Generator - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SfM Site Map Generator                       │
│                                                                   │
│  Input: Camera Images + Optional Heights                         │
│  Output: 2D Site Map (PNG, JSON) + 3D Point Cloud (PLY)         │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Architecture

```
┌──────────────┐
│ Camera Images│ (JPEG/PNG from 4 cameras)
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Feature Extraction  │ (SIFT/ORB/AKAZE)
│ - Detect keypoints  │
│ - Compute descriptors│
└──────┬──────────────┘
       │ features_list: [ImageFeatures × 4]
       ▼
┌─────────────────────┐
│ Feature Matching    │ (BFMatcher + Lowe's ratio test)
│ - Match across pairs│
│ - Filter by ratio   │
└──────┬──────────────┘
       │ match_results: [MatchResult × 6]
       ▼
┌─────────────────────┐
│ Pose Estimation     │ (Essential matrix + RANSAC)
│ - Compute E matrix  │
│ - Recover R, t      │
└──────┬──────────────┘
       │ camera_poses: [CameraPose × 6]
       ▼
┌─────────────────────┐
│ Triangulation       │ (Linear triangulation)
│ - Compute 3D points │
│ - Filter by quality │
└──────┬──────────────┘
       │ point_cloud: PointCloud (Nx3)
       ▼
┌─────────────────────┐
│ Ground Projection   │ (Plane fitting + projection)
│ - Fit ground plane  │
│ - Align to XY plane │
│ - Filter ground pts │
└──────┬──────────────┘
       │ points_2d: Nx2
       ▼
┌─────────────────────┐
│ Occupancy Grid      │ (2D grid creation)
│ - Create grid       │
│ - Mark occupied     │
└──────┬──────────────┘
       │ occupancy_grid: OccupancyGrid
       ▼
┌─────────────────────┐
│ Wall Extraction     │ (Edge detection + RANSAC)
│ - Detect edges      │
│ - Fit lines         │
│ - Merge segments    │
└──────┬──────────────┘
       │ walls: [WallSegment × N]
       ▼
┌─────────────────────┐
│ Rendering & Export  │ (Matplotlib + JSON)
│ - Render site map   │
│ - Export JSON       │
│ - Export PLY        │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Outputs:                              │
│ - sitemap.png  (visualization)        │
│ - sitemap.json (frontend data)        │
│ - pointcloud.ply (3D data)            │
└───────────────────────────────────────┘
```

## Module Structure

```
src/
├── vision/                    # Computer vision modules
│   ├── features.py           # Feature extraction (SIFT/ORB/AKAZE)
│   │   └── FeatureExtractor
│   ├── matching.py           # Feature matching
│   │   └── FeatureMatcher
│   └── pose_estimation.py    # Camera pose estimation
│       └── PoseEstimator
│
├── fusion/                    # 3D fusion and 2D projection
│   ├── point_cloud.py        # 3D point cloud processing
│   │   └── PointCloud
│   ├── ground_projection.py  # 3D → 2D projection
│   │   └── GroundPlaneProjector
│   ├── occupancy_grid.py     # 2D occupancy grid
│   │   └── OccupancyGrid
│   └── wall_extraction.py    # Wall boundary detection
│       └── WallExtractor
│
├── rendering/                 # Visualization and export
│   ├── renderer.py           # Matplotlib rendering
│   │   └── SiteMapRenderer
│   └── exporter.py           # JSON/PLY export
│
├── core/                      # Main reconstruction pipeline
│   └── reconstruction.py     # SfM orchestrator
│       └── SfMReconstructor
│
└── utils/                     # Utilities
    ├── config.py             # Configuration loading
    └── geometry.py           # Geometric utilities
```

## Data Flow

### 1. Feature Extraction

```python
ImageFeatures {
    keypoints: [(x, y, scale, orientation), ...]  # Nx keypoints
    descriptors: ndarray (N, 128)                 # SIFT descriptors
    image_shape: (height, width)
}
```

### 2. Feature Matching

```python
MatchResult {
    image1_idx: int              # First camera index
    image2_idx: int              # Second camera index
    matches: [DMatch, ...]       # OpenCV matches
    points1: ndarray (N, 2)      # Matched points in image 1
    points2: ndarray (N, 2)      # Matched points in image 2
    num_matches: int             # Number of matches
}
```

### 3. Camera Pose

```python
CameraPose {
    R: ndarray (3, 3)            # Rotation matrix
    t: ndarray (3, 1)            # Translation vector
    camera1_idx: int
    camera2_idx: int
    inliers: int                 # RANSAC inliers
}
```

### 4. Point Cloud

```python
PointCloud {
    points: ndarray (N, 3)       # 3D points (x, y, z)
    colors: ndarray (N, 3)       # RGB colors (optional)
    camera_id: str               # Source camera
}
```

### 5. Occupancy Grid

```python
OccupancyGrid {
    grid: ndarray (H, W)         # -1=unknown, 0=free, 1=occupied
    resolution: float            # Cell size in meters
    origin: ndarray (2,)         # Grid origin (x, y)
    width_m: float               # Width in meters
    height_m: float              # Height in meters
}
```

### 6. Wall Segment

```python
WallSegment {
    start: ndarray (2,)          # Start point (x, y) in meters
    end: ndarray (2,)            # End point (x, y) in meters
    confidence: float            # 0-1 confidence score
    supporting_points: int       # Number of supporting edge points
}
```

## Key Algorithms

### 1. Feature Matching (Lowe's Ratio Test)

```python
for (m, n) in knn_matches:
    if m.distance < 0.7 * n.distance:
        good_matches.append(m)
```

**Why**: Filters ambiguous matches (rejects if best match is not significantly better than second-best)

### 2. Essential Matrix Estimation

```python
E = findEssentialMat(points1, points2, K, RANSAC)
```

**Why**: Encodes epipolar constraint - relates corresponding points across views

### 3. Pose Recovery

```python
num_inliers, R, t, mask = recoverPose(E, points1, points2, K)
```

**Why**: Decomposes E into rotation R and translation t (up to scale)

### 4. Triangulation

```python
# For each matched point pair:
P1 = K @ [I | 0]              # Camera 1 projection matrix
P2 = K @ [R | t]              # Camera 2 projection matrix
X = triangulate(P1, P2, x1, x2)  # 3D point
```

**Why**: Computes 3D point from 2D correspondences using geometric intersection

### 5. RANSAC Line Fitting

```python
# Fit line to edge points:
for iteration in range(max_iterations):
    sample = random_sample(points, min_samples)
    model = fit_line(sample)
    inliers = count_inliers(model, points, threshold)
    if inliers > best_inliers:
        best_model = model
```

**Why**: Robustly fits lines to noisy edge points, rejects outliers

## Coordinate Systems

### 1. Camera Coordinate System

```
Camera 1 (Origin):
  X: right
  Y: down
  Z: forward (into scene)
```

### 2. World Coordinate System

```
After alignment:
  X: east (right)
  Y: north (forward)
  Z: up
```

### 3. Grid Coordinate System

```
2D Grid:
  X: columns (east)
  Y: rows (north)
  Origin: bottom-left corner
```

## Configuration Flow

```yaml
config/auditorium.yaml
  ↓
load_config()
  ↓
SiteMapConfig {
    name: str
    cameras: [CameraConfig]
    generation: GenerationConfig {
        feature_type: "sift"
        max_features: 8000
        ...
    }
}
  ↓
SfMReconstructor(config)
```

## Error Handling

```python
try:
    features = extractor.extract(image)
    if len(features.keypoints) < min_features:
        raise ValueError("Insufficient features")
except Exception as e:
    logger.error(f"Feature extraction failed: {e}")
    # Fallback or abort
```

**Key failure points**:
1. **Insufficient features**: Image too blurry/uniform
2. **No matches**: Cameras don't overlap
3. **Pose estimation failed**: Degenerate geometry
4. **Triangulation failed**: Insufficient parallax
5. **No walls detected**: Noisy occupancy grid

## Performance Optimization

### Bottlenecks

1. **Feature extraction**: ~5-10s per image (SIFT)
   - **Optimize**: Use ORB (10x faster) or reduce max_features

2. **Feature matching**: ~1-2s per pair
   - **Optimize**: Use approximate NN (FLANN)

3. **Occupancy grid**: ~2-3s
   - **Optimize**: Downsample point cloud, reduce grid resolution

### Memory Usage

- **Images**: 4 × 2MB = 8MB
- **Features**: 4 × 8000 × 128 × 4 bytes = 16MB
- **Point cloud**: 50k points × 3 × 8 bytes = 1.2MB
- **Occupancy grid**: 1000×1000 × 1 byte = 1MB

**Total**: ~30MB (low memory footprint)

## Future Enhancements

1. **Bundle Adjustment**: Joint optimization of all camera poses and 3D points
2. **Loop Closure**: Detect when cameras see the same area from different positions
3. **Dense Reconstruction**: Use depth maps for denser point clouds
4. **GPU Acceleration**: Parallelize feature extraction
5. **Incremental SfM**: Add cameras one at a time for scalability

## References

- [Multiple View Geometry](https://www.robots.ox.ac.uk/~vgg/hzbook/) - Hartley & Zisserman
- [OpenCV SfM](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html)
- [SIFT Paper](https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf) - Lowe 2004

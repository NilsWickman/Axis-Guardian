# Structure from Motion (SfM) Site Map Generator

**Automatic site map generation using multi-view geometry and feature matching**

## Overview

This system generates accurate 2D site maps from camera images using **Structure from Motion (SfM)**, a computer vision technique that reconstructs 3D geometry from overlapping 2D images. Unlike depth-based or GPS-based approaches, SfM automatically determines camera positions and scene geometry through feature matching.

## Key Advantages

- ✅ **No GPS required** - Camera positions computed from image features
- ✅ **Metric accuracy** - Scale derived from known camera heights
- ✅ **Multi-room support** - Naturally handles complex layouts
- ✅ **Robust** - Based on proven photogrammetry techniques (COLMAP)
- ✅ **Minimal input** - Only needs overlapping camera images

## How It Works

```
Camera Images → Feature Extraction → Feature Matching → Camera Pose Estimation
                                                              ↓
2D Site Map ← Wall Extraction ← Occupancy Grid ← 3D Point Cloud
```

### Pipeline Stages

1. **Feature Extraction**: Detect SIFT/ORB keypoints in each camera image
2. **Feature Matching**: Find corresponding points across overlapping views
3. **Pose Estimation**: Compute relative camera positions using epipolar geometry
4. **Triangulation**: Reconstruct 3D points from matched features
5. **Bundle Adjustment**: Refine camera poses and 3D points jointly
6. **Ground Projection**: Project 3D points to 2D floor plane
7. **Wall Extraction**: Detect wall boundaries using RANSAC line fitting

## Installation

### Prerequisites

**COLMAP** must be installed on your system:

```bash
# Ubuntu/Debian
sudo apt install colmap

# macOS
brew install colmap

# Or build from source: https://colmap.github.io/install.html
```

### Python Environment

```bash
cd simulation/sfm-sitemap-generator

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### 1. Prepare Camera Images

Place camera snapshot images in a directory:

```
config/
  auditorium/
    camera1.jpg
    camera2.jpg
    camera3.jpg
    camera4.jpg
```

### 2. Create Configuration

Create a YAML config file (`config/auditorium.yaml`):

```yaml
name: "Auditorium Site Map"
description: "Auto-generated from 4 cameras"

# Camera images directory
images_dir: "config/auditorium"

# Camera metadata (optional - helps with scaling)
cameras:
  - id: camera1
    image: "camera1.jpg"
    height_m: 1.68  # Mount height above ground
  - id: camera2
    image: "camera2.jpg"
    height_m: 1.67
  - id: camera3
    image: "camera3.jpg"
    height_m: 2.62
  - id: camera4
    image: "camera4.jpg"
    height_m: 1.84

# Generation parameters
generation:
  feature_type: "sift"  # or "orb", "akaze"
  max_features: 8000
  grid_resolution_m: 0.05  # 5cm grid cells
  min_wall_length_m: 0.5
  wall_detection_threshold: 0.7
  output_scale_px_per_m: 50  # 50 pixels per meter
```

### 3. Generate Site Map

```bash
# Run generation
python generate.py --config config/auditorium.yaml --output output/auditorium_sfm.png

# With debug visualization
python generate.py --config config/auditorium.yaml --output output/auditorium_sfm.png --debug

# Export 3D point cloud
python generate.py --config config/auditorium.yaml --output output/auditorium_sfm.png --export-ply
```

## Output

The generator produces:

- **Site map PNG** - 2D floor plan with walls and camera positions
- **Site map JSON** - Structured data (walls, cameras, metadata)
- **Point cloud PLY** (optional) - 3D reconstruction for debugging
- **Camera poses** (optional) - Estimated camera positions and orientations

## Architecture

```
src/
├── core/
│   ├── camera.py           # Camera models and intrinsics
│   ├── reconstruction.py   # SfM reconstruction pipeline
│   └── scale_estimation.py # Metric scale from camera heights
├── vision/
│   ├── features.py         # Feature extraction (SIFT/ORB)
│   ├── matching.py         # Feature matching across views
│   └── pose_estimation.py  # Camera pose computation
├── fusion/
│   ├── point_cloud.py      # 3D point cloud processing
│   ├── ground_projection.py # Project 3D → 2D floor plane
│   ├── occupancy_grid.py   # 2D grid from point cloud
│   └── wall_extraction.py  # Wall boundary detection
├── rendering/
│   ├── renderer.py         # 2D site map visualization
│   └── exporter.py         # Export to JSON/PNG/PLY
└── utils/
    ├── geometry.py         # Geometric utilities
    └── config.py           # Configuration loading
```

## Comparison with Other Approaches

| Feature | **SfM (This)** | Geometric GPS | Monocular Depth |
|---------|----------------|---------------|-----------------|
| Camera positioning | ✅ Automatic from features | ⚠️ Requires GPS | ❌ Assumes arbitrary positions |
| Indoor accuracy | ✅ 5-10cm | ❌ GPS unreliable indoors | ❌ Relative only |
| Multi-room layouts | ✅ Natural support | ⚠️ Limited | ❌ Single view |
| Manual input | ✅ None | ⚠️ GPS coordinates | ✅ None |
| Wall detection | ✅ From 3D geometry | ⚠️ Semantic segmentation | ❌ Depth gradients |
| Scale accuracy | ✅ Metric (from heights) | ✅ Metric (from GPS) | ❌ Relative |

## Technical Details

### Feature Matching

Uses robust feature descriptors (SIFT recommended for accuracy, ORB for speed):

- **SIFT**: Scale-invariant, rotation-invariant, most robust
- **ORB**: Faster, good for real-time applications
- **AKAZE**: Balance between speed and accuracy

### Epipolar Geometry

Computes relative camera poses using:

1. **Fundamental matrix** estimation (8-point algorithm + RANSAC)
2. **Essential matrix** decomposition → R (rotation) and t (translation)
3. **Triangulation** → 3D point positions
4. **Bundle adjustment** → joint optimization of all parameters

### Scale Recovery

Absolute metric scale is determined from:

- Known camera mount heights (primary method)
- Known object sizes (chairs, tables - if detected)
- Statistical priors on room dimensions

## Configuration Options

```yaml
generation:
  # Feature extraction
  feature_type: "sift"        # sift, orb, akaze
  max_features: 8000          # Features per image

  # Matching
  match_ratio_threshold: 0.7  # Lowe's ratio test
  min_matches: 50             # Minimum matches for pose estimation

  # Reconstruction
  ransac_threshold: 2.0       # RANSAC inlier threshold (pixels)
  min_triangulation_angle: 3  # Min angle for triangulation (degrees)

  # 2D projection
  ground_plane_tolerance: 0.5 # Height tolerance for ground (meters)
  grid_resolution_m: 0.05     # Grid cell size

  # Wall extraction
  min_wall_length_m: 0.5      # Minimum wall length
  wall_merge_threshold: 0.3   # Merge nearby walls (meters)
  wall_detection_threshold: 0.7

  # Output
  output_scale_px_per_m: 50   # Visualization scale
```

## Troubleshooting

### "Not enough feature matches"

- Use SIFT instead of ORB (more robust)
- Increase `max_features` to 10000+
- Ensure cameras have overlapping views
- Check image quality (blur, lighting)

### "Scale estimation failed"

- Verify camera heights are accurate
- Ensure at least 2 cameras have known heights
- Check that cameras see overlapping areas

### "Walls not detected"

- Lower `wall_detection_threshold` (try 0.5)
- Reduce `min_wall_length_m` (try 0.3)
- Increase `grid_resolution_m` for smoother occupancy

### "Camera poses diverge"

- Enable debug visualization to inspect matches
- Check for repetitive textures (confuse matching)
- Ensure sufficient baseline between cameras

## Development

```bash
# Run tests
pytest tests/

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Type checking
mypy src/

# Lint
ruff check src/
```

## References

- [COLMAP Documentation](https://colmap.github.io/)
- [Multiple View Geometry (Hartley & Zisserman)](https://www.robots.ox.ac.uk/~vgg/hzbook/)
- [OpenCV SfM Tutorial](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html)

## License

See project root LICENSE file.

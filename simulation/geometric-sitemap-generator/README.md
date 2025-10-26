# Geometric Site Map Generator

**Camera-first automatic spatial reconstruction** using multi-view geometry and semantic segmentation.

## Overview

This system generates accurate 2D site maps automatically from camera metadata and images, without requiring manual floorplan input or calibration. It leverages:

- Known camera extrinsics (GPS, mount height, pan/tilt/roll)
- Multi-view geometric reconstruction
- Semantic segmentation for scene understanding
- Bayesian fusion of multiple observations

## Architecture

```
Camera Metadata → Coordinate System → 3D Point Cloud → 2D Site Map
     ↓                    ↓                  ↓              ↓
  Extrinsics      World Transform      Occupancy Grid   Rendering
```

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

```bash
# Generate site map from camera configuration
python src/cli.py generate --config config/example_site.yaml --output output/sitemap.png

# Validate camera calibration
python src/cli.py validate --config config/example_site.yaml

# Export to different formats
python src/cli.py export --config config/example_site.yaml --format svg
```

## Configuration

See `config/example_site.yaml` for a complete configuration example.

```yaml
cameras:
  - id: camera1
    gps: [35.9940, -78.9018, 120.5]  # lat, lon, elevation (m)
    mount_height: 3.5  # meters above ground
    orientation:
      pan: 45.0    # degrees from north
      tilt: -15.0  # degrees from horizon
      roll: 0.0
    intrinsics:
      focal_length: 4.0  # mm
      sensor_size: [1/2.8, 1/2.8]  # inches
      resolution: [1920, 1080]
      fov: [92.0, 50.0]  # horizontal, vertical degrees
    image_path: "path/to/camera1.jpg"
```

## Key Features

- ✅ **Zero manual input** - No floorplan upload or wall drawing
- ✅ **Geometrically accurate** - Uses real camera calibration
- ✅ **Multi-view fusion** - Combines overlapping camera views
- ✅ **Progressive enhancement** - Works with 1-N cameras
- ✅ **Robust** - Handles various lighting and scene conditions

## Architecture

### Phase 1: Camera Calibration & Registration
- Establish world coordinate system from GPS
- Build camera projection matrices
- Compute ground plane homographies

### Phase 2: Ground Plane Extraction
- Map image pixels to ground coordinates
- Handle sloped terrain via plane fitting

### Phase 3: Feature-Based Spatial Mapping
- Semantic segmentation (walkable areas, walls, obstacles)
- Multi-view consistency checking
- Motion-based occupancy (optional)

### Phase 4: Boundary Detection
- Occlusion analysis between overlapping cameras
- Semantic boundary extraction
- Vanishing point analysis

### Phase 5: 3D → 2D Projection
- Occupancy grid construction
- Wall extraction via RANSAC
- Zone detection

### Phase 6: Multi-View Fusion
- Bayesian fusion of observations
- Confidence-weighted merging

## Module Structure

```
src/
├── core/
│   ├── camera.py           # Camera models and calibration
│   ├── coordinate_system.py  # World coordinate transforms
│   ├── ground_plane.py     # Ground plane extraction
│   └── projection.py       # Camera projection utilities
├── vision/
│   ├── segmentation.py     # Semantic segmentation
│   ├── feature_extraction.py  # Computer vision features
│   └── occlusion.py        # Multi-view occlusion analysis
├── fusion/
│   ├── occupancy_grid.py   # Occupancy grid representation
│   ├── bayesian_fusion.py  # Multi-view fusion
│   └── wall_extraction.py  # Boundary detection
├── rendering/
│   ├── renderer.py         # 2D map rendering
│   └── exporter.py         # Export to various formats
└── utils/
    ├── geometry.py         # Geometric utility functions
    └── validation.py       # Configuration validation
```

## Development

```bash
# Run tests
pytest tests/

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Type checking
mypy src/
```

## License

See project root LICENSE file.

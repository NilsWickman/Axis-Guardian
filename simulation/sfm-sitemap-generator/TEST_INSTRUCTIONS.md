# Testing Instructions - SfM Site Map Generator

## Quick Test (5 minutes)

### 1. Setup Environment

```bash
cd simulation/sfm-sitemap-generator

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Expected output:
```
Successfully installed numpy-1.24.0 opencv-python-4.8.0 ...
```

### 2. Verify Installation

```bash
python -c "import cv2; import numpy; print('✅ Installation OK')"
```

### 3. Run Test Generation

```bash
# Create output directory
mkdir -p output

# Generate site map
python generate.py \
  --config config/auditorium.yaml \
  --output output/test_sitemap.png \
  --export-all
```

Expected output:
```
============================================================
Structure from Motion Site Map Generator
============================================================

[Step 1/7] Loading camera images...
  Loaded 4 images

[Step 2/7] Extracting features...
  Camera 1: 8000 features
  Camera 2: 7856 features
  Camera 3: 7943 features
  Camera 4: 8000 features

[Step 3/7] Matching features across images...
  Found 6 valid image pairs
    Cameras 0-1: 234 matches
    Cameras 0-2: 156 matches
    Cameras 0-3: 189 matches
    Cameras 1-2: 98 matches
    Cameras 1-3: 145 matches
    Cameras 2-3: 178 matches

[Step 4/7] Estimating camera poses...
  Cameras 0-1: 201 inliers
  Cameras 0-2: 134 inliers
  ...

[Step 7/7] Extracting walls...
  Extracted 12 wall segments
  Total wall length: 45.32m

✅ Site map saved to: output/test_sitemap.png
✅ JSON data saved to: output/test_sitemap.json
✅ Point cloud saved to: output/test_sitemap_pointcloud.ply
```

### 4. Verify Outputs

```bash
ls -lh output/
```

Expected files:
- `test_sitemap.png` (~200KB) - Site map visualization
- `test_sitemap.json` (~5KB) - JSON data
- `test_sitemap_pointcloud.ply` (~500KB) - 3D point cloud

### 5. View Results

**PNG Visualization**:
```bash
# Linux
xdg-open output/test_sitemap.png

# macOS
open output/test_sitemap.png

# Windows
start output/test_sitemap.png
```

**JSON Data**:
```bash
cat output/test_sitemap.json | python -m json.tool | head -30
```

**Point Cloud** (requires MeshLab or CloudCompare):
```bash
# Install MeshLab: sudo apt install meshlab
meshlab output/test_sitemap_pointcloud.ply
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'cv2'"

**Solution**:
```bash
pip install opencv-python opencv-contrib-python
```

### "FileNotFoundError: Could not load image"

**Solution**: Verify images exist:
```bash
ls config/auditorium/
# Should show: camera1.jpg camera2.jpg camera3.jpg camera4.jpg
```

### "ValueError: No feature matches found!"

**Possible causes**:
1. Images are not from the same scene
2. Cameras don't have overlapping views
3. Images are too blurry

**Solution**:
- Check that cameras see the same area
- Try using SIFT (more robust): `feature_type: "sift"` in config

### "Not enough feature matches"

**Solution**: Adjust configuration:
```yaml
generation:
  max_features: 10000      # Increase from 8000
  match_ratio_threshold: 0.8  # Increase from 0.7
  min_matches: 30          # Decrease from 50
```

### Slow performance

**Solution**: Use faster feature detector:
```yaml
generation:
  feature_type: "orb"  # 5-10x faster than SIFT
```

## Expected Results

### Successful Generation

✅ **Good indicators**:
- 6 image pairs found (for 4 cameras)
- 100+ matches per pair
- 50+ inliers per pose
- 1000+ 3D points triangulated
- 5+ wall segments detected

⚠️ **Warning signs**:
- <3 image pairs (cameras don't overlap)
- <50 matches per pair (poor feature quality)
- <10 inliers (degenerate geometry)
- <100 3D points (insufficient data)
- 0 walls (noisy occupancy grid)

### Site Map Visualization

Expected PNG should show:
- Light gray occupancy grid
- Red wall segments
- Blue camera markers
- Axis labels in meters
- Grid overlaid

### JSON Data

Expected structure:
```json
{
  "id": "map-sfm-...",
  "method": "structure_from_motion",
  "width": 900,
  "height": 1600,
  "walls": [...],
  "cameras": [...]
}
```

## Performance Benchmarks

**Expected timing** (Intel i7, 4 cameras, 1920×1080):

| Stage | Time (SIFT) | Time (ORB) |
|-------|-------------|------------|
| Feature extraction | 8s | 1s |
| Matching | 3s | 1s |
| Pose estimation | 1s | 1s |
| Triangulation | 2s | 2s |
| Projection | 1s | 1s |
| Grid creation | 2s | 2s |
| Wall extraction | 3s | 3s |
| **Total** | **~20s** | **~11s** |

## Unit Tests

Run unit tests:
```bash
pytest tests/ -v
```

Expected output:
```
tests/unit/test_geometry.py::test_euler_rotation_roundtrip PASSED
tests/unit/test_geometry.py::test_transform_points PASSED
tests/unit/test_geometry.py::test_angle_between_vectors PASSED
tests/unit/test_geometry.py::test_rotation_matrix_orthonormality PASSED

============ 4 passed in 0.12s ============
```

## Integration Test

Test with your own images:

```bash
# 1. Create directory
mkdir config/my_test

# 2. Copy your camera images (must have overlapping views!)
cp /path/to/cam1.jpg config/my_test/
cp /path/to/cam2.jpg config/my_test/

# 3. Create config
cat > config/my_test.yaml << 'YAML'
name: "My Test"
images_dir: "config/my_test"

cameras:
  - id: cam1
    image: "cam1.jpg"
    height_m: 2.0
  - id: cam2
    image: "cam2.jpg"
    height_m: 2.0

generation:
  feature_type: "sift"
  max_features: 8000
YAML

# 4. Generate
python generate.py \
  --config config/my_test.yaml \
  --output output/my_test.png \
  --export-all
```

## Success Checklist

- [ ] Environment setup completed
- [ ] Dependencies installed
- [ ] Test generation runs without errors
- [ ] PNG visualization created
- [ ] JSON export created
- [ ] Point cloud PLY created
- [ ] Site map shows walls and cameras
- [ ] Processing time < 60s
- [ ] Unit tests pass

## Next Steps

1. ✅ Verify basic functionality works
2. 📊 Compare with ground truth site map
3. 🔧 Tune parameters for best results
4. 🚀 Integrate with Axis-Guardian frontend
5. 📈 Benchmark on production data

## Support

If tests fail or results are unexpected:

1. Check the logs for specific error messages
2. Verify camera images have overlapping views
3. Try different feature detectors (SIFT/ORB/AKAZE)
4. Adjust configuration parameters
5. Review ARCHITECTURE.md for technical details

---

**Last updated**: 2025-10-27

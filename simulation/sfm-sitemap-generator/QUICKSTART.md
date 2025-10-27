# Quick Start Guide - SfM Site Map Generator

Get started in 5 minutes!

## Installation

```bash
cd simulation/sfm-sitemap-generator

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: This implementation uses pure OpenCV SfM (no COLMAP required for basic usage).

## Generate Your First Site Map

```bash
# Generate from auditorium cameras
python generate.py --config config/auditorium.yaml --output output/auditorium_sfm.png

# With all exports (JSON + point cloud)
python generate.py --config config/auditorium.yaml --output output/auditorium_sfm.png --export-all
```

## Expected Output

The script will:
1. Load camera images
2. Extract features (SIFT keypoints)
3. Match features across image pairs
4. Estimate camera poses
5. Triangulate 3D points
6. Project to 2D ground plane
7. Extract wall boundaries

You'll see output like:

```
============================================================
Structure from Motion Site Map Generator
============================================================

[Step 1/7] Loading camera images...
  Loaded 4 images

[Step 2/7] Extracting features...
  Camera 1: 8000 features
  Camera 2: 7856 features
  Camera 3: 7432 features
  Camera 4: 8000 features

[Step 3/7] Matching features across images...
  Found 6 valid image pairs
    Cameras 0-1: 234 matches
    Cameras 0-2: 156 matches
    ...

[Step 7/7] Extracting walls...
  Extracted 12 wall segments
  Total wall length: 45.32m

============================================================
Reconstruction Complete!
============================================================

✅ Site map saved to: output/auditorium_sfm.png
```

## Output Files

- **`auditorium_sfm.png`** - 2D site map visualization
- **`auditorium_sfm.json`** - JSON data for frontend integration
- **`auditorium_sfm_pointcloud.ply`** - 3D point cloud (viewable in MeshLab/CloudCompare)

## Next Steps

### Customize Configuration

Edit `config/auditorium.yaml` to adjust parameters:

```yaml
generation:
  feature_type: "sift"      # Try "orb" for faster processing
  max_features: 8000        # Increase for more detail
  grid_resolution_m: 0.05   # Decrease for finer grid
  min_wall_length_m: 0.5    # Adjust wall detection
```

### Add Your Own Cameras

1. Create a new directory: `config/my_site/`
2. Add camera images: `camera1.jpg`, `camera2.jpg`, etc.
3. Create config file: `config/my_site.yaml`

```yaml
name: "My Site Map"
images_dir: "config/my_site"

cameras:
  - id: camera1
    image: "camera1.jpg"
    height_m: 2.0  # meters above ground

  - id: camera2
    image: "camera2.jpg"
    height_m: 2.0
```

4. Generate: `python generate.py --config config/my_site.yaml --output output/my_site.png`

## Troubleshooting

### "Not enough feature matches"

- Ensure cameras have overlapping fields of view
- Use SIFT instead of ORB (more robust): `feature_type: "sift"`
- Increase features: `max_features: 10000`

### "No walls detected"

- Lower threshold: `wall_detection_threshold: 0.5`
- Reduce minimum length: `min_wall_length_m: 0.3`

### Point cloud looks wrong

- Check camera heights are accurate
- Ensure images are from the same scene
- Try different feature matcher settings

## Performance Tips

- **SIFT**: Best accuracy, slower (~30s for 4 cameras)
- **ORB**: Fast, good for testing (~5s for 4 cameras)
- **AKAZE**: Balanced option (~15s for 4 cameras)

## Integration with Axis-Guardian

The generated JSON is compatible with the Axis-Guardian frontend:

```bash
# Copy JSON to frontend
cp output/auditorium_sfm.json ../../shared/site-maps/generated/

# Frontend will automatically load it
```

## Need Help?

See full documentation in `README.md` or check example configurations in `config/`.

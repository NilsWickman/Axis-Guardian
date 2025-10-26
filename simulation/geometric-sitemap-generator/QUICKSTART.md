# Quick Start Guide

Get started with the Geometric Site Map Generator in 5 minutes.

## Installation

```bash
# Navigate to the directory
cd simulation/geometric-sitemap-generator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install in development mode (optional)
pip install -e .
```

## Quick Test

### Option 1: Using the CLI

```bash
# Validate your configuration
python src/cli.py validate --config config/example_site.yaml

# Generate site map
python src/cli.py generate \
    --config config/example_site.yaml \
    --output output/sitemap.png \
    --export-data
```

### Option 2: Using Python Script

```bash
# Run example script
python example_usage.py
```

### Option 3: Programmatic Usage

```python
from pathlib import Path
from src.core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
from src.generator import GeometricSiteMapGenerator

# Define cameras
cameras = [
    CameraConfig(
        id="camera1",
        gps=(35.9940, -78.9018, 120.5),  # lat, lon, elevation
        mount_height=3.5,  # meters
        orientation=CameraOrientation(pan=45, tilt=-15, roll=0),
        intrinsics=CameraIntrinsics(
            focal_length=4.0,
            sensor_size=(0.357, 0.357),
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        ),
        image_path=Path("path/to/camera1.jpg")
    )
]

# Create generator
generator = GeometricSiteMapGenerator(cameras)

# Generate
grid, walls = generator.generate()

# Render
generator.render(Path("output/sitemap.png"))
```

## Configuration Guide

Create a `config/my_site.yaml`:

```yaml
cameras:
  - id: my_camera_1
    gps: [LATITUDE, LONGITUDE, ELEVATION_METERS]
    mount_height: MOUNT_HEIGHT_METERS
    orientation:
      pan: PAN_DEGREES      # 0=North, 90=East, 180=South, 270=West
      tilt: TILT_DEGREES    # Negative = looking down
      roll: 0.0
    intrinsics:
      focal_length: FOCAL_LENGTH_MM
      sensor_size: [WIDTH_INCHES, HEIGHT_INCHES]
      resolution: [WIDTH_PX, HEIGHT_PX]
      fov: [HORIZONTAL_DEG, VERTICAL_DEG]
    image_path: "path/to/image.jpg"

generation:
  grid_resolution: 0.05        # 5cm cells
  min_wall_length: 0.5         # 0.5m minimum wall length
  confidence_threshold: 0.5     # Minimum confidence
  semantic_model: "nvidia/segformer-b5-finetuned-ade-640-640"
```

## Finding Camera Parameters

### GPS Coordinates
- Use Google Maps: Right-click → "What's here?"
- Or use EXIF data from camera photos
- Elevation from topographic maps

### Mount Height
- Measure from ground to camera lens center
- Typical: 3-4 meters for pole-mounted cameras

### Orientation (Pan/Tilt/Roll)

**Pan (Yaw):**
- 0° = North
- 90° = East
- 180° = South
- 270° = West
- Use compass or map direction

**Tilt (Pitch):**
- 0° = Looking at horizon
- -15° = Looking down 15 degrees (typical)
- -90° = Looking straight down

**Roll:**
- Usually 0° (camera level)
- Non-zero if camera is rotated around optical axis

### Camera Intrinsics

From camera specifications:

**Focal Length:** Check camera datasheet (mm)

**Sensor Size:** Common values:
- 1/2.8" sensor = 0.357" × 0.357"
- 1/3" sensor = 0.333" × 0.333"
- 1/2" sensor = 0.5" × 0.5"

**Resolution:** From camera specs (e.g., 1920×1080)

**FOV (Field of View):**
- From camera specs
- Or calculate: `FOV = 2 * atan(sensor_size / (2 * focal_length))`

## Extracting Sample Images

If you have video files:

```bash
# Extract frame from video
ffmpeg -i camera.mp4 -vf "select=eq(n\,0)" -vframes 1 camera.jpg

# Or extract frame at specific time (10 seconds)
ffmpeg -ss 00:00:10 -i camera.mp4 -vframes 1 camera.jpg
```

## Output Files

After generation, you'll have:

```
output/
├── sitemap.png              # Rendered visualization
└── sitemap_data/            # Raw data (if --export-data)
    ├── occupancy_grid.npz   # NumPy occupancy grid
    ├── walls.json           # Extracted walls (JSON)
    └── metadata.json        # Generation metadata
```

## Troubleshooting

### "CUDA out of memory"
- Reduce to smaller segmentation model:
  ```yaml
  semantic_model: "nvidia/segformer-b0-finetuned-ade-512-512"
  ```
- Or run on CPU (slower):
  ```python
  generator = GeometricSiteMapGenerator(cameras, device='cpu')
  ```

### "No walls detected"
- Lower confidence threshold in config
- Check if cameras actually see walls
- Verify image paths are correct

### "Images not found"
- Use absolute paths in configuration
- Or relative to config file location

### Poor results
- Ensure GPS coordinates are accurate
- Verify mount height is correct
- Check pan/tilt orientation (use compass)
- Use multiple cameras for better coverage

## Next Steps

1. Read [Architecture Documentation](docs/ARCHITECTURE.md)
2. Run tests: `pytest tests/`
3. Customize configuration for your site
4. Integrate with your surveillance system

## Performance Tips

- **GPU Acceleration**: Ensure PyTorch uses GPU for segmentation
- **Multiple Cameras**: More cameras = better coverage and accuracy
- **Image Quality**: Higher resolution images give better results
- **Overlapping FOVs**: Cameras with overlapping views improve fusion
- **Good Lighting**: Daylight images work best

## Support

For issues or questions:
- Check [README.md](README.md) for architecture details
- Review example configurations in `config/`
- See test cases in `tests/` for usage patterns

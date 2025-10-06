# Mock Assets Directory

This directory contains mock assets for frontend development and testing.

## Directory Structure

```
shared/mock/
├── camera-feeds/          # Video files for simulating camera streams
│   ├── low_old.mp4       # Industrial machinery camera feed
│   └── new_site.mp4      # Outdoor scene camera feed
│
└── objects/              # SVG objects for alarm overlay simulation
    ├── people/           # Human figures for person detection
    │   ├── person_1.svg  # Individual person SVG
    │   ├── person_2.svg
    │   ├── person_3.svg
    │   ├── person_4.svg
    │   ├── person_5.svg
    │   ├── split-people.py                    # Script to split group SVG
    │   └── vecteezy_group-of..._25668856.svg  # Original group SVG
    │
    └── others/           # Other objects (vehicles, animals, etc.)
```

## Camera Feeds

Video files in `camera-feeds/` are used to simulate live camera streams in the VAPIX mock server.

**Supported formats:** MP4, AVI (automatically converted to MP4)

**Adding new camera feeds:**
1. Place video files in `shared/mock/camera-feeds/`
2. Run `make mock-videos` to copy and convert videos
3. Frontend will automatically discover new cameras on startup

## Objects

SVG files in `objects/` are used to overlay simulated detections on camera feeds.

### People

The `people/` directory contains individual person SVGs extracted from a group image.

- **Original**: `vecteezy_group-of-people-different-genders-different-ages-standing_25668856.svg`
- **Extracted**: `person_1.svg` through `person_5.svg`
- **Script**: `split-people.py` - Python script to split group SVG into individuals

**Re-splitting the group SVG:**
```bash
cd shared/mock/objects/people
python3 split-people.py
```

The script uses XML parsing to:
- Preserve complete element hierarchies (no unclosed tags)
- Extract coordinate bounds from all attributes (x, cx, d, transform, points)
- Filter elements based on horizontal position (5 sections of 1000px each)
- Generate valid, browser-editable SVG files with proper namespaces

### Usage in Alarms

These SVG objects will be overlayed on camera feeds to simulate:
- Person detection alerts
- Motion detection
- Object recognition events

## Integration

The Makefile includes a `mock-videos` target that:
1. Copies videos from `shared/mock/camera-feeds/` to `frontend/mock-server/videos/`
2. Converts any AVI files to MP4 format
3. Makes videos available for VAPIX streaming

**Commands:**
```bash
make mock-videos  # Prepare videos manually
make dev          # Automatically prepares videos and starts frontend
```

## Notes

- All video files should be web-compatible (MP4 with H.264 codec preferred)
- SVG objects should be optimized for overlay performance
- Camera feed names are derived from video filenames (e.g., `low_old.mp4` → "Low Old")

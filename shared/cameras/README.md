# Camera Videos Directory

This directory contains source videos for camera simulation and their pre-rendered versions.

## Directory Structure

```
shared/cameras/
├── README.md                                 # This file
├── people-detection.mp4                      # Source: People walking
├── car-detection.mp4                         # Source: Cars on road
├── person-bicycle-car-detection.mp4          # Source: Mixed traffic
└── rendered/                                  # Pre-rendered videos (generated)
    ├── people-detection-rendered.mp4          # ← Pre-rendered with detections
    ├── people-detection-rendered.detections.json
    ├── car-detection-rendered.mp4
    ├── car-detection-rendered.detections.json
    ├── person-bicycle-car-detection-rendered.mp4
    └── person-bicycle-car-detection-rendered.detections.json
```

## Quick Start

### Generate Pre-rendered Videos

From project root:

```bash
make prerender-videos
```

This **automatically detects all videos** in this directory and creates optimized versions with baked-in object detection boxes and metadata.

**Smart features:**
- Finds all `.mp4` files automatically
- Skips already pre-rendered videos
- Only re-renders if source is newer than output
- Shows processing summary

### Add New Video

1. **Place video file here:**
   ```bash
   cp ~/my-video.mp4 shared/cameras/
   ```

2. **Pre-render it:**

   **Option A: Auto-detect (recommended)**
   ```bash
   make prerender-videos  # Automatically finds and processes your new video
   ```

   **Option B: Process specific video**
   ```bash
   make prerender-video VIDEO=my-video.mp4
   ```

3. **Configure streaming:**
   - Update `simulation/scripts/stream-mock-cameras.sh`
   - Add camera mapping for your video
   - See [Video Pre-processing Guide](../../simulation/VIDEO_PREPROCESSING.md)

## Source Videos

These are the original videos used for camera simulation:

- **people-detection.mp4** - Pedestrian traffic, walkways
- **car-detection.mp4** - Vehicle traffic, parking lots
- **person-bicycle-car-detection.mp4** - Mixed traffic scenarios

## Pre-rendered Videos

Located in `rendered/` subdirectory. These are automatically generated and should **not** be manually edited.

**Benefits:**
- 3-4x better FPS (90-120 FPS vs 25-30 FPS)
- 70-80% less CPU usage
- Consistent, reproducible detections
- Instant metadata lookup

## File Formats

### Video Files (.mp4)

- **Codec:** H.264 (avc1)
- **Resolution:** Varies (720p - 1080p)
- **Frame Rate:** 30 FPS
- **Bitrate:** ~2 Mbps

### Detection Metadata (.detections.json)

JSON format with normalized bounding boxes (0-1 range):

```json
{
  "video_info": { "width": 1920, "height": 1080, "fps": 30 },
  "frames": [
    {
      "frame_number": 0,
      "timestamp": 0.0,
      "detections": [
        {
          "bbox": {
            "left": 0.271,   // Normalized x1
            "top": 0.315,    // Normalized y1
            "right": 0.355,  // Normalized x2
            "bottom": 0.501  // Normalized y2
          },
          "class_name": "person",
          "confidence": 0.89
        }
      ]
    }
  ]
}
```

## Git Tracking

- **Source videos:** Tracked (smaller, easier to version)
- **Rendered videos:** Ignored (can be regenerated)
- **Detection JSON:** Tracked (useful for reproducibility)

See `.gitignore` for details.

## Disk Space

| File Type | Typical Size | Regeneration Time |
|-----------|--------------|-------------------|
| Source (30s) | 3-5 MB | N/A |
| Rendered (30s) | 3-6 MB | ~30s |
| Detection JSON | 50-200 KB | (included above) |

**Note:** Rendered videos are similar in size to source videos but optimized for streaming.

## Troubleshooting

### "No videos found"

```bash
# List available videos
make list-videos

# Verify files exist
ls -lh shared/cameras/*.mp4
```

### "Pre-rendering failed"

```bash
# Check Python environment
simulation/webrtc-detection/venv/bin/python --version

# Reinstall dependencies
make setup
```

### "Out of disk space"

Pre-rendered videos use similar space as source videos. To free up space:

```bash
# Remove all pre-rendered videos (can regenerate anytime)
rm -rf shared/cameras/rendered/*.mp4

# Keep detection JSONs for metadata
ls shared/cameras/rendered/*.json
```

## Further Reading

- [Video Pre-processing Guide](../../simulation/VIDEO_PREPROCESSING.md) - Complete documentation
- [Integration Guide](../../VIDEO_PRERENDERING_INTEGRATION.md) - Manual integration steps
- [Main README](../../README.md) - Project overview

## Support

For questions or issues:
1. Check [Video Pre-processing Guide](../../simulation/VIDEO_PREPROCESSING.md)
2. Verify `make setup` completed successfully
3. Check logs: `simulation/mediamtx/mediamtx.log`
4. Open GitHub issue with details

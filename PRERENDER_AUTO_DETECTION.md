# Auto-Detection Feature for Video Pre-rendering

## Overview

The `make prerender-videos` command now **automatically detects and processes** all videos in the `shared/cameras/` directory, making it much easier to manage pre-rendered videos.

## Key Features

### 1. Automatic Video Discovery

**Before:**
```bash
# Had to manually specify each video
make prerender-video VIDEO=people-detection.mp4
make prerender-video VIDEO=car-detection.mp4
make prerender-video VIDEO=person-bicycle-car-detection.mp4
```

**Now:**
```bash
# One command finds and processes all videos
make prerender-videos
```

The script automatically:
- Scans `shared/cameras/` for all `.mp4` files
- Excludes files in subdirectories (like `rendered/`)
- Excludes files with "rendered" in the filename

### 2. Intelligent Skip Logic

Videos are **automatically skipped** if:
- Pre-rendered video already exists (`.mp4`)
- Detection JSON already exists (`.detections.json`)
- Source video is older than the rendered version

This means you can run `make prerender-videos` repeatedly without wasting time re-processing unchanged videos.

**Example:**
```
Found 3 source videos in shared/cameras
Skipping 2 videos (already rendered):
  ✓ car-detection.mp4
  ✓ people-detection.mp4
Processing 1 videos...
```

### 3. Force Re-rendering

If you need to re-render everything (e.g., after changing detection model):

```bash
make prerender-videos-force
```

This ignores existing rendered files and processes all videos fresh.

### 4. Modification Time Checking

The system compares file modification times:

```python
source_mtime = video_path.stat().st_mtime
rendered_mtime = output_path.stat().st_mtime

if source_mtime > rendered_mtime:
    # Re-render because source is newer
```

This ensures if you update a source video, it will be automatically re-rendered on the next run.

### 5. Processing Summary

After completion, you get a detailed summary:

```
✓ Batch processing complete!
  Processed: 2
  Skipped: 1
  Failed: 0
  Output: /path/to/shared/cameras/rendered/
```

## Usage Examples

### First-time Setup

```bash
# 1. Add videos to shared/cameras/
cp ~/videos/*.mp4 shared/cameras/

# 2. Pre-render all (auto-detects)
make prerender-videos

# Output:
# Found 3 source videos
# Processing 3 videos...
# ✓ Batch processing complete!
#   Processed: 3
#   Skipped: 0
#   Failed: 0
```

### Incremental Updates

```bash
# Add a new video
cp ~/new-video.mp4 shared/cameras/

# Run pre-rendering again
make prerender-videos

# Output:
# Found 4 source videos
# Skipping 3 videos (already rendered)
# Processing 1 videos...
# ✓ Batch processing complete!
#   Processed: 1
#   Skipped: 3
```

### After Source Video Update

```bash
# Edit source video
ffmpeg -i shared/cameras/people-detection.mp4 -vf "..." updated.mp4
mv updated.mp4 shared/cameras/people-detection.mp4

# Re-run pre-rendering
make prerender-videos

# Output:
# Source video people-detection.mp4 is newer than rendered version
# Processing 1 videos...
# ✓ Batch processing complete!
#   Processed: 1  (re-rendered the updated one)
#   Skipped: 2
```

### Force Re-render with New Settings

```bash
# Change detection confidence threshold in script
# Then force re-render all
make prerender-videos-force

# Output:
# Processing 3 videos...
# ✓ Re-rendering complete!
#   Processed: 3  (all videos re-rendered)
```

## Technical Implementation

### File Discovery

```python
def list_source_videos():
    """List available source videos for processing."""
    videos = list(SOURCE_VIDEOS_DIR.glob("*.mp4"))
    # Exclude already rendered videos and any videos in subdirectories
    videos = [v for v in videos if v.parent == SOURCE_VIDEOS_DIR and "rendered" not in v.stem]
    return sorted(videos)
```

### Re-rendering Check

```python
def check_if_needs_rerendering(video_path: Path) -> bool:
    """Check if a video needs to be re-rendered."""
    output_path = RENDERED_VIDEOS_DIR / f"{video_path.stem}-rendered.mp4"
    json_path = output_path.with_suffix('.detections.json')

    # Check if rendered files exist
    if not output_path.exists() or not json_path.exists():
        return True

    # Check if source is newer than rendered
    source_mtime = video_path.stat().st_mtime
    rendered_mtime = output_path.stat().st_mtime

    if source_mtime > rendered_mtime:
        logger.info(f"Source video {video_path.name} is newer than rendered version")
        return True

    return False
```

### Batch Processing Logic

```python
# Check which videos need processing
videos_to_process = []
videos_skipped = []

for video in videos:
    if args.force or check_if_needs_rerendering(video):
        videos_to_process.append(video)
    else:
        videos_skipped.append(video)

# Show skipped videos
if videos_skipped:
    logger.info(f"\nSkipping {len(videos_skipped)} videos (already rendered):")
    for video in videos_skipped:
        logger.info(f"  ✓ {video.name}")
```

## Benefits

### Development Workflow

✅ **Faster iterations** - No need to manually track which videos need processing
✅ **No duplicate work** - Automatically skips already processed videos
✅ **Easy updates** - Just run `make prerender-videos` after adding new videos
✅ **Safe re-runs** - Can run multiple times without harm

### CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Pre-render videos
  run: make prerender-videos

- name: Cache rendered videos
  uses: actions/cache@v3
  with:
    path: shared/cameras/rendered/
    key: rendered-videos-${{ hashFiles('shared/cameras/*.mp4') }}
```

The auto-detection ensures the CI system only processes videos that have changed.

### Team Collaboration

- Developer A adds `video1.mp4` → Runs `make prerender-videos` → Commits detection JSON
- Developer B pulls changes, adds `video2.mp4` → Runs `make prerender-videos`
- System automatically:
  - Skips `video1.mp4` (already rendered, JSON in repo)
  - Processes only `video2.mp4` (new)

## Commands Summary

| Command | Behavior | Use Case |
|---------|----------|----------|
| `make prerender-videos` | Auto-detect, skip existing | **Default** - Daily use |
| `make prerender-videos-force` | Re-render all videos | Changed model/settings |
| `make prerender-video VIDEO=...` | Process single video | Testing specific video |
| `make list-videos` | Show all videos | Check what's available |

## Troubleshooting

### No videos found

```bash
# Check directory exists and has videos
ls -lh shared/cameras/*.mp4

# If empty, add videos
cp ~/videos/*.mp4 shared/cameras/
```

### Videos not being skipped

```bash
# Check if rendered files exist
ls -lh shared/cameras/rendered/

# If missing, they'll be processed (expected behavior)
```

### Want to force re-render one video

```bash
# Delete its rendered files
rm shared/cameras/rendered/people-detection-rendered.*

# Run auto-detection
make prerender-videos
# Will re-process only that video
```

## Future Enhancements

Potential improvements:

1. **Parallel processing** - Process multiple videos simultaneously
2. **Progress bars** - Real-time progress for long videos
3. **Change detection** - Hash-based checking instead of timestamp
4. **Selective re-rendering** - Only re-render frames that changed
5. **Cloud integration** - Auto-upload rendered videos to CDN

## Conclusion

The auto-detection feature makes video pre-rendering **effortless**:
- No manual tracking of which videos need processing
- Safe to run repeatedly
- Intelligent skipping saves time
- Perfect for CI/CD pipelines

**One command to rule them all:**
```bash
make prerender-videos
```

That's it! 🎉

# Detection JSON Format Improvements

## Current Status

✅ **Already VAPIX-compliant**: Bounding boxes use normalized 0-1 coordinates
✅ **Well-structured**: Clear hierarchy with metadata and per-frame detections
✅ **Complete information**: Includes video info, detection config, and statistics

## Current Format

```json
{
  "video_info": {
    "source_file": "people-detection.mp4",
    "output_file": "people-detection-rendered.mp4",
    "width": 768,
    "height": 432,
    "fps": 12.0,
    "total_frames": 596,
    "duration_seconds": 49.67
  },
  "detection_config": {
    "model": "yolov8n",
    "confidence_threshold": 0.5,
    "iou_threshold": 0.45,
    "inference_size": 640
  },
  "statistics": {
    "total_detections": 393,
    "processing_time_seconds": 5.14,
    "average_fps": 116.02
  },
  "frames": [
    {
      "frame_number": 0,
      "timestamp": 0.0,
      "detections": [
        {
          "bbox": {
            "left": 0.123,      // ✓ Already normalized 0-1
            "top": 0.456,
            "right": 0.789,
            "bottom": 0.901
          },
          "confidence": 0.95,
          "class_id": 0,
          "class_name": "person",
          "timestamp": 0.0,     // ⚠ Redundant with frame timestamp
          "frame_number": 0     // ⚠ Redundant with frame frame_number
        }
      ]
    }
  ]
}
```

## Proposed Improvements

### 1. Remove Redundant Fields

**Problem**: Each detection includes `timestamp` and `frame_number` that duplicate the parent frame's values.

**Current size** (per detection with redundancy):
```json
{
  "bbox": {...},              // ~80 bytes
  "confidence": 0.95,         // ~15 bytes
  "class_id": 0,              // ~12 bytes
  "class_name": "person",     // ~20 bytes
  "timestamp": 0.0833,        // ~18 bytes
  "frame_number": 1           // ~16 bytes
}
// Total: ~161 bytes per detection
```

**Proposed** (remove redundant fields):
```json
{
  "bbox": {...},              // ~80 bytes
  "confidence": 0.95,         // ~15 bytes
  "class_id": 0,              // ~12 bytes
  "class_name": "person"      // ~20 bytes
}
// Total: ~127 bytes per detection (21% smaller)
```

**Savings**: For 393 detections across 596 frames:
- Current: ~63 KB
- Proposed: ~50 KB
- **Reduction: 13 KB (21%)**

### 2. Add Detection ID for Tracking

**Enhancement**: Add unique ID per detection for multi-frame tracking.

```json
{
  "bbox": {...},
  "confidence": 0.95,
  "class_id": 0,
  "class_name": "person",
  "detection_id": "det_frame0_obj0",  // Unique ID
  "track_id": null                     // For future object tracking
}
```

**Benefits**:
- Enable cross-frame tracking queries
- Support temporal analysis (object persistence)
- Foundation for future tracking algorithms

### 3. Add VAPIX-Specific Metadata

**Enhancement**: Include Axis camera-specific fields for realistic simulation.

```json
{
  "video_info": {...},
  "detection_config": {...},
  "statistics": {...},
  "vapix_metadata": {
    "camera_id": "camera1",
    "camera_model": "P3245-LVE",
    "analytics_module": "AXIS Object Analytics",
    "analytics_version": "1.0.0",
    "scenario": "object_detection"
  },
  "frames": [...]
}
```

**Benefits**:
- More realistic simulation of Axis camera analytics
- Matches actual VAPIX event format
- Easier integration testing with real camera workflows

### 4. Support Sparse Frame Storage

**Optimization**: Only store frames with detections.

**Current**: All 596 frames stored (even empty ones)
```json
{
  "frame_number": 123,
  "timestamp": 10.25,
  "detections": []  // Empty but still stored
}
```

**Proposed**: Skip empty frames
```json
// Only frames with detections are included
// Frame lookup: binary search or hash map
```

**Savings**:
- Typical detection rate: ~30-50% of frames
- File size reduction: ~40-60%
- **Example**: 596 frames → ~250 frames with detections

### 5. Add Bounding Box Center and Size

**Enhancement**: Pre-compute common calculations.

```json
{
  "bbox": {
    "left": 0.1,
    "top": 0.2,
    "right": 0.3,
    "bottom": 0.4,
    // Pre-computed for convenience
    "center_x": 0.2,     // (left + right) / 2
    "center_y": 0.3,     // (top + bottom) / 2
    "width": 0.2,        // right - left
    "height": 0.2        // bottom - top
  }
}
```

**Trade-off**:
- ❌ Increases file size by ~30%
- ✅ Faster frontend rendering (no computation needed)
- ✅ Easier querying (find objects by size/position)

**Recommendation**: Make this **optional** via flag in prerender script.

### 6. Add Frame-Level Statistics

**Enhancement**: Aggregate stats per frame for quick queries.

```json
{
  "frame_number": 42,
  "timestamp": 3.5,
  "stats": {
    "detection_count": 3,
    "classes": ["person", "car"],
    "avg_confidence": 0.87,
    "has_high_confidence": true  // Any detection > 0.9
  },
  "detections": [...]
}
```

**Benefits**:
- Quick filtering: "Show frames with >5 detections"
- Analytics: "Average confidence over time"
- No need to iterate all detections

### 7. Support Multiple Detection Formats

**Enhancement**: Provide bounding boxes in multiple formats.

```json
{
  "bbox": {
    // VAPIX normalized (0-1) - primary format
    "normalized": {
      "left": 0.1,
      "top": 0.2,
      "right": 0.3,
      "bottom": 0.4
    },
    // Alternative formats (optional)
    "pixel": {         // Absolute pixels (for this video resolution)
      "x1": 76,
      "y1": 86,
      "x2": 230,
      "y2": 173
    },
    "coco": {          // COCO format [x, y, width, height]
      "x": 76,
      "y": 86,
      "width": 154,
      "height": 87
    }
  }
}
```

**Trade-off**:
- ❌ Much larger files (3x bbox data)
- ✅ Compatible with multiple ML frameworks
- ✅ No conversion needed by consumers

**Recommendation**: Make **optional** with format flag.

### 8. Add Compression Support

**Enhancement**: Support gzip compression for JSON files.

```bash
# Current
people-detection-rendered.detections.json         # 63 KB

# Proposed
people-detection-rendered.detections.json.gz      # ~12 KB (81% reduction)
```

**Implementation**:
```python
import gzip
import json

# Save compressed
with gzip.open(metadata_path.with_suffix('.detections.json.gz'), 'wt') as f:
    json.dump(metadata, f)

# Load (auto-detect)
if path.suffix == '.gz':
    with gzip.open(path, 'rt') as f:
        data = json.load(f)
else:
    with open(path, 'r') as f:
        data = json.load(f)
```

**Benefits**:
- 70-85% file size reduction
- Transparent to consumers (auto-detect)
- Faster loading over network

### 9. MessagePack Binary Format

**Enhancement**: Offer MessagePack alternative to JSON.

```bash
# JSON (human-readable)
people-detection-rendered.detections.json         # 63 KB

# MessagePack (binary, more compact)
people-detection-rendered.detections.msgpack      # ~35 KB (44% reduction)

# MessagePack + gzip (best compression)
people-detection-rendered.detections.msgpack.gz   # ~8 KB (87% reduction)
```

**Implementation**:
```python
import msgpack

# Save as MessagePack
with open(metadata_path.with_suffix('.detections.msgpack'), 'wb') as f:
    msgpack.pack(metadata, f)
```

**Trade-off**:
- ❌ Not human-readable
- ✅ 44% smaller than JSON
- ✅ Faster to parse (already using MessagePack in data channel)
- ✅ Consistent with data channel format

### 10. Add Temporal Indexing

**Enhancement**: Build index for fast time-based queries.

```json
{
  "video_info": {...},
  "index": {
    "frames_by_second": {
      "0": [0, 1, 2, 3],      // Frames in second 0
      "1": [4, 5, 6, 7],      // Frames in second 1
      "5": [20, 21, 22, 23]
    },
    "frames_with_class": {
      "person": [0, 5, 12, 18, ...],
      "car": [3, 9, 15, ...]
    },
    "high_confidence_frames": [0, 5, 8, 12, ...]  // Frames with any detection > 0.9
  },
  "frames": [...]
}
```

**Benefits**:
- **10-100x faster** queries: "Find all frames with cars"
- Enable timeline scrubbing
- Support event-based navigation

**Trade-off**:
- Slightly larger file (~5-10%)
- More complex generation

## Recommended Implementation Priority

### Phase 1: Quick Wins (High Value, Low Effort)

1. ✅ **Remove redundant fields** (timestamp, frame_number from detections)
   - Effort: 10 lines of code
   - Savings: 21% file size
   - Impact: Cleaner format, less redundancy

2. ✅ **Add VAPIX metadata**
   - Effort: 20 lines of code
   - Impact: More realistic simulation

3. ✅ **Support sparse frame storage** (skip empty frames)
   - Effort: 30 lines of code
   - Savings: 40-60% file size
   - Impact: Faster loading, smaller files

### Phase 2: Enhanced Querying (Medium Value, Medium Effort)

4. ⚠️ **Add frame-level statistics**
   - Effort: 50 lines of code
   - Impact: Fast filtering and analytics

5. ⚠️ **Add detection IDs**
   - Effort: 20 lines of code
   - Impact: Enable tracking and cross-frame queries

### Phase 3: Performance Optimization (High Value, Medium Effort)

6. ⚠️ **Add compression support** (gzip)
   - Effort: 40 lines of code
   - Savings: 70-85% file size
   - Impact: Faster loading, less disk space

7. ⚠️ **MessagePack binary format**
   - Effort: 30 lines of code (reuse existing msgpack)
   - Savings: 44% smaller, faster parsing
   - Impact: Consistent with data channel format

### Phase 4: Advanced Features (Optional)

8. ❓ **Temporal indexing**
   - Effort: 100 lines of code
   - Impact: 10-100x faster queries

9. ❓ **Multiple bbox formats**
   - Effort: 50 lines of code
   - Impact: ML framework compatibility

10. ❓ **Pre-computed bbox center/size**
    - Effort: 10 lines of code
    - Impact: Faster rendering

## Example: Improved Format (Phase 1)

```json
{
  "video_info": {
    "source_file": "people-detection.mp4",
    "output_file": "people-detection-rendered.mp4",
    "width": 768,
    "height": 432,
    "fps": 12.0,
    "total_frames": 596,
    "duration_seconds": 49.67
  },
  "detection_config": {
    "model": "yolov8n",
    "confidence_threshold": 0.5,
    "iou_threshold": 0.45,
    "inference_size": 640
  },
  "vapix_metadata": {
    "camera_id": "camera1",
    "camera_model": "P3245-LVE",
    "analytics_module": "AXIS Object Analytics",
    "analytics_version": "1.0.0",
    "scenario": "object_detection"
  },
  "statistics": {
    "total_detections": 393,
    "total_frames_with_detections": 248,  // NEW
    "processing_time_seconds": 5.14,
    "average_fps": 116.02
  },
  "frames": [
    // Only frames with detections (sparse storage)
    {
      "frame_number": 0,
      "timestamp": 0.0,
      "detections": [
        {
          "bbox": {
            "left": 0.123,
            "top": 0.456,
            "right": 0.789,
            "bottom": 0.901
          },
          "confidence": 0.95,
          "class_id": 0,
          "class_name": "person"
          // Removed: timestamp, frame_number (redundant)
        }
      ]
    }
    // Frames without detections are omitted
  ]
}
```

**File size comparison**:
- Current: ~63 KB
- Phase 1 improved: ~35 KB (44% smaller)
- Phase 1 + gzip: ~7 KB (89% smaller!)

## Implementation Example

Here's how to implement Phase 1 improvements:

```python
# In prerender_detections.py, update save_metadata():

def save_improved_metadata(output_path, all_detections, video_info, detection_config, processing_time, camera_id="camera1"):
    """Save detection metadata with improvements."""
    from camera_registry import get_camera_registry

    # Get camera metadata
    registry = get_camera_registry()
    camera = registry.get_camera(camera_id)

    # Filter to only frames with detections (sparse storage)
    frames_with_detections = [
        frame for frame in all_detections
        if len(frame['detections']) > 0
    ]

    # Remove redundant fields from detections
    for frame in frames_with_detections:
        for detection in frame['detections']:
            # Remove redundant timestamp and frame_number
            detection.pop('timestamp', None)
            detection.pop('frame_number', None)

    # Calculate total detections
    total_detections = sum(len(f['detections']) for f in frames_with_detections)

    metadata = {
        "video_info": video_info,
        "detection_config": detection_config,
        "vapix_metadata": {
            "camera_id": camera.id,
            "camera_model": camera.vapix.model,
            "camera_serial": camera.vapix.serial_number,
            "analytics_module": "AXIS Object Analytics",
            "analytics_version": "1.0.0",
            "scenario": "object_detection",
        },
        "statistics": {
            "total_detections": total_detections,
            "total_frames": video_info['total_frames'],
            "total_frames_with_detections": len(frames_with_detections),
            "detection_density": len(frames_with_detections) / video_info['total_frames'],
            "processing_time_seconds": processing_time,
            "average_fps": video_info['total_frames'] / processing_time,
        },
        "frames": frames_with_detections,
    }

    # Save as JSON
    json_path = output_path.with_suffix('.detections.json')
    with open(json_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    # Also save compressed version
    import gzip
    gz_path = output_path.with_suffix('.detections.json.gz')
    with gzip.open(gz_path, 'wt') as f:
        json.dump(metadata, f)

    logger.info(f"✓ Detection metadata saved: {json_path} ({json_path.stat().st_size} bytes)")
    logger.info(f"✓ Compressed metadata saved: {gz_path} ({gz_path.stat().st_size} bytes)")
```

## Summary

**Current format is already VAPIX-compliant** ✅ (normalized bounding boxes)

**Top 3 recommended improvements**:
1. **Remove redundant fields** - 21% smaller, cleaner format
2. **Sparse frame storage** - 40-60% smaller, faster loading
3. **Add gzip compression** - 70-85% smaller, transparent to consumers

**Combined impact** (Phase 1 + compression):
- File size: 63 KB → 7 KB (89% reduction!)
- Parse time: Similar or faster
- Format: Still VAPIX-compliant
- Effort: ~2 hours implementation

Would you like me to implement these improvements?

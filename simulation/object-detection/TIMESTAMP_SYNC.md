# Timestamp Synchronization Guide

## Problem Overview

When displaying real-time object detection bounding boxes on video streams, synchronization issues can occur because:

1. **Detection service** processes frames with minimal latency (~200-500ms)
2. **Video player** (HLS/WebRTC/RTSP) introduces buffering latency (200ms-30s)
3. **Looped videos** compound synchronization drift over time

This causes bounding boxes to appear **ahead** or **behind** the actual objects in the video.

## Solution: Timestamp Synchronization

The system now tracks multiple timestamps to help you diagnose and fix synchronization:

### Timestamp Flow

```
┌─────────────┐
│ Camera Feed │ (Looped video via MediaMTX)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Detection Service│ (YOLOv8 processes frame)
│ Frame Time: T₀   │ ← wall-clock time when frame processed
└──────┬───────────┘
       │
       │ + DETECTION_DELAY_MS (sync offset)
       │
       ▼
┌─────────────────┐
│ MQTT Message    │
│ timestamp: T₁   │ ← T₀ + offset (in seconds)
│ publish_time: T₂│ ← when MQTT message sent
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Frontend Player │ (HLS with 10-30s buffer)
│ Video Time: T₃  │ ← current playback position
│ Real Time: T₄   │ ← wall-clock time in browser
└─────────────────┘
```

### Timing Metadata

Every detection message now includes:

```json
{
  "camera_id": "camera1",
  "timestamp": 1234567890.123,      // Frame detection timestamp
  "publish_timestamp": 1234567890.125,
  "detection_count": 3,
  "detections": [...],
  "timing": {
    "frame_timestamp": 1234567890.123,
    "publish_timestamp": 1234567890.125,
    "processing_latency_ms": 2.5,   // YOLO processing time
    "detection_delay_ms": -15000    // Configured sync offset
  }
}
```

## Configuring Synchronization

### 1. Use the Debug Overlay

Visit `http://localhost:5173/cameras/live-detection` and click **"🔍 Show Debug"** to see:

- **Video Playback**: Current video position in seconds
- **Detection Time**: Wall-clock time when detection occurred
- **Processing Latency**: How long YOLO took to process the frame
- **Sync Offset**: Your configured `DETECTION_DELAY_MS` value
- **Stream Delay**: How far behind real-time the video is (⚠️ if > 1s)

### 2. Measure Your Latency

1. Start detection service: `make detect`
2. Open debug view: http://localhost:5173/cameras/live-detection
3. Observe the **Stream Delay** value
4. This tells you how far behind the video player is

### 3. Configure the Offset

Edit `backend/python/object-detection-service/.env`:

```bash
# For HLS player (high latency ~10-30 seconds)
DETECTION_DELAY_MS=-15000  # Make detections appear 15s older

# For WebRTC player (low latency ~0.5-2 seconds)
DETECTION_DELAY_MS=-1000   # Make detections appear 1s older

# For direct RTSP player (very low latency)
DETECTION_DELAY_MS=-200    # Make detections appear 200ms older
```

### 4. Understanding the Sign

- **NEGATIVE values**: Make detections appear OLDER (use when boxes are AHEAD)
- **POSITIVE values**: Make detections appear NEWER (use when boxes LAG BEHIND)

**For HLS, you almost always need negative values!**

### 5. Fine-Tune

1. Set initial offset based on Stream Delay: `DETECTION_DELAY_MS = -(Stream Delay in ms)`
2. Restart detection service: `make detect`
3. Watch the video and observe alignment
4. Adjust offset in increments of ±1000ms until synchronized
5. Save final value to `.env`

## Example: HLS Stream Synchronization

**Symptoms:**
- Bounding boxes appear 15 seconds ahead of people
- Stream Delay shows: **15.2s**
- Boxes highlight empty space, then people walk into them

**Solution:**

```bash
# .env
DETECTION_DELAY_MS=-15000  # Negative to make detections older
```

**Result:**
- Detections timestamped 15s in the past
- Boxes now align with people in the buffered video
- Stream Delay still shows 15s (this is normal for HLS)

## Troubleshooting

### No detections showing after setting negative offset

**Symptom:** You set `DETECTION_DELAY_MS=-10000` and now no bounding boxes appear.

**Cause:** The frontend was filtering out detections older than 500ms.

**Fix:** This has been fixed! The frontend no longer filters by timestamp age. Refresh your browser or restart the frontend.

**Verify:** Check the debug overlay - you should see:
- Processing Latency: positive value (10-100ms)
- Sync Offset: -10000ms
- Detections appearing in the coordinate list

### Boxes still out of sync after setting offset

**Check:**
- Did you restart the detection service after changing `.env`?
- Did you refresh the browser to get the updated frontend code?
- Is the offset magnitude close to the Stream Delay value?
- Try adjusting by ±2000ms increments

### Sync drifts over time (looped videos)

This is caused by video loops resetting playback time while detections continue monotonically.

**Current limitation**: The system uses wall-clock time, not video timestamps.

**Workaround**: Restart detection service when drift becomes noticeable.

**Future fix**: Extract PTS (Presentation Timestamp) from RTSP stream.

### Different cameras need different offsets

Each streaming protocol has different latency:
- **RTSP direct**: 200-500ms
- **WebRTC**: 500-2000ms
- **HLS**: 10,000-30,000ms

If using multiple protocols, you'll need per-camera offsets (not currently supported).

### Stream Delay shows 0s but boxes are misaligned

This means detections are timestamped correctly, but the video player itself is out of sync.

**Check:**
- HLS buffer settings in frontend
- Network latency to MediaMTX
- Video player configuration

## Technical Details

### Where timestamps are set

1. **Stream Processor** (`stream_processor.py:135`):
   ```python
   frame_timestamp = time.time()  # Wall-clock time
   ```

2. **Detector** (`detector.py:56-57`):
   ```python
   detection_timestamp = frame_timestamp or time.time()
   detection_timestamp += settings.detection_delay_ms / 1000.0
   ```

3. **MQTT Publisher** (`mqtt_publisher.py:83-101`):
   ```python
   message = {
       "timestamp": frame_timestamp,
       "publish_timestamp": time.time(),
       "timing": { ... }
   }
   ```

### Frontend filtering

The frontend does **not** filter detections by timestamp age. This is intentional because:

1. When `DETECTION_DELAY_MS` is negative (e.g., `-10000`), detections appear 10 seconds old
2. Age-based filtering would reject all synchronized detections
3. MQTT already streams fresh detections, so no additional filtering is needed

**Important**: If you add timestamp filtering, account for `DETECTION_DELAY_MS` in your age calculation!

## Best Practices

1. **Always use the debug overlay** when setting up cameras
2. **Document your offset** in camera configuration
3. **Test after any streaming config change**
4. **Consider using WebRTC** instead of HLS for lower latency
5. **Monitor Stream Delay** - if it grows over time, you may have network issues

## PTS-Based Timestamp Synchronization (NEW!)

### What is PTS?

**PTS (Presentation Timestamp)** is the actual video playback time embedded in the video stream. Unlike wall-clock time which continuously increases, PTS **resets when videos loop**, making it perfect for looped mock videos.

### How It Works

```
Video Loop 1:  PTS 0s → 60s  |  Wall-clock: 13:00:00 → 13:01:00
Video Loop 2:  PTS 0s → 60s  |  Wall-clock: 13:01:00 → 13:02:00  ✅ SYNC!
Video Loop 3:  PTS 0s → 60s  |  Wall-clock: 13:02:00 → 13:03:00  ✅ SYNC!
```

The system:
1. Extracts PTS from each video frame (`CAP_PROP_POS_MSEC`)
2. Detects loops when PTS jumps backward (e.g., 59000ms → 100ms)
3. Maintains continuity by tracking loop count
4. Calculates timestamp: `stream_start + (loops × duration) + PTS`

### Enabling PTS Mode

```bash
# .env
USE_VIDEO_PTS=true                 # Enable PTS-based timing
PTS_RESET_THRESHOLD_MS=5000.0      # Loop detection threshold
DETECTION_DELAY_MS=-10000          # HLS sync offset still applies
```

**When to use:**
- ✅ Looped mock videos (FFmpeg `-stream_loop -1`)
- ✅ Testing with repeated footage
- ❌ Live camera feeds (no PTS in live streams)

### Loop Detection

The system detects loops when PTS jumps backward significantly:

```python
if current_pts < previous_pts - 5000:  # 5 second threshold
    loop_count += 1
    logger.info(f"Loop #{loop_count} detected")
```

**Threshold tuning:**
- Short videos (10-30s): Use `PTS_RESET_THRESHOLD_MS=3000`
- Medium videos (30-120s): Use `PTS_RESET_THRESHOLD_MS=5000` (default)
- Long videos (120s+): Use `PTS_RESET_THRESHOLD_MS=10000`

### Debug Overlay with PTS

The frontend now shows PTS information:

```
Video PTS:     45.2s    ← Current position in video
Loops:         3        ← Number of loops detected
PTS Mode:      Enabled  ← Green when active
```

**What to check:**
- Video PTS should match video playback position
- Loops should increment each time video restarts
- PTS Mode should show "Enabled" in green

### Troubleshooting PTS Mode

**PTS stays at 0.0s:**
- OpenCV can't read PTS from this stream format
- Try different container format (MP4 works best)
- Fallback: Set `USE_VIDEO_PTS=false`

**Loops not detected:**
- Increase `PTS_RESET_THRESHOLD_MS`
- Check logs for "Loop detected" messages
- Video may not be looping properly

**Sync still drifts:**
- PTS mode handles loops, but you still need `DETECTION_DELAY_MS` for HLS latency
- Example: `USE_VIDEO_PTS=true` + `DETECTION_DELAY_MS=-10000`

## Future Improvements

- [x] Extract PTS from RTSP streams for true timestamp sync ✅ **DONE!**
- [x] Handle video loops gracefully ✅ **DONE!**
- [ ] Per-camera offset configuration
- [ ] Auto-calibration mode to detect optimal offset
- [ ] Support for frame-accurate synchronization
- [ ] NTP time synchronization between services

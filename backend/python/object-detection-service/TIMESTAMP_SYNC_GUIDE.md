# Detection Timestamp Synchronization Guide

## Problem Fixed

The object detection bounding boxes were appearing ahead of the video because:
- HLS video player has 6-30 seconds of buffering/latency
- Object detection processes RTSP streams in near real-time (~0.5s latency)
- Timestamps were not synchronized between the two systems

## Solution

The detection service now:
1. **Extracts frame timestamps** from the RTSP stream itself (not system time)
2. **Adds configurable delay** to compensate for video player latency
3. **Uses video frame time** as the detection timestamp for accurate correlation

## How to Calibrate

### Step 1: Measure Your Video Player Latency

1. Start the camera streams: `make cameras`
2. Open the camera viewer in your browser
3. Watch for a distinctive event (e.g., person enters frame, car passes)
4. Note the current system time when you see the event
5. The difference is your video latency

**Or use this quick test:**
- Open camera viewer and detection viewer side-by-side
- Trigger a detection (walk in front of camera)
- Note how many seconds AHEAD the detection appears compared to video
- That number is your latency

### Step 2: Configure Detection Delay

Edit `backend/python/object-detection-service/.env`:

**IMPORTANT: Use NEGATIVE values to make detections appear older!**

```bash
# For HLS video player (camera-viewer.html)
# If detections appear 15 seconds AHEAD of video:
DETECTION_DELAY_MS=-15000

# For HLS with typical 10 second latency:
# DETECTION_DELAY_MS=-10000

# For WebRTC video player (future implementation)
# If detections appear 1 second AHEAD:
# DETECTION_DELAY_MS=-1000

# For direct RTSP player with minimal latency:
# DETECTION_DELAY_MS=0
```

### Step 3: Fine-Tune

1. Edit `.env` with your estimated negative delay
2. Restart detection service (Ctrl+C, then `make detect`)
3. Watch both viewers
4. Adjust `DETECTION_DELAY_MS` in 2000ms increments:
   - Detections STILL ahead? Make MORE negative (e.g., -10000 → -12000)
   - Detections NOW behind? Make LESS negative (e.g., -10000 → -8000)
5. Restart and test until aligned

## Quick Start Values

| Video Player Type | Latency | Recommended DETECTION_DELAY_MS |
|------------------|---------|--------------------------------|
| HLS (current setup) | ~10-30 seconds | **-15000** (start here) |
| WebRTC | ~0.5-2 seconds | **-1000** |
| Direct RTSP | ~0.2-0.5 seconds | **0** or **-300** |

## Troubleshooting

### Detections Still Ahead of Video
- Make the value **MORE NEGATIVE** (larger negative number)
- Example: `-10000` → `-15000` → `-20000`

### Detections Now Behind Video
- Make the value **LESS NEGATIVE** (smaller negative number, closer to zero)
- Example: `-15000` → `-10000` → `-5000`

### Quick Formula
```
DETECTION_DELAY_MS = -(measured latency in milliseconds)

Example:
Video is 12 seconds behind → DETECTION_DELAY_MS = -12000
Video is 500ms behind → DETECTION_DELAY_MS = -500
```

### Detections Are Erratic/Jumpy
- Check that cameras are streaming properly: `make camera-status`
- Verify MQTT is running: `docker ps | grep mqtt`
- Check detection logs: `ls -la backend/python/object-detection-service/logs/`

## Advanced: Switch to Lower Latency Streaming

To eliminate the need for large delays, consider switching from HLS to WebRTC:

1. MediaMTX already supports WebRTC (port 8889)
2. Update `camera-viewer.html` to use WebRTC instead of HLS
3. Set `DETECTION_DELAY_MS=1000` (1 second) for WebRTC latency
4. This gives near real-time synchronization

## Technical Details

### Frame Timestamp Extraction
```python
# In stream_processor.py
stream_position_ms = self.cap.get(cv2.CAP_PROP_POS_MSEC)
frame_timestamp = stream_start_time + (stream_position_ms / 1000.0)
```

### Detection Timestamp Calculation
```python
# In detector.py
detection_timestamp = frame_timestamp or time.time()
detection_timestamp += settings.detection_delay_ms / 1000.0
```

This ensures detections use the same timeline as the video frames, with an adjustable offset for player buffering.

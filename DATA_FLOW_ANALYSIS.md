# Axis Guardian: Frontend Data Flow Analysis

## Executive Summary

The Axis Guardian system uses **multiple parallel communication channels** for sending data to the frontend:

1. **MQTT** (via Paho.js) - Real-time detection streams
2. **WebRTC Data Channels** - Frame-synchronized detection metadata
3. **Video Streaming** - HLS + WebRTC for low-latency video
4. **WebSocket** (Client library available but not actively used in code)
5. **Video Sync Monitoring** - MQTT feedback channel

**Total Data Streams**: 5+ channels (MQTT, WebRTC Data, HLS Video, Feedback)

---

## 1. MQTT Detection Streaming (PRIMARY CHANNEL)

### Connection Details

**File**: `/frontend/src/composables/useDetections.ts`

```typescript
// Lines 87: Connection Configuration
mqttClient = new Paho.MQTT.Client('localhost', 9001, clientId)

// Lines 128-130: Connection Options
keepAliveInterval: 60,
cleanSession: true,
useSSL: false
```

### Topic Structure

```
surveillance/detections/{camera_id}
surveillance/sync/{camera_id}/feedback
```

### Message Format & Size

**Detection Message** (from `/simulation/object-detection/src/mqtt_publisher.py`):

```python
message = {
    "camera_id": str,                          # ~10 bytes
    "timestamp": float,                        # 8 bytes
    "publish_timestamp": float,                # 8 bytes
    "detection_count": int,                    # 4 bytes
    "detections": [                            # VARIABLE (primary payload)
        {
            "bbox": {
                "x1": float,    # 8 bytes
                "y1": float,    # 8 bytes
                "x2": float,    # 8 bytes
                "y2": float,    # 8 bytes
                "width": float, # 8 bytes
                "height": float,# 8 bytes
                # VAPIX normalized coordinates (duplicates above)
                "left": float,  # 8 bytes
                "top": float,   # 8 bytes
                "right": float, # 8 bytes
                "bottom": float # 8 bytes
                # Total: 80 bytes per bbox (REDUNDANT: 4 coordinate formats!)
            },
            "confidence": float,        # 8 bytes
            "class_id": int,            # 4 bytes
            "class_name": str,          # ~10-20 bytes
            "timestamp": float,         # 8 bytes
            "video_pts_ms": float,      # 8 bytes
            "loop_count": int,          # 4 bytes
            "pts_based": bool           # 1 byte
            # Total per detection: ~170 bytes (with duplication)
        }
    ],
    "timing": {                        # METADATA DUPLICATION
        "frame_timestamp": float,      # 8 bytes (DUPLICATE of outer timestamp)
        "publish_timestamp": float,    # 8 bytes (DUPLICATE of outer timestamp)
        "processing_latency_ms": float,# 8 bytes
        "detection_delay_ms": int,     # 4 bytes (STATIC CONFIG)
        "video_pts_ms": float,         # 8 bytes (DUPLICATE from detection)
        "loop_count": int,             # 4 bytes (DUPLICATE from detection)
        "pts_based": bool              # 1 byte (DUPLICATE from detection)
        "use_video_pts": bool          # 1 byte (STATIC CONFIG)
        # Total: ~42 bytes (mostly duplicates)
    }
}
```

### Redundancy Issues Identified

| Field | Duplication | Impact |
|-------|------------|--------|
| `timestamp` | Appears 3 times (outer, timing.frame_timestamp, detection[].timestamp) | +16 bytes per message |
| `video_pts_ms` | Appears in detection[].timestamp AND timing.video_pts_ms | +8 bytes |
| `loop_count` | Appears in detection[] AND timing.loop_count | +4 bytes |
| `pts_based` | Appears in detection[] AND timing.pts_based | +1 byte |
| `detection_delay_ms` | Static config sent in every message | +4 bytes |
| `use_video_pts` | Static config sent in every message | +1 byte |
| Bounding box coordinates | 4 formats (x1/y1/x2/y2, width/height, left/top/right/bottom) | +40 bytes per detection |

**Example Payload with 3 detections**:
```
Base message: ~50 bytes
Timing metadata: ~42 bytes (mostly redundant)
3 detections × ~170 bytes: ~510 bytes
Total: ~602 bytes per message

With optimization:
Remove timing duplicates: -30 bytes (-5%)
Remove bbox duplication: -120 bytes (-20%)
Remove static configs: -5 bytes (-1%)
Optimized: ~447 bytes (-25%)
```

### Update Frequency

**File**: `/simulation/object-detection/src/stream_processor.py`

- **Rate**: Every frame processed (30 FPS typical)
- **Per camera**: 30 messages/sec
- **Multi-camera (3 cameras)**: 90 messages/sec
- **Bandwidth**: ~602 bytes × 90 msgs = **54 KB/sec** per camera setup
- **With optimization**: ~447 bytes × 90 msgs = **40 KB/sec** (-25%)

---

## 2. WebRTC Data Channel (PARALLEL CHANNEL)

### Connection Details

**File**: `/frontend/src/composables/useWebRTCDetection.ts`

```typescript
// Line 172: Data channel creation
const channel = pc.createDataChannel('detections')

// Lines 298-348: Receiving via data channel
channel.onmessage = (event) => {
    const metadata: DetectionMetadata = JSON.parse(event.data)
    // ...processing
}
```

### Data Format

```typescript
interface DetectionMetadata {
    camera_id: string,           # ~10 bytes
    frame_number: number,        # 4 bytes
    timestamp: number,           # 8 bytes
    detection_count: number,     # 4 bytes
    detections: Detection[],     # VARIABLE
    detection_frame?: number     # 4 bytes (optional)
}
```

### Update Frequency & Latency

**File**: `/frontend/src/composables/useWebRTCDetection.ts` lines 298-349

```typescript
// Quality monitoring every 2 seconds
statsMonitorInterval = window.setInterval(async () => {
    const stats = await peerConnection.value.getStats()
    // Track latency, packet loss, bitrate
}, 2000)
```

**Stats tracked**:
- `latencyMs`: Message arrival latency
- `framesReceived`: Running count
- `detectionsReceived`: Running count
- `avgDetectionsPerFrame`: Computed average
- `droppedStaleDetections`: Frames older than 5 frames discarded
- `connectionQuality`: Bitrate, jitter, RTT, packet loss

### Synchronization Mechanism

**Stale detection filtering** (lines 424-431):
```typescript
const maxFrameAge = 5  // Maximum frames old before discarding

function processBufferedDetection(metadata: DetectionMetadata) {
    const frameDiff = metadata.frame_number - currentFrame
    if (frameDiff < -maxFrameAge) {
        stats.value.droppedStaleDetections++
        return  // DISCARD
    }
}
```

**Latency compensation** (lines 401-405):
```typescript
// Sync with video playback using RTT
const syncDelay = Math.min(
    connectionQuality.value.roundTripTime / 2, 
    50  // Max 50ms delay
)
setTimeout(() => processBufferedDetection(metadata), syncDelay)
```

---

## 3. HLS Video Streaming + Latency Monitoring

### Video Sync Monitoring

**File**: `/frontend/src/composables/useVideoSync.ts`

```typescript
// Lines 198-247: Polling every 2 seconds
const intervalId = window.setInterval(() => {
    const { latency_ms, quality } = calculateHLSLatency(video, hls, cameraId)
    
    // Build feedback
    const feedback: SyncFeedback = {
        camera_id: string,
        video_playback_time_s: number,    # 8 bytes
        video_pts_ms: number,             # 8 bytes
        wall_clock_time: number,          # 8 bytes
        hls_latency_ms: number,           # 8 bytes
        loop_count: number,               # 4 bytes
        suggested_offset_ms: number,      # 8 bytes
        measurement_quality: string       # ~10 bytes
    }
    publishFeedback(feedback)
}, 2000)  // Every 2 seconds per camera
```

**Feedback Message Size**: ~62 bytes per camera every 2 seconds
**Rate with 3 cameras**: 3 × 0.5 msgs/sec = 1.5 msgs/sec
**Bandwidth**: ~93 bytes/sec (negligible)

### Video Quality Metrics Collected (but not sent)

**In-memory stats** (lines 65-72):
```typescript
stats.value = {
    framesReceived: 0,
    detectionsReceived: 0,
    avgDetectionsPerFrame: 0,
    lastUpdateTime: 0,
    droppedStaleDetections: 0,
    latencyMs: 0  // WebRTC data channel latency
}
```

---

## 4. WebSocket Client (Generated but Unused)

### Available Clients

**Files**: 
- `/frontend/src/api/websocket/detection.ts` - DetectionWebSocketClient
- `/frontend/src/api/websocket/camera-status.ts` - CameraStatusWebSocketClient  
- `/frontend/src/api/websocket/alarm.ts` - AlarmWebSocketClient

### Connection Configuration

```typescript
// DetectionWebSocketClient
host: 'localhost:3007'  // Default
secure: false
autoReconnect: true (5 second interval)
maxReconnectAttempts: 0 (unlimited)

// CameraStatusWebSocketClient
host: 'localhost:3002'

// AlarmWebSocketClient
host: 'localhost:3001'
```

### Event Types

```typescript
DetectionWebSocketClient:
  - 'detection.new': any
  - 'track.update': any

CameraStatusWebSocketClient:
  - 'camera.status': any

AlarmWebSocketClient:
  - 'alarm.new': any
  - 'alarm.acknowledged': any
  - 'alarm.resolved': any
```

**Status**: These clients are **DEFINED but NOT INSTANTIATED** in any active code. They appear to be auto-generated from AsyncAPI specs and available for future use.

---

## 5. Detection Message Type Definition

### Detection Type Structure

**File**: `/frontend/src/types/detection.types.ts`

```typescript
interface Detection {
    class_name: string      # Object class (e.g., "person", "car")
    confidence: number      # 0.0-1.0
    timestamp: number       # Unix timestamp (ms)
    bbox: BoundingBox       # Coordinates
}

interface BoundingBox {
    x1: number      # Top-left X
    y1: number      # Top-left Y
    width: number   # Box width
    height: number  # Box height
}

interface DetectionMessage {
    camera_id: string
    timestamp: number
    detection_count: number
    detections: Detection[]
}
```

**Actual backend format** includes DUPLICATED fields:
- BoundingBox has 6 formats (x1/y1/x2/y2, width/height, left/top/right/bottom)
- Message has timing object duplicating detection timestamps
- Config values sent with every message

---

## 6. Polling & Update Frequencies

### Active Polling Mechanisms

| Mechanism | Interval | Source | Purpose |
|-----------|----------|--------|---------|
| WebRTC Quality Stats | 2 sec | useWebRTCDetection.ts:298 | Monitor latency, packet loss |
| Video Sync Feedback | 2 sec | useVideoSync.ts:199 | HLS latency measurement |
| MQTT Keep-Alive | 60 sec | useDetections.ts:128 | Connection keepalive |
| **Event-Driven** | Real-time | MQTT publish_detections | Detection updates (~30 FPS) |

### High-Frequency Updates

**Detection Updates** (Frame synchronized):
- Frequency: 30 FPS (every 33ms)
- Channels: MQTT + WebRTC Data Channel (PARALLEL - both active simultaneously)
- Payload per detection: ~170 bytes (with redundancy)
- Total: 3 cameras × 30 FPS × 170 bytes = **15.3 KB/sec minimum**

---

## 7. Identified Inefficiencies

### Critical Issues

#### 1. **Duplicate Data in MQTT Messages** (High Impact)

**Problem**: Same data sent in 3-4 places within single message

```
timing.frame_timestamp = detection.timestamp = message.timestamp
timing.video_pts_ms = detection.video_pts_ms  
timing.loop_count = detection.loop_count
timing.detection_delay_ms = static config (sent every message)
timing.use_video_pts = static config (sent every message)
```

**Impact**: +50 bytes per message
**Frequency**: 90 messages/sec (3 cameras × 30 FPS)
**Wasted Bandwidth**: 4.5 KB/sec

**Recommendation**: Remove timing object, keep single timestamp at root level

#### 2. **Bounding Box Coordinate Duplication** (Medium Impact)

**Problem**: 4 coordinate formats in single detection

```
x1, y1, x2, y2 (pixel coordinates)
width, height (derived from above)
left, top, right, bottom (normalized 0-1, derived from above)
```

**Impact**: ~40 extra bytes per detection
**With typical 3 detections/frame**: 120 bytes wasted per frame
**Frequency**: 90 frames/sec
**Wasted Bandwidth**: 10.8 KB/sec

**Recommendation**: Send only one format (normalized left/top/right/bottom), compute pixel coords on frontend

#### 3. **Parallel MQTT + WebRTC Streams** (Medium Impact)

**Problem**: Same detection data sent via BOTH channels simultaneously

- **MQTT**: Full detection message with metadata
- **WebRTC Data Channel**: Same detections + metadata

**Impact**: 100% data duplication for clients using WebRTC
**Affected Bandwidth**: ~15+ KB/sec duplicated

**Recommendation**: Use EITHER MQTT OR WebRTC Data Channel, not both

#### 4. **Static Config in Every Message** (Low Impact)

**Problem**: 
- `detection_delay_ms` (static config)
- `use_video_pts` (static config)

Sent with every frame (30 FPS)

**Impact**: ~5 bytes per message × 90 msg/sec = 450 bytes/sec
**Recommendation**: Send config once at connection, update only on change

#### 5. **Video Sync Feedback Loop** (Low Impact)

**Problem**: Publishing sync feedback every 2 seconds (3 cameras = 1.5 msg/sec)

**Message contents**:
```
{
    camera_id,
    video_playback_time_s,
    video_pts_ms,
    wall_clock_time,
    hls_latency_ms,
    loop_count,
    suggested_offset_ms,
    measurement_quality
}
```

**Issue**: Many fields are informational/monitoring only, not action-oriented

**Recommendation**: Send only delta changes (when quality changes or latency threshold exceeded)

---

## 8. Data Size Summary

### Current Bandwidth Usage

**Per Single Camera (with 3 detections/frame)**:

| Channel | Payload | Frequency | Bandwidth |
|---------|---------|-----------|-----------|
| MQTT Detection | 602 bytes | 30 fps | 18.1 KB/sec |
| WebRTC Data Channel | 450 bytes | 30 fps | 13.5 KB/sec |
| Video Sync Feedback | 62 bytes | 0.5 fps | 31 B/sec |
| MQTT Keep-Alive | varies | 1/60 sec | negligible |
| **Total** | - | - | **~32 KB/sec/camera** |

**With 3 Cameras**:
- **Raw MQTT**: 54 KB/sec
- **Raw WebRTC**: 40.5 KB/sec
- **Total**: **94.5 KB/sec** (if both active)

### Optimization Potential

| Optimization | Savings | Priority |
|--------------|---------|----------|
| Remove timing object duplication | 4.5 KB/sec | HIGH |
| Single bbox coordinate format | 10.8 KB/sec | HIGH |
| Choose MQTT OR WebRTC (not both) | 47-50 KB/sec | CRITICAL |
| Remove static config per message | 450 B/sec | LOW |
| Conditional sync feedback | ~30 B/sec | LOW |
| **Total Possible Reduction** | **~62 KB/sec** | **65%** |

---

## 9. Message Format Issues

### Current Issues

1. **Type Mismatch**: Frontend Detection type doesn't match backend format
   - Frontend expects: `{class_name, confidence, timestamp, bbox}`
   - Backend sends: ~170 bytes with 4 bbox formats + timing metadata

2. **No Field Validation**: Frontend accepts any JSON from MQTT
   - No schema validation
   - No field presence checking

3. **Timing Metadata Confusion**:
   - `timing.detection_delay_ms`: Static config (shouldn't change per message)
   - `timing.processing_latency_ms`: Computed metric (changes every frame)
   - Mixed concerns in one object

---

## 10. Recommended Optimizations

### Phase 1: Quick Wins (5-15% reduction)

1. **Remove timing object**
   - Move `processing_latency_ms` to root level if needed
   - Keep single `timestamp` field
   - Remove static config fields

2. **Batch small updates**
   - If no detections in frame, send heartbeat less frequently
   - Or skip message entirely (consumer will handle no-update)

### Phase 2: Medium Impact (20-30% reduction)

3. **Single bbox format**
   - Send normalized coordinates (left/top/right/bottom) only
   - Calculate pixel coords on frontend if needed (cached)

4. **Choose MQTT OR WebRTC**
   - For low-latency: Use WebRTC Data Channel only
   - For reliability: Use MQTT only
   - Don't duplicate data across both

### Phase 3: Architecture (60%+ reduction)

5. **Differential updates**
   - Send only changed objects between frames
   - Send detection class counts instead of full object lists in some cases
   - Track frame deltas

6. **Decouple video from metadata**
   - HLS for video streaming (independent)
   - Minimal metadata via efficient channel (binary protobuf, msgpack)

---

## 11. Frontend Performance

### Current Status

**File**: `FRONTEND_OPTIMIZATION.md` (October 25)

✅ **Already Optimized**:
- Removed per-frame console logging (90 logs/sec → 0)
- Throttled debug overlay updates (90 updates/sec → 30, 10 Hz per camera)
- 67% reduction in Vue re-renders

**Still Processing**:
- All 30 FPS detection updates processed in real-time
- Canvas drawing at full frame rate
- Stats collection at 2-second intervals

### Canvas Rendering

Detection data updates at 30 FPS for smooth canvas drawing:
```typescript
cameraDetections[camera.id] = metadata.detections  // Unthrottled
```

This is correct - detection drawing should be real-time.

---

## Summary: Data Flow Overview

```
Backend (Python)
├── YOLO Detection (30 FPS/camera)
│   └── ObjectDetector.detect()
│       └── Returns 170 bytes/detection with 4 bbox formats + timing metadata
│
├── MQTT Publishing (90 msg/sec with 3 cameras)
│   ├── detection/camera1, detection/camera2, detection/camera3
│   └── Includes: timing object (redundant), static configs per message
│
├── WebRTC Data Channel (parallel, same data)
│   └── Also 90 msg/sec (DUPLICATES MQTT)
│
└── Sync Feedback (every 2 sec/camera)
    └── surveillance/sync/{camera_id}/feedback

Frontend (Vue.js)
├── MQTT Consumer (useDetections.ts)
│   └── Subscribes: surveillance/detections/{camera_id}
│   └── Processes: Full message with redundant fields
│
├── WebRTC Consumer (useWebRTCDetection.ts)
│   ├── Receives via data channel
│   ├── Filters stale frames (>5 frames old)
│   ├── Syncs with video playback (RTT/2 delay)
│   └── Monitors connection quality (2 sec interval)
│
└── Video Sync Monitor (useVideoSync.ts)
    ├── Measures HLS latency (2 sec interval)
    └── Publishes feedback to surveillance/sync/{camera_id}/feedback

Result: 94.5 KB/sec bandwidth with multiple redundancies
        (could optimize to ~30-35 KB/sec, 65% reduction)
```


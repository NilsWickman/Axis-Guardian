# Advanced Tracking Pipeline - 2025-12-02

## Overview

Major upgrade to the tracking system: moved from client-side position tracking to server-side tracking with Kalman filtering, Hungarian algorithm assignment, and lens distortion correction. The frontend now receives real-time track updates via WebSocket.

## Architecture Change

### Before
```
Camera Emulator → Tracking Service → REST API → Frontend (client-side tracking)
                                                    ↓
                                            usePersonPositionTracking
                                                    ↓
                                            Local track correlation
```

### After
```
Camera Emulator → Tracking Service → WebSocket → Frontend (display only)
                       ↓
                 Kalman Filter
                       ↓
                 Hungarian Assignment
                       ↓
                 Global Tracks
```

The frontend is now a thin client that displays server-computed tracks.

## New Components

### 1. WebSocket Client (`useTrackingServiceWebSocket.ts`)

Vue composable for real-time track updates:

```typescript
const trackingWs = useTrackingServiceWebSocket({
  autoReconnect: true,
  reconnectIntervalMs: 3000,
})

trackingWs.connect()  // Connect on mount
trackingWs.disconnect()  // Disconnect on unmount
```

**Message Types:**
| Type | Description |
|------|-------------|
| `snapshot` | Initial state - bulk replace all tracks |
| `track_created` | New track appeared |
| `track_updated` | Position/state update |
| `track_expired` | Track removed |

**Configuration:**
- URL: `ws://localhost:3010/ws` (via `VITE_TRACKING_WS_URL`)
- Auto-reconnect with max 10 attempts

### 2. Kalman Filter (`kalman-track-filter.ts`)

4-state filter for position and velocity estimation:

```
State vector: [x, y, vx, vy]
Observation:  [x, y]
```

**Benefits:**
- Smooths noisy position measurements
- Estimates velocity for prediction
- Adaptive gating based on uncertainty

**Configuration (tuned for pedestrians):**

See `src/config/algorithm-constants.ts` for current values:
```typescript
ALGORITHM_CONSTANTS.kalman = {
  processNoise: 1.0,              // Velocity process noise (m/s)²
  measurementNoise: 0.25,         // Position variance (m²)
  initialPositionUncertainty: 1,  // Initial position σ (m)
  initialVelocityUncertainty: 1,  // Initial velocity σ (m/s)
  maxCacheSize: 500,              // State cache limit
}
```

**Usage in TrackManager:**
```typescript
// Initialize on track creation
const kalmanState = this.kalmanFilter.initialize(position, timestamp)

// Update with new measurement
track.kalmanState = this.kalmanFilter.update(
  track.kalmanState,
  mergedPosition,
  now,
  track.globalTrackId
)

// Predict future position
const predicted = this.kalmanFilter.predict(track.kalmanState, deltaMs)
```

### 3. Hungarian Algorithm (`hungarian-assignment.ts`)

Optimal detection-to-track assignment using Munkres algorithm:

**Before (Greedy):**
- Each detection picks closest available track
- Order-dependent, can cause suboptimal assignments
- O(n²) worst case

**After (Hungarian):**
- Builds cost matrix for all detection-track pairs
- Finds globally optimal assignment
- Minimizes total assignment cost

**Cost Matrix Construction:**
```typescript
cost = distance(detection, track.predictedPosition)

// Apply association bonus for existing camera-track pairs
if (track.cameraAssociations.has(cameraId)) {
  cost *= ALGORITHM_CONSTANTS.assignment.associationBonus  // Strong binding
}
```

**Configuration:** See `src/config/algorithm-constants.ts` for all assignment parameters including maxCost, sameCameraPenalty, velocityConsistencyWeight, embeddingWeight, etc.

**Usage:**
```typescript
const { matches, unmatchedDetections } = assignDetectionsToTracks(
  detections,
  activeTracks,
  { maxCost: ALGORITHM_CONSTANTS.assignment.maxCost, useKalmanPrediction: true }
)
```

### 4. Lens Distortion Correction (`lens-distortion.ts`)

Brown-Conrady distortion model for barrel/pincushion correction:

```
x_corrected = x * (1 + k1*r² + k2*r⁴ + k3*r⁶) + 2*p1*x*y + p2*(r² + 2*x²)
y_corrected = y * (1 + k1*r² + k2*r⁴ + k3*r⁶) + p1*(r² + 2*y²) + 2*p2*x*y
```

**Coefficients:**
| Parameter | Description |
|-----------|-------------|
| k1, k2, k3 | Radial distortion |
| p1, p2 | Tangential distortion |

**Integration:**
Applied in `projectDetectionWithKRT()` before K/R/T projection if distortion coefficients are present.

### 5. Additional Camera Calibration

Added estimated calibration for cameras 3 and 4 (IP2, IP5):

```typescript
'camera3': {  // IP2
  // Position: (20.60, 28.31, 2.62), Azimuth: 140°, Elevation: -9°
  K: estimateIntrinsicMatrix(60),  // Assumed 60° FOV
  R: buildRotationMatrix(140, -9),
  T: [20.60, 28.31, 2.62],
}
```

**Helper Functions:**
- `buildRotationMatrix(azimuth, elevation)` - Construct R from angles
- `estimateIntrinsicMatrix(fov, width, height)` - Estimate K from FOV

## Pinia Store Updates (`globalTracks.ts`)

New server sync methods:

```typescript
// Replace all tracks from snapshot
setTracksFromServer(serverTracks: unknown[]): void

// Insert or update single track
upsertTrackFromServer(serverTrack: unknown): void

// Remove expired track
removeTrack(trackId: string): void
```

**JSON → Map Conversion:**
Server sends `cameraAssociations` as object; frontend uses Map:
```typescript
function convertServerTrack(json: GlobalTrackJSON): GlobalTrack {
  return {
    ...json,
    cameraAssociations: new Map(Object.entries(json.cameraAssociations)),
  }
}
```

## Type Changes (`types.ts`)

### New: DistortionCoeffs
```typescript
interface DistortionCoeffs {
  k1: number  // Radial 1
  k2: number  // Radial 2
  k3: number  // Radial 3
  p1: number  // Tangential 1
  p2: number  // Tangential 2
}
```

### New: KalmanState
```typescript
interface KalmanState {
  mean: number[][]        // [[x], [y], [vx], [vy]]
  covariance: number[][]  // 4x4 matrix
  lastTimestamp: number   // ms
}
```

### Updated: GlobalTrack
```typescript
interface GlobalTrack {
  // ... existing fields
  kalmanState?: KalmanState  // NEW: motion estimation state
}
```

### Updated: CameraCalibration
```typescript
interface CameraCalibration {
  // ... existing K, R, T, center, scale
  distortion?: DistortionCoeffs  // NEW: optional lens correction
}
```

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `kalman-filter` | ^2.3.0 | Kalman filter implementation |
| `ml-matrix` | ^6.12.1 | Matrix operations |
| `munkres` | ^2.0.4 | Hungarian algorithm |

## Detection Processing Flow

```
1. DetectionProcessor receives frame of detections
2. Filter for person class with confidence > threshold
3. Project each bbox foot-point to world coordinates:
   a. Apply lens distortion correction (if coefficients present)
   b. Use K/R/T projection (or fallback to azimuth/elevation)
4. Batch all projected detections
5. TrackManager.processBatchDetections():
   a. Build cost matrix (Kalman predictions + association bonus)
   b. Run Hungarian algorithm
   c. Update matched tracks (Kalman filter update)
   d. Create new tracks for unmatched detections
6. Broadcast updates via WebSocket
```

## Configuration

### Environment (`frontend/src/config/environment.ts`)
```typescript
trackingServiceWsUrl: import.meta.env.VITE_TRACKING_WS_URL || 'ws://localhost:3010/ws'
```

### Tracking Config (`tracking-service/src/types.ts`)
```typescript
DEFAULT_TRACKING_CONFIG = {
  correlationDistanceM: 1.5,  // Max distance for track association
  mergeWindowMs: 200,         // Time window for multi-camera merge
  trackExpiryMs: 5000,        // Inactive track timeout
  maxTrailLength: 20,         // Position history length
  minDetectionsToConfirm: 3,  // Detections before track is confirmed
  maxVelocityMs: 10,          // Max plausible speed (m/s)
}
```

## Files Modified

### Frontend
| File | Changes |
|------|---------|
| `src/config/environment.ts` | Added `trackingServiceWsUrl` |
| `src/stores/globalTracks.ts` | Added server sync methods |
| `src/views/site-tracking/SiteTrackingView.vue` | Replaced `usePersonPositionTracking` with `useTrackingServiceWebSocket` |

### Frontend (New)
| File | Purpose |
|------|---------|
| `src/composables/useTrackingServiceWebSocket.ts` | WebSocket client for track updates |

### Tracking Service
| File | Changes |
|------|---------|
| `src/types.ts` | Added `DistortionCoeffs`, `KalmanState`; updated `GlobalTrack`, `CameraCalibration` |
| `src/detection/camera-registry.ts` | Added camera3/4 calibration, rotation/intrinsic helpers |
| `src/detection/detection-processor.ts` | Batch processing with Hungarian assignment |
| `src/projection/ground-plane.ts` | Integrated lens distortion correction |
| `src/tracks/track-manager.ts` | Kalman filter integration, `processBatchDetections()` |
| `package.json` | New dependencies |

### Tracking Service (New)
| File | Purpose |
|------|---------|
| `src/filters/kalman-track-filter.ts` | Kalman filter wrapper |
| `src/correlation/hungarian-assignment.ts` | Optimal assignment algorithm |
| `src/projection/lens-distortion.ts` | Brown-Conrady distortion model |

## Performance Comparison

| Metric | Greedy | Hungarian |
|--------|--------|-----------|
| Assignment quality | Local optimum | Global optimum |
| Multi-target handling | Can swap tracks | Stable assignments |
| Complexity | O(n²) | O(n³) but n is small |

| Metric | Without Kalman | With Kalman |
|--------|----------------|-------------|
| Position jitter | High | Smoothed |
| Velocity estimation | None | Yes |
| Prediction accuracy | Linear extrapolation | Motion model |
| Gating | Fixed threshold | Adaptive |

## Next Steps

1. Add WebSocket broadcast in tracking service for track events
2. Test multi-camera correlation with all 4 cameras
3. Tune Kalman filter parameters based on real tracking data
4. Add distortion coefficients for IP2/IP5 if calibration available

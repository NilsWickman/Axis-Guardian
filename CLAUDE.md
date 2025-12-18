# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Axis-Guardian is a multi-camera person tracking system with real-time surveillance visualization. It consists of:

- **Frontend** - Vue 3 + TypeScript surveillance UI with WebRTC video streaming
- **Tracking Service** - Node.js/Fastify backend with Kalman filtering and Hungarian algorithm for track correlation
- **Camera Emulator** - Simulates camera input using pre-recorded video and detection data via mediasoup WebRTC

## Commands

### Frontend (`cd frontend`)
```bash
pnpm dev          # Vite dev server (port 5173)
pnpm build        # Type-check + production build
pnpm type-check   # Vue TSC validation
pnpm lint         # ESLint with auto-fix
pnpm test         # Vitest unit tests
pnpm storybook    # Component library (port 6006)
```

### Tracking Service (`cd tracking-service`)
```bash
pnpm dev          # tsx watch development (port 3010)
pnpm build        # TypeScript compilation
pnpm test         # Vitest tests
pnpm db:migrate   # Database migration
pnpm db:reset     # Drop and reseed database
pnpm cli:inject   # Inject test detections
pnpm cli:simulate # Simulate person walk
pnpm cli:replay   # Replay detection frames
pnpm cli:query    # Query active tracks (--watch for live)
pnpm cli:visualize    # Single frame SVG visualization
pnpm cli:batch-visualize  # Batch visualization with HTML report
pnpm cli:sitemap  # Terminal ASCII sitemap (--watch for live)
```

### Camera Emulator (`cd camera-emulator`)
```bash
pnpm dev          # tsx watch development (ports 9101-9102)
pnpm build        # TypeScript compilation
```

## Architecture

### Data Flow
```
Camera Emulator → Tracking Service → Frontend
     (detections)    (process/track)   (visualize)
```

Detections flow: Camera Emulator posts to `/api/emulator-detections` → DetectionProcessor → ProjectionModule (K/R/T matrices) → TrackManager (Hungarian assignment + Kalman filter) → WebSocket broadcast → Frontend stores

### Tracking Pipeline
1. **Ground-Plane Projection** - K/R/T camera matrices with Brown-Conrady lens distortion correction
2. **Hungarian Algorithm** - Optimal detection-to-track assignment (not greedy)
3. **Kalman Filter** - 4-state [x, y, vx, vy] for position smoothing
4. **Track Lifecycle** - Unconfirmed (needs 3+ detections) → Confirmed → Expired (5s timeout)

### Key Directories

**Tracking Service Core:**
- `tracks/` - TrackManager - global track lifecycle
- `detection/` - DetectionProcessor, CameraRegistry
- `correlation/` - Hungarian assignment algorithm
- `filters/` - Kalman filtering
- `projection/` - Ground-plane projection with K/R/T matrices

**Frontend Core:**
- `stores/` - Pinia state (globalTracks, cameras)
- `composables/` - WebSocket and connection management
- `api/` - API clients and WebSocket implementations

### Configuration

Single source of truth: `frontend/public/sitemap-rectangular-room.json` - defines camera positions, orientations, FOV. Loaded by both frontend and tracking service.

Gold Standard.json defines annotated tracks for frames - giving  ground positions on the site map based on bounding boxes.

### Algorithm Tuning Constants

All algorithm tuning parameters are centralized in `tracking-service/src/config/algorithm-constants.ts`. This is the single source of truth for:

| Group | Purpose | Key Parameters |
|-------|---------|----------------|
| `detection` | Detection pipeline | minConfidence, imageWidth, imageHeight |
| `assignment` | Hungarian algorithm | maxCost, associationBonus, sameCameraPenalty, embeddingWeight |
| `trackLifecycle` | Track management | correlationDistanceM, trackExpiryMs, maxVelocityMs, maxTracks |
| `exclusionZone` | Duplicate prevention | confirmedExclusionRadius, crossCameraExclusionRadius |
| `trackMerger` | Track merging | mergeDistanceM, mergeConfidenceThreshold, velocityThreshold |
| `occlusion` | Occlusion handling | occlusionCoastTimeMs, coastingDampingFactor, missedFramesBeforeOcclusion |
| `stitching` | Track stitching | maxGapMs, maxDistanceMultiplier |
| `reid` | Re-identification | minSimilarity, sameCameraBonus, maxTrackAgeMs |
| `kalman` | Kalman filter | processNoise, measurementNoise |
| `positionMerging` | Multi-camera fusion | divergenceThreshold, camera weights |

Module-specific configs (e.g., `DEFAULT_ASSIGNMENT_CONFIG` in hungarian-assignment.ts) derive from these central constants. To tune algorithm behavior, modify values in `algorithm-constants.ts`.

## Headless Development Workflow

For developers without frontend access, the tracking service provides CLI tools for full iteration:

### Quick Start (No Frontend Required)
```bash
# Terminal 1: Start tracking service
cd tracking-service && pnpm cli:start --sitemap ../frontend/public/sitemap-rectangular-room.json

# Terminal 2: Monitor tracks in real-time (ASCII visualization)
pnpm cli:sitemap --watch --trails

# Terminal 3: Replay detection data
pnpm cli:replay -f ../shared/cameras/preprocessed/1080p/view-HC3-reid.detections.json.gz -c camera1
```

### Visualization Tools

| Command | Purpose |
|---------|---------|
| `pnpm cli:sitemap --watch` | Live ASCII sitemap in terminal |
| `pnpm cli:query --watch` | Live track table with positions |
| `pnpm cli:visualize --frame N` | Generate SVG + HTML for single frame |
| `pnpm cli:batch-visualize` | Generate report for all ground truth frames |

### Ground Truth Validation
```bash
# Run projection accuracy tests against GroundTruths.json
pnpm test tests/integration/ground-truth-validation.test.ts

# Generate batch report with all frames
pnpm cli:batch-visualize --output ./report --markdown
# Open ./report/index.html for visual inspection
```

### Calibration Iteration Loop
1. Modify calibration in sitemap or K/R/T matrices
2. Run `pnpm test tests/integration/projection-accuracy.test.ts`
3. Generate visualization: `pnpm cli:batch-visualize`
4. Check pass rate and average error in report
5. Repeat until metrics improve

## Tech Stack

- **Frontend:** Vue 3, Vite, Pinia, Tailwind CSS, Three.js, mediasoup-client
- **Tracking Service:** Fastify, SQLite/Drizzle ORM, kalman-filter, munkres (Hungarian)
- **Camera Emulator:** Fastify, mediasoup, FFmpeg, msgpack-lite
- **Package Manager:** pnpm 10.23.0

## Re-ID System

The tracking service uses re-identification (ReID) embeddings for improved cross-camera person tracking. Embedding similarity is incorporated into the Hungarian assignment cost matrix to improve track continuity and reduce ID switches.

### Detection Files

Detection files in `shared/cameras/preprocessed/1080p/` contain 512-dimensional OSNet embeddings and clothing color attributes:

- `view-HC3-reid.detections.json.gz` - Camera 1 detections with ReID embeddings
- `view-HC4-reid.detections.json.gz` - Camera 2 detections with ReID embeddings

### CLI Replay

```bash
pnpm cli:replay -f ../shared/cameras/preprocessed/1080p/view-HC3-reid.detections.json.gz -c camera1
```

### ReID Metrics

The tracking service exposes re-ID metrics via the `/api/metrics` endpoint:
- `reid.reidMatchAttempts` - Re-ID match attempts
- `reid.reidMatchSuccessRate` - Re-ID match success rate
- `reid.avgMatchSimilarity` - Average embedding similarity for matches
- `reid.similarityDistribution` - Similarity histogram (veryLow, low, medium, high, veryHigh)
- `reid.embeddingBonusApplied` / `embeddingPenaltyApplied` - Hungarian assignment adjustments

### Generating Embeddings

To generate ReID embeddings for new video files:

```bash
cd scripts/preprocessing

# Install torchreid (for OSNet model)
pip install torchreid

# Process video with embeddings
python yolo_reid_preprocessor.py \
  --input ../../shared/cameras/videos/view-HC3.mp4 \
  --output view-HC3-reid.detections.json \
  --enable-reid \
  --enable-colors
```

## Documentation

Detailed technical documentation in `/tech-logs/`:
- `advanced-tracking-pipeline.md` - Kalman, Hungarian, calibration
- `krt-calibration-projection.md` - K/R/T projection math
- `tracking-integration.md` - API endpoints

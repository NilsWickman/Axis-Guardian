# Tracking Service

Backend service for multi-camera person tracking with Kalman filtering and Hungarian algorithm for optimal track assignment.

## Quick Start

```bash
pnpm install
pnpm dev  # Starts on port 3010
```

## CLI Tools

The tracking service includes comprehensive CLI tools for development and debugging without requiring the frontend.

### Core Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Compile TypeScript |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Generate coverage report |

### Development CLI Tools

#### Data Injection & Simulation

```bash
# Inject a detection with bounding box
pnpm cli:inject --camera camera1 --bbox "0.4,0.3,0.2,0.4" --confidence 0.9

# Inject a world position directly
pnpm cli:inject --camera camera1 --world "5.2,3.8"

# Simulate a person walking from point A to B
pnpm cli:simulate --from "0,0" --to "10,10" --speed 1.4 --rate 10

# Replay preprocessed detection file
pnpm cli:replay -f ../shared/cameras/preprocessed/1080p/view-HC3-preprocessed.detections.json -c camera1 --speed 2.0
```

#### Monitoring & Visualization

```bash
# Query active tracks (table format)
pnpm cli:query

# Live track monitoring
pnpm cli:query --watch

# ASCII sitemap in terminal (single frame)
pnpm cli:sitemap

# Live ASCII sitemap with track trails
pnpm cli:sitemap --watch --trails --all
```

#### Frame Visualization (SVG/HTML)

```bash
# Generate visualization for a single frame
pnpm cli:visualize --frame 11
# Output: ./visualization-output/frame-11-{timestamp}/
#   - sitemap.svg     (room with cameras, ground truths, projections)
#   - camera1-bboxes.svg (detection overlays)
#   - camera2-bboxes.svg
#   - report.json     (numeric metrics)
#   - index.html      (interactive viewer)

# Batch visualization for all ground truth frames
pnpm cli:batch-visualize
# Output: ./visualization-output/batch/
#   - index.html      (summary dashboard)
#   - results.json    (all frame data)
#   - report.md       (markdown summary, with --markdown flag)
```

### Headless Development Workflow

For developers without frontend access:

```bash
# Terminal 1: Start service with sitemap
pnpm cli:start --sitemap ../frontend/public/sitemap-rectangular-room.json

# Terminal 2: Live ASCII visualization
pnpm cli:sitemap --watch --trails

# Terminal 3: Replay detection data
pnpm cli:replay -f ../shared/cameras/preprocessed/1080p/view-HC3-preprocessed.detections.json -c camera1

# Terminal 4: Monitor track state
pnpm cli:query --watch
```

### Ground Truth Validation

The service uses `GroundTruths.json` for calibration validation:

```bash
# Run ground truth validation tests
pnpm test tests/integration/ground-truth-validation.test.ts

# Generate batch report
pnpm cli:batch-visualize --output ./report --markdown

# Check results
open ./report/index.html
```

## Architecture

### Tracking Pipeline

1. **Detection Input** - Bounding boxes from cameras via REST API
2. **Ground-Plane Projection** - K/R/T matrices with lens distortion correction
3. **Hungarian Assignment** - Optimal detection-to-track matching
4. **Kalman Filtering** - 4-state position/velocity smoothing
5. **Track Lifecycle** - Unconfirmed → Confirmed → Expired

### Key Modules

```
src/
├── api/           # REST endpoints
├── cli/           # CLI tools
│   ├── inject-detection.ts
│   ├── query-tracks.ts
│   ├── simulate-walk.ts
│   ├── replay-detections.ts
│   ├── capture-frame-visualization.ts
│   ├── batch-visualize.ts
│   └── terminal-sitemap.ts
├── correlation/   # Hungarian algorithm
├── detection/     # DetectionProcessor, CameraRegistry
├── filters/       # Kalman filtering
├── projection/    # Ground-plane projection
└── tracks/        # TrackManager
```

## API Endpoints

### Tracks

- `GET /api/tracks` - Confirmed tracks
- `GET /api/tracks/all` - All tracks (including unconfirmed)
- `GET /api/tracks/:id` - Specific track details
- `GET /api/stats` - Track statistics

### Detections

- `POST /api/emulator-detections` - Process detection batch
- `POST /api/world-position` - Direct world position input

### Configuration

- `GET /api/config/sitemap` - Current sitemap configuration
- `GET /api/cameras` - Registered cameras

## Testing

```bash
pnpm test                           # All tests
pnpm test tests/integration/        # Integration tests only
pnpm test:coverage                  # With coverage report
```

### Test Suites

- `ground-truth-validation.test.ts` - Projection accuracy against annotations
- `projection-accuracy.test.ts` - K/R/T projection validation
- `track-manager.test.ts` - Track lifecycle and merging
- `hungarian-assignment.test.ts` - Optimal assignment algorithm
- `kalman-track-filter.test.ts` - Kalman filter behavior

## Configuration

Camera configuration loaded from sitemap JSON:
- `frontend/public/sitemap-rectangular-room.json`

Ground truth annotations:
- `GroundTruths.json` (project root)

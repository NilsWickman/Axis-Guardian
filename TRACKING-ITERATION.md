# Tracking Algorithm Iteration Plan

This document outlines a parallel development strategy for improving the multi-camera person tracking system using N-of-1 style iteration with 5 developers working on independent tracks.

## Ground Truth Dataset

**Source:** `cross-camera-ground-truth-1765228012881.json`

- **32 annotations** with manually verified ground positions
- **Room:** 18m x 12m
- **Cameras:**
  - `camera1` (HC3): position (16.22, 11.7), azimuth 197°, elevation 1°, FOV 66°
  - `camera2` (HC4): position (0.9, 11.5), azimuth 133°, elevation -5°, FOV 60°
- **Obstacles:** 4 pillars (radius 0.25m) at (6,3), (12,3), (6,9), (12,9) + 1 table at (14, 1.8)
- **Annotations include:**
  - Ground truth position in meters
  - Linked detections with bounding boxes (normalized 0-1)
  - Timestamps for temporal tracking evaluation
  - Many annotations link detections from BOTH cameras to the same world point

---

## Developer Assignments

### Developer 1: Projection/Calibration

**Focus:** Fix camera-to-ground projection (currently failing with `no_ground_intersection`)

**Key Files:**
- `tracking-service/src/projection/ground-plane.ts`
- `tracking-service/tests/projection/ground-plane.test.ts`
- `tracking-service/tests/integration/projection-accuracy.test.ts`

**Tasks:**
1. Debug why `groundIntersectionT: -1` (ray pointing away from floor)
2. Validate azimuth/elevation math and sign conventions
3. Check coordinate system consistency (Y-up vs Z-up, clockwise vs counter-clockwise azimuth)
4. Create projection accuracy evaluation using ground truth:
   ```
   For each annotation with linkedDetections:
     predicted = project(bbox, camera)
     error = distance(predicted, annotation.groundPosition)
   ```

**Deliverables:**
- [ ] Fix projection to produce valid ground intersections
- [ ] Projection error report (mean/median/p95 in meters)
- [ ] Document coordinate system conventions

**Success Criteria:** Mean projection error < 1.0m

---

### Developer 2: Cross-Camera Correlation

**Focus:** Validate and improve multi-camera position agreement

**Key Files:**
- `tracking-service/src/correlation/hungarian-assignment.ts`
- `tracking-service/src/tracks/track-manager.ts`

**Tasks:**
1. For annotations with 2+ linked detections at same timestamp:
   - Project each camera's bbox independently
   - Measure agreement between projected positions
2. Evaluate triangulation potential when both cameras see same person
3. Analyze correlation threshold sensitivity
4. Identify systematic biases (e.g., one camera consistently projects further)

**Test Annotations (both cameras linked):**
- `ann_1765227623952` - position (15, 2.39), tracks 229/483
- `ann_1765227658805` - position (12.69, 3.66), tracks 483/229
- `ann_1765227742242` - position (10.24, 6.03), tracks 229/483
- `ann_1765227967363` - position (10.70, 2.11), tracks 296/519

**Deliverables:**
- [ ] Cross-camera correlation report (% within 0.5m/1m/2m)
- [ ] Recommended assignment distance threshold
- [ ] Analysis of camera-specific biases

**Success Criteria:** >70% of dual-camera annotations agree within 1.0m

---

### Developer 3: Track Association Quality

**Focus:** Evaluate Hungarian assignment accuracy using ground truth trajectories

**Key Files:**
- `tracking-service/src/correlation/hungarian-assignment.ts`
- `tracking-service/src/tracks/track-manager.ts`
- `tracking-service/tests/correlation/hungarian-assignment.test.ts`

**Tasks:**
1. Build track consistency evaluator:
   - Same trackId across frames should map to nearby ground positions
   - Extract trajectories from sequential annotations
2. Measure fragmentation: How many global tracks created per unique person?
3. Measure ID switches: When does tracker incorrectly reassign identity?
4. Test distance threshold sensitivity in Hungarian assignment

**Ground Truth Trajectories to Validate:**
- Track 229 (camera1) / 483 (camera2): Multiple annotations showing movement
- Track 244 (camera1): Appears in 6 annotations
- Track 493 (camera2): Appears in 5 annotations

**Deliverables:**
- [ ] Track consistency metrics
- [ ] Fragmentation rate (tracks per person)
- [ ] ID switch rate (per minute of video)
- [ ] Recommended assignment threshold

**Success Criteria:** Fragmentation rate < 1.5, ID switch rate < 0.3/min

---

### Developer 4: Kalman Filter Tuning

**Focus:** Motion model accuracy and prediction quality

**Key Files:**
- `tracking-service/src/filters/kalman-track-filter.ts`
- `tracking-service/tests/filters/kalman-track-filter.test.ts`

**Tasks:**
1. Reconstruct trajectories from sequential ground truth annotations
2. Compare Kalman predictions vs actual positions at each timestep
3. Tune process noise (Q) matrix for realistic walking speeds (~1.4 m/s avg)
4. Tune measurement noise (R) matrix based on projection error
5. Evaluate 4-state model `[x, y, vx, vy]` fit for walking patterns

**Trajectory Data Points:**
```
Timestamps 170.87s → 181.01s (10.14 seconds of data)
Multiple people walking through the scene
Typical human walking speed: 1.0-1.8 m/s
```

**Deliverables:**
- [ ] Prediction error metrics (1-step, 3-step ahead)
- [ ] Recommended Q matrix values
- [ ] Recommended R matrix values
- [ ] Velocity estimation accuracy

**Success Criteria:** 1-step prediction error < 0.3m at 30fps

---

### Developer 5: Obstacle/Blind Spot Handling

**Focus:** Track continuity through occlusions

**Key Files:**
- `tracking-service/src/geometry/obstacles.ts`
- `tracking-service/src/detection/detection-processor.ts`
- `tracking-service/src/tracks/track-manager.ts`

**Tasks:**
1. Map annotations relative to obstacles:
   - Pillars at (6,3), (12,3), (6,9), (12,9) - radius 0.25m
   - Table at (14, 1.8) - 1.0m x 0.5m
2. Identify annotations near occlusion zones
3. Evaluate track timeout (currently 5s) vs typical occlusion duration
4. Consider "coast" mode: Use Kalman prediction during occlusion
5. Test blind spot detection (camera FOV edges)

**Annotations Near Obstacles:**
- Position (12.69, 3.66) - near pillar at (12, 3)
- Position (6.52, 7.36) - near pillar at (6, 9)

**Deliverables:**
- [ ] Occlusion zone map overlay
- [ ] Recommended track timeout value
- [ ] Coast mode implementation (if beneficial)
- [ ] Blind spot analysis per camera

**Success Criteria:** Track survival rate > 80% through single-pillar occlusion

---

## Shared Evaluation Framework

All developers should use this common evaluation interface:

```typescript
// File: tracking-service/src/evaluation/ground-truth-evaluator.ts

interface EvaluationResult {
  // === Projection Accuracy (Developer 1) ===
  projection: {
    validProjections: number      // count of successful projections
    totalAttempts: number         // total projection attempts
    errorMeters: {
      mean: number
      median: number
      p95: number
      max: number
    }
  }

  // === Cross-Camera Correlation (Developer 2) ===
  correlation: {
    dualCameraAnnotations: number  // annotations with both cameras
    agreementWithin05m: number     // percentage
    agreementWithin1m: number      // percentage
    agreementWithin2m: number      // percentage
    meanDisagreement: number       // meters between camera projections
    cameraSpecificBias: {
      camera1: { x: number, y: number }  // systematic offset
      camera2: { x: number, y: number }
    }
  }

  // === Track Quality (Developer 3) ===
  tracking: {
    uniquePersonsInGroundTruth: number
    tracksCreated: number
    fragmentationRate: number      // tracks / persons
    idSwitches: number
    idSwitchRate: number           // per minute
    correctAssociationRate: number // percentage
  }

  // === Motion Model (Developer 4) ===
  motion: {
    predictionError1Step: number   // meters
    predictionError3Step: number   // meters
    velocityEstimationError: number // m/s
    modelFitScore: number          // 0-1
  }

  // === Occlusion Handling (Developer 5) ===
  occlusion: {
    annotationsNearObstacles: number
    trackSurvivalRate: number      // through occlusion
    averageOcclusionDuration: number // seconds
    coastModeAccuracy: number      // if implemented
  }
}
```

### Evaluation Script Usage

```bash
# Run full evaluation
cd tracking-service
pnpm tsx src/evaluation/run-evaluation.ts ../cross-camera-ground-truth-*.json

# Run specific developer's evaluation
pnpm tsx src/evaluation/run-evaluation.ts --focus projection
pnpm tsx src/evaluation/run-evaluation.ts --focus correlation
pnpm tsx src/evaluation/run-evaluation.ts --focus tracking
pnpm tsx src/evaluation/run-evaluation.ts --focus motion
pnpm tsx src/evaluation/run-evaluation.ts --focus occlusion
```

---

## Iteration Process

### Round 1: Baseline Measurement
1. Each developer runs evaluation on current code
2. Document baseline metrics in this file
3. Identify top issue in their domain

### Round 2: Independent Fixes
1. Each developer implements fix for their top issue
2. Run evaluation to measure improvement
3. Document changes and new metrics

### Round 3: Integration
1. Merge all improvements
2. Run full evaluation
3. Identify cross-cutting issues

### Decision Points

| Condition | Priority Action |
|-----------|-----------------|
| Projection error > 1.0m | Developer 1 blocks others |
| Cross-camera correlation < 70% | Developer 2 priority |
| ID switch rate > 0.5/min | Developer 3/4 priority |
| Occlusion survival < 50% | Developer 5 priority |

---

## Current Baseline Metrics

> **Status:** Not yet measured (projection currently failing)

```
Projection:
  - Valid projections: 0%
  - Error: N/A (no_ground_intersection)

Correlation:
  - Agreement: N/A (blocked by projection)

Tracking:
  - Fragmentation: N/A
  - ID switches: N/A

Motion:
  - Prediction error: N/A

Occlusion:
  - Survival rate: N/A
```

---

## Ground Truth Annotation Reference

### Annotation Format
```json
{
  "id": "ann_1765227623952_yijif89mx",
  "groundPosition": { "x": 15, "y": 2.394 },
  "timestamp": 170.87,
  "confidence": "certain",
  "linkedDetections": [
    {
      "cameraId": "camera1",
      "frameNumber": 5121,
      "trackId": 229,
      "bbox": { "left": 0.675, "top": 0.537, "right": 0.733, "bottom": 0.771 }
    },
    {
      "cameraId": "camera2",
      "frameNumber": 5121,
      "trackId": 483,
      "bbox": { "left": 0.636, "top": 0.374, "right": 0.662, "bottom": 0.502 }
    }
  ]
}
```

### Key Annotations by Feature

**Dual-camera (for correlation testing):**
- ann_1765227623952, ann_1765227658805, ann_1765227690577
- ann_1765227742242, ann_1765227758478, ann_1765227805660
- ann_1765227828092, ann_1765227853562, ann_1765227875458
- ann_1765227967363, ann_1765227979081

**Near obstacles (for occlusion testing):**
- ann_1765227658805 - near pillar (12, 3)
- ann_1765227914409 - near pillar (6, 9)

**Sequential timestamps (for trajectory testing):**
- Frames 5121 → 5425 (170.87s → 181.01s)
- ~300 frames, ~10 seconds of footage

---

## File Locations

```
/
├── TRACKING-ITERATION.md          # This file
├── cross-camera-ground-truth-*.json  # Ground truth data
├── shared/config/
│   └── sitemap-rectangular-room.json # Room + camera config
└── tracking-service/
    ├── src/
    │   ├── projection/            # Developer 1
    │   ├── correlation/           # Developer 2, 3
    │   ├── tracks/                # Developer 3
    │   ├── filters/               # Developer 4
    │   ├── geometry/              # Developer 5
    │   └── evaluation/            # Shared evaluation (to create)
    └── tests/
        ├── projection/
        ├── correlation/
        ├── integration/
        └── filters/
```

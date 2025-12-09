# Occlusion Analysis Report

## Developer 5: Obstacle/Blind Spot Handling Analysis

**Date**: 2025-12-08
**Focus**: Track continuity through occlusions

---

## 1. Room Configuration

### Obstacles
| Obstacle | Position (x, y) | Dimensions |
|----------|----------------|------------|
| Pillar 1 | (6.0, 3.0) | radius 0.25m |
| Pillar 2 | (12.0, 3.0) | radius 0.25m |
| Pillar 3 | (6.0, 9.0) | radius 0.25m |
| Pillar 4 | (12.0, 9.0) | radius 0.25m |
| Table | (14.0, 1.8) | 1.0m x 0.5m |

### Room Dimensions
- Width: 18m
- Height: 12m

---

## 2. Ground Truth Annotations Near Obstacles

### Analysis Results

| Annotation | Position | Nearest Obstacle | Distance to Edge |
|------------|----------|------------------|------------------|
| annotation_1 | (12.69, 3.66) | pillar_2 at (12.0, 3.0) | **0.70m** (NEAR) |
| annotation_2 | (6.52, 7.36) | pillar_3 at (6.0, 9.0) | 1.47m (not near) |

**Finding**: Only annotation_1 at (12.69, 3.66) is within 1.0m of an obstacle (pillar_2).

---

## 3. Occlusion Duration Analysis

### Calculation
- **Pillar diameter**: 0.50m (radius 0.25m)
- **Occlusion path length**: diameter + 0.5m buffer = 1.0m
- **Typical walking speed**: 1.4 m/s
- **Estimated occlusion duration**: 0.71 seconds

### Track Timeout Evaluation
| Parameter | Value |
|-----------|-------|
| Current track timeout | 5.0 seconds |
| Estimated pillar occlusion | 0.71 seconds |
| Safety margin | 4.29 seconds (7x) |

**CONCLUSION**: Current 5-second track timeout is **sufficient** for pillar occlusions. A person walking at normal speed will only be occluded by a pillar for ~0.7 seconds, well within the timeout window.

---

## 4. Track Fragmentation Analysis (from Scene Data)

### Observed Track Gaps
Analysis of scene2 recording revealed several track fragmentation patterns:

| Gap Pattern | Duration | Analysis |
|-------------|----------|----------|
| Track d86c4ac2 → d2b65072 | 1.85s | Possible same person, track ID regenerated |
| Track d2b65072 → b4d1b0d3 | 0.57s | Likely same person, brief detection dropout |
| Track b4d1b0d3 → 284ad64e | 2.18s | Possible same person, track ID regenerated |

### Short Tracks (< 3 seconds)
- 6 out of 11 tracks had duration < 3 seconds
- These may represent:
  - Temporary detections
  - Track ID fragmentation due to brief occlusion
  - Edge-of-FOV detections

---

## 5. Camera Blind Spot Analysis

### FOV Configuration
From `fieldOfView.ts`:
- FOV angle range: 1° - 180°
- Typical camera rotation: adjusted from floor plan orientation

### Blind Spots Near Pillars
Each pillar creates a shadow zone on the opposite side from each camera. Key considerations:

1. **Pillar Shadow Zones**:
   - A pillar with 0.25m radius creates a ~0.5m shadow zone extending away from the camera
   - At 1m distance from pillar, shadow width is ~0.25m

2. **Recommended Camera Placement**:
   - Ensure at least 2 cameras with overlapping FOV near each pillar
   - Camera angles should approach pillars from different directions (90°+ separation)

### Coverage Recommendations per Obstacle

| Obstacle | Recommended Coverage |
|----------|---------------------|
| Pillar at (6, 3) | Cameras from NE and SW quadrants |
| Pillar at (12, 3) | Cameras from NE and SW quadrants |
| Pillar at (6, 9) | Cameras from SE and NW quadrants |
| Pillar at (12, 9) | Cameras from SE and NW quadrants |
| Table at (14, 1.8) | Minimal occlusion due to low height |

---

## 6. Recommendations

### 6.1 COAST MODE Implementation (HIGH PRIORITY)

When detection is lost and the last known position was near an obstacle:

```python
# Pseudocode for coast mode
def handle_detection_loss(track):
    if track.near_obstacle and track.has_velocity:
        # Use Kalman prediction
        predicted_pos = kalman_predict(
            track.last_position,
            track.velocity,
            dt=time_since_last_detection
        )

        # Coast for up to 2-3 seconds
        if time_since_last_detection < 3.0:
            track.status = 'coasting'
            track.predicted_position = predicted_pos
        else:
            track.status = 'lost'
```

**Implementation Steps**:
1. Add velocity estimation to TrackObject (from trajectory points)
2. Implement simple Kalman filter for position prediction
3. When detection lost near obstacle, continue predicting for up to 3 seconds
4. Re-associate when detection resumes within prediction radius

### 6.2 OBSTACLE-AWARE TIMEOUT (MEDIUM PRIORITY)

```python
def get_track_timeout(track, obstacles):
    base_timeout = 5.0  # seconds

    for obstacle in obstacles:
        if track.distance_to(obstacle) < 1.0:
            return base_timeout * 1.6  # 8 seconds near obstacles

    return base_timeout
```

### 6.3 MULTI-CAMERA HANDOFF (HIGH PRIORITY)

The existing cross-camera merge service (TrackSimilarity) already handles this, but consider:

1. **Pre-emptive handoff**: When track approaches pillar from Camera A's view, proactively look for matching tracks from Camera B
2. **Appearance-based re-ID**: Use clothing colors for re-association after brief occlusion
3. **Trajectory prediction**: Use predicted path to narrow re-association candidates

### 6.4 DETECTION LINE INTEGRATION

For critical areas near pillars, consider adding virtual detection lines:
- Trigger "entering occlusion zone" event when crossing
- Extend track timeout while in zone
- Alert if track doesn't exit zone within expected time

---

## 7. Summary

| Finding | Status | Action |
|---------|--------|--------|
| Track timeout vs occlusion | **OK** | 5s timeout >> 0.7s occlusion |
| Track fragmentation observed | **Issue** | Implement coast mode |
| Camera blind spots | **Risk** | Ensure multi-camera coverage |
| Ground truth near obstacles | **Partial** | 1 of 2 annotations near obstacle |

### Key Metrics
- **Estimated occlusion duration**: 0.71s
- **Current track timeout**: 5.0s
- **Safety margin**: 7x
- **Recommended coast duration**: 2-3s
- **Track fragmentation events**: Multiple observed in scene data

---

## 8. Files Created

- `intelligence/analytics/evaluation/__init__.py`
- `intelligence/analytics/evaluation/occlusion_evaluator.py`
- `intelligence/analytics/evaluation/OCCLUSION_ANALYSIS_REPORT.md`

## 9. Next Steps

1. Integrate `OcclusionEvaluator` with live tracking pipeline
2. Add Kalman filter implementation for coast mode
3. Configure obstacle locations from site configuration
4. Add metrics collection for occlusion events

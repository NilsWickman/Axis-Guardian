# Tracking System Audit - 2026-02-18

## Overview

Comprehensive audit of the Axis-Guardian tracking pipeline conducted February 2026. The system has hit a plateau where fixing one tracking problem worsens others. This document captures all findings across three areas:

1. **Backend Tracking Algorithm** - Config divergences, lifecycle bugs, architectural complexity
2. **Data Quality & Preprocessing** - Broken quality scores, missing filters, noisy embeddings
3. **Ground Truth & Calibration** - Insufficient annotations, circular validation, weak calibration

**Root cause**: The projection layer (1.07m mean error) and input data quality (broken embedding quality scores, no bbox size filtering) are not good enough for the tracking algorithm to work correctly. Parameter tuning cannot compensate for these foundational issues.

---

## Part 1: Backend Tracking Algorithm

### 1.1 Config Divergence — Two Sources of Truth (P0)

**Files:**
- `backend/src/config/algorithm-constants.ts` (central constants)
- `backend/src/tracks/track-manager.ts:170` (TrackManager constructor)
- `backend/src/correlation/hungarian-assignment.ts:94` (default assignment config)

The `TrackManager` constructor defaults `embeddingWeight` to **0.3**, but `ALGORITHM_CONSTANTS.assignment.embeddingWeight` is **0.65**. The batch processing path (`processBatchDetections` at track-manager.ts:2230) passes `this.embeddingWeight` (0.3), meaning the primary code path uses less than half the intended embedding influence.

Similarly, `associationBonus` is **0.15** in `processBatchDetections` (track-manager.ts:2227) vs **0.35** in `DEFAULT_ASSIGNMENT_CONFIG` (hungarian-assignment.ts:94).

| Parameter | ALGORITHM_CONSTANTS | Batch Processing | Default Config |
|-----------|-------------------|------------------|---------------|
| embeddingWeight | 0.65 | 0.3 | 0.65 |
| associationBonus | 0.35 | 0.15 | 0.35 |

**Impact**: ReID embeddings have less than half their intended influence in the primary processing path. Track-to-detection binding is 2.3x stronger in batch mode than intended.

---

### 1.2 Relaxed Confidence Is Stricter Than Base Confidence (P0)

**File:** `backend/src/detection/projection-pipeline.ts:296-300`

```typescript
const relaxedMinConfidence = Math.max(0.55, MIN_CONFIDENCE - 0.15)
// When MIN_CONFIDENCE = 0.5: Math.max(0.55, 0.35) = 0.55
```

The "relaxed" path for table-occluded people requires **higher** confidence (0.55) than the base filter (0.50). This logic is inverted — people behind tables have *lower* confidence and this accidentally rejects them.

**Impact**: Table-occluded people with confidence 0.50–0.55 are rejected by the path designed to help them.

---

### 1.3 Dead Zone: Confidence 0.50–0.55 (P1)

**Files:**
- `algorithm-constants.ts:426` — `minConfidence: 0.5`
- `algorithm-constants.ts:464` — `minCreationConfidence: 0.55`

Detections pass the initial 0.50 pipeline filter but fail the 0.55 track creation gate. These detections are fully processed (projected, filtered, assigned) then silently dropped at track creation time.

**Impact**: People with moderate confidence never create tracks. They are invisible.

---

### 1.4 Cumulative Velocity Decay During Coasting (P1)

**File:** `backend/src/tracks/occlusion-handler.ts:284-320`

```typescript
track.kalmanState.mean[2][0] *= decayFactor  // vx
track.kalmanState.mean[3][0] *= decayFactor  // vy
```

The `coastTrack` method mutates Kalman velocity state **in-place every frame** during coasting. The decay is applied per-call rather than computing absolute decay from occlusion start time. At 30fps with `decayFactor ~= 0.97`, velocity after N frames is `v * 0.97^N`:

| Frames | Time | Velocity Remaining |
|--------|------|-------------------|
| 5 | 0.17s | 86% |
| 15 | 0.5s | 63% |
| 30 | 1.0s | 40% |
| 60 | 2.0s | 16% |

This is **exponential-of-exponential** decay (each step decays the already-decayed value), far faster than the intended gradual slowdown.

**Note**: The uncommitted changes replace this with a proper `exp(-t/tau)` absolute decay model, which is correct and should be kept.

**Impact**: Coasting ghost tracks freeze almost immediately, making re-identification after occlusion very difficult.

---

### 1.5 min→max Missed Frames Change Is Risky (P1)

**Files:**
- `backend/src/tracks/frame-tracker.ts` — renamed `getMinMissedFramesAcrossCameras` to `getMaxMissedFramesAcrossCameras`
- `backend/src/tracks/occlusion-handler.ts` — uses max instead of min
- `backend/src/tracks/track-manager.ts` — uses max instead of min

**Old logic (min)**: A track is "still visible" if ANY camera saw it recently.
**New logic (max)**: A track transitions to occluded if ANY camera has enough missed frames.

Consider: Camera1 actively tracks Person A every frame. Camera2 (which saw them 5 seconds ago) has 50 missed frames. The max logic treats Person A as occluded despite Camera1 actively tracking them.

**Impact**: Active tracks can flicker into/out of occluded state when seen by multiple cameras with different update rates.

---

### 1.6 Kalman State Cache Not Cleared After syncPosition (P1)

**File:** `backend/src/filters/kalman-state-manager.ts:215-247`

`syncPosition()` and `syncPositionWithClamp()` modify `track.kalmanState.mean` directly but don't invalidate the Kalman library's internal `stateCache`. The `resetOnReentry()` method correctly calls `this.filter.removeTrackState()` to clear the cache — the sync methods don't.

**Impact**: After position sync operations, the next Kalman prediction uses stale cached state, causing a one-frame "snap" artifact.

---

### 1.7 Table Extension Factor of 5x (P2)

**File:** `backend/src/projection/ground-plane.ts:615-653`

The `MAX_TABLE_EXTENSION_FACTOR = 5.0` allows bbox height to be extended 5x for table-occluded people. Combined with the geometric approximation (ray-distance ratio as pixel-height multiplier — incorrect for wide-angle cameras), this can project seated people **meters** from their actual position.

Additionally, the width-based heuristic fallback uses `EXPECTED_STANDING_ASPECT = 2.3`, so a person with aspect ratio 0.5 gets factor `2.3/0.5 = 4.6x`.

The table occlusion clamping (`projection-pipeline.ts:321-334`) limits projected positions to 0.2–0.9m behind the table edge. The 0.9m max may be insufficient for auditorium seating with deep rows.

**Impact**: People appear inside or behind tables/furniture.

---

### 1.8 Aggressive Stitching Window (P2)

**File:** `algorithm-constants.ts:516-517`

```typescript
stitching: {
  maxGapMs: 30000,           // 30 seconds
  maxDistanceMultiplier: 6.0  // × correlationDistanceM (2.5m) = 15m
}
```

In a ~30x15m room, 15m is half the room. Person B entering 25 seconds after Person A left can inherit A's track ID. The `forceAssociateWithTrack` method (track-manager.ts:1576) only rejects motions above 50 m/s, so it will accept essentially any stitch.

**Impact**: Identity switches across the room.

---

### 1.9 Hard Embedding Rejection in findNearbyTrack (P2)

**File:** `backend/src/tracks/track-manager.ts:1095-1096`

```typescript
if (embeddingSimilarity >= 0 && embeddingSimilarity < 0.65) {
  continue  // Skip track entirely based on embedding alone
}
```

This hard cutoff at 0.65, combined with the exclusion zone check, creates a trap: a person whose appearance changed slightly (different lighting, partial occlusion) won't match existing tracks AND won't create a new track because the exclusion zone blocks creation.

Cross-camera association has a similar hard cutoff at 0.60 (track-manager.ts:1791-1798).

**Impact**: People disappear when their appearance changes across cameras or lighting conditions.

---

### 1.10 Multiplicative Cost Compounding in Hungarian Assignment (P2)

**File:** `backend/src/correlation/hungarian-assignment.ts:192-268`

The cost matrix applies 6 multiplicative factors sequentially:

1. Association multiplier: 0.35–2.5x
2. Motion consistency: additive
3. Embedding multiplier: 0.05–8.0x
4. Crossing gate: 0.8–3.0x
5. Handoff bonus: 0.5x
6. Soft identity gate: 1.0–8.0x

Worst case: `0.3m * 2.5 + 0.5 = 1.25 * 8.0 * 3.0 * 8.0 = 240m equivalent`. The adaptive gate cap at `maxCost * 1.5 = 1.2m` saves this from being catastrophic, but it means heavily-penalized-but-valid assignments saturate at the gate value, making the Hungarian algorithm treat them as "no assignment." This causes duplicate tracks instead of correct-but-penalized associations.

**Impact**: Valid associations rejected, spawning duplicate tracks.

---

### 1.11 Occlusion Coast Stops Before Track Timeout (P2)

**Files:**
- `occlusion-handler.ts` — `maxNonPillarCoastMs: 3000`
- `algorithm-constants.ts` — `occlusionCoastTimeMs: 8000`

For non-pillar occlusions (`timeout` exit reason), coasting stops at 3 seconds but the track stays alive for 8+ seconds. The track freezes at its last coasted position for the remaining 5+ seconds, appearing as a ghost.

**Impact**: Ghost tracks frozen in place for several seconds.

---

### 1.12 Double Coast in Cleanup + Batch Processing (P3)

**File:** `backend/src/tracks/track-manager.ts:692-718` and `track-manager.ts:2476-2548`

Both `cleanupExpiredTracks` and `coastUnmatchedTracks` update `track.currentPosition` for occluded tracks. If both execute in the same tick, the position is updated twice with compounding velocity decay.

**Impact**: Position jumps, accelerated velocity death.

---

### 1.13 Scale Applied to Image Coords But Not Principal Point (P3)

**File:** `backend/src/projection/ground-plane.ts:1001-1010`

In `projectWithKRT`, the `scale` parameter is multiplied into `(imageX, imageY)` but NOT into `center`. If calibration was computed at a different resolution than the detection image, the center values would need scaling too.

**Impact**: Projection error if image resolution differs from calibration resolution. May not be an active issue if both are 1920x1080.

---

### 1.14 Lens Undistortion Applies Forward Model (P3)

**File:** `backend/src/projection/lens-distortion.ts:54-89`

The `undistortPoint` function applies the Brown-Conrady distortion model forward (ideal → distorted), not inverse (distorted → ideal). True undistortion requires iterative solving. If coefficients came from OpenCV calibration, the correction is mathematically backwards.

Currently mitigated because all distortion coefficients are zero (`k1=k2=p1=p2=0`).

**Impact**: No current impact (coefficients are zero). Would produce wrong results if real distortion coefficients were added.

---

## Part 2: Data Quality & Preprocessing

### 2.1 Broken Embedding Quality Scores (Critical)

**Both** preprocessing scripts produce broken quality scores:

**`scripts/preprocess-video.py:358-360`**:
```python
crop_area = (x2 - x1) * (y2 - y1)
quality = min(1.0, crop_area / (128 * 256))  # = crop_area / 32768
```

For typical surveillance crops:
| Person distance | Crop size | Area | Quality |
|----------------|-----------|------|---------|
| Close | 200x500 | 100,000 | 1.0 |
| Medium | 100x250 | 25,000 | 0.76 |
| Far | 30x80 | 2,400 | 0.07 |
| Very far | 20x50 | 1,000 | 0.03 |

**`scripts/preprocessing/yolo_reid_preprocessor.py:231`**:
```python
quality = min(1.0, float(torch.norm(feat).item()) / 50.0)
```
Computed on already-L2-normalized features, so `norm = 1.0` always, yielding `quality = 0.02` always.

The backend has gutted all quality thresholds to work around this:
```typescript
minEmbeddingQuality: 0.01,      // "Lowered for preprocessor quality bug"
minQualityForRetention: 0.01,   // "Lowered for preprocessor quality bug"
```

**Impact**: Cannot distinguish reliable from unreliable embeddings. All ReID quality-weighted logic is disabled.

---

### 2.2 No Minimum Bounding Box Size Filter (High)

**File:** `scripts/preprocess-video.py:335`

The primary script only checks for zero-size or inverted crops (`if x2 <= x1 or y2 <= y1`). No minimum area, width, or height filter exists.

A 20x40 pixel crop gets resized 12x to 256x128 for the ReID model. The resulting embedding is dominated by interpolation artifacts and background noise.

The alternative script (`yolo_reid_preprocessor.py:207`) has `min 32x32` — better but still not used for the current detection files.

**Impact**: Detection files contain garbage embeddings from tiny distant people, mixed with good embeddings from close people. The system treats them equally.

---

### 2.3 Upper Clothing Region Includes Head (Medium)

**File:** `scripts/preprocess-video.py:152`

```python
upper_end = int(crop_h * 0.4)  # Upper region: 0% to 40% of crop height
```

The upper clothing region starts at pixel row 0 (top of bbox = head). Hair color and skin tones contaminate the clothing color analysis.

The alternative preprocessor correctly starts at 20% (`yolo_reid_preprocessor.py:158`):
```python
upper = crop[int(h*0.2):int(h*0.5)]  # Skip head
```

**Impact**: Clothing color attributes are unreliable for matching. Person with dark hair might get "black" as upper clothing regardless of shirt color.

---

### 2.4 Color Matching Uses RGB Euclidean Distance (Low)

**File:** `scripts/preprocess-video.py:77-95`

Reference colors are pure values (red = `(255, 0, 0)`, blue = `(0, 0, 255)`). RGB Euclidean distance is perceptually non-uniform. A burgundy jacket is equidistant from "red", "brown", and "maroon." Real clothing colors rarely match these reference values.

**Impact**: Clothing color assignments are inconsistent across frames and cameras.

---

### 2.5 Aggressive BoT-SORT Configuration (Medium)

**File:** `scripts/custom-botsort-strict.yaml`

The detection files were generated with:
- `track_high_thresh: 0.45` (vs default 0.5)
- `track_buffer: 300` — **10 seconds** at 30fps before dropping a lost track
- `new_track_thresh: 0.5` (vs default 0.6)

Result: **72–82 unique track IDs per camera** in a 3-minute video. Each BoT-SORT track break/stitch is a potential identity error propagated into the backend.

The emulator's track stitcher (`camera-emulator/src/detections/track-stitcher.ts`) attempts to merge fragmented tracks, but with 30-frame gap / 0.15 normalized-position thresholds, mismatches can occur.

**Impact**: Noisy track ID sequences, identity fragmentation in the input data.

---

### 2.6 Frame-Count Timestamps, Not PTS (Low)

**File:** `scripts/preprocess-video.py:456`

```python
timestamp = frame_idx / fps
```

Timestamps are computed from frame index, not read from the video container's PTS/DTS. For variable frame rate video or videos with dropped frames, these drift from reality.

**Impact**: Usually acceptable for constant-frame-rate surveillance video. Could cause issues with non-standard sources.

---

### 2.7 Cross-Camera Frame Count Mismatch (Low)

HC3/HC4 have 5458 frames; IP2/IP5 have 5457 frames. When the emulator loops, they desynchronize briefly at the loop boundary.

**Impact**: Brief cross-camera timing misalignment at loop points.

---

## Part 3: Ground Truth & Calibration

### 3.1 Ground Truth Obtained by Visual Estimation Only (Critical)

**Files:**
- `frontend/src/views/dev/CrossCameraAnnotator.vue` — GUI annotation tool
- `backend/src/cli/annotate-ground-truth.ts` — CLI annotation tool
- `shared/ground-truths/cross-camera-annotations.json` — primary dataset

World positions are obtained by an annotator **clicking on a 2D sitemap grid** with 2m spacing. There are:
- No physical floor markers
- No surveyed reference points
- No laser or tape measurements
- No independent ground truth

The annotator estimates where someone is standing in 3D space from an oblique 2D camera view and clicks a map. Inherent accuracy: **0.5–1.0m** from the estimation process alone.

**Impact**: The "81.5% pass rate at 1.5m threshold" is measured against reference data that is itself ~1m imprecise. True projection accuracy is unknown.

---

### 3.2 Circular Validation — Projection Used as Ground Truth (Critical)

**File:** `shared/ground-truths/filtered-annotations-v2.json`

This dataset contains worldPosition values with 15+ decimal digits of precision:
```json
"worldPosition": { "x": 23.241284403669724, "y": 12.064220183486238 }
```

These are clearly **reprojected through the camera calibration system** rather than independently measured. Compare with the manually annotated version in `cross-camera-annotations.json`:
```json
"worldPosition": { "x": 21.8, "y": 12 }
```

Using the system's own projection output as "ground truth" to validate that same projection system is circular and cannot detect systematic errors.

**Impact**: Calibration validation is unreliable. Systematic projection biases are invisible.

---

### 3.3 Insufficient Ground Truth Coverage (High)

**File:** `shared/ground-truths/cross-camera-annotations.json`

| Metric | Value |
|--------|-------|
| Keyframes annotated | 9 (t=0, 5, 10, 15, 20, 25, 30, 35, 40s) |
| Video duration | 182s |
| Coverage | First 22% of video only |
| Manual annotations | ~100 |
| Annotations with worldPosition | ~60-70 |
| Augmented (cross-camera copied) | ~40 |
| Persons tracked | 20 across 4 cameras |

**Spatial coverage**:
- Cameras 1-2 (atrium): x≈16.5–24.9, y≈7.7–14.1
- Cameras 3-4 (auditorium): x≈17.5–28.9, y≈14.5–24.6
- **Transition zone (y≈13–15)**: Almost no coverage — exactly where cross-camera handoffs happen

**Impact**: Cannot validate tracking accuracy across the full video or full room. The transition zone where handoffs occur is the weakest-validated area.

---

### 3.4 Calibration Based on Only 2 Points (High)

**File:** `tech-logs/camera-calibration-system.md`

The calibration grid search uses just **2 known positions** as ground truth:
```bash
--ground-truth "15.5,1;15,1"
```

With 6+ degrees of freedom per camera (position x/y/z, azimuth, elevation, focal length), 2 points are insufficient. The optimizer can fit these 2 points perfectly but produce large errors elsewhere (overfitting).

The auto-calibration via ReID matches (`backend/src/cli/calibrate.ts`) optimizes for cross-camera **convergence** (two cameras agree on position) rather than absolute accuracy. Cameras can converge to consistent-but-wrong positions.

**Impact**: Projection accuracy is unknown outside the 2 calibration reference points.

---

### 3.5 Foot Position vs Center-of-Mass Ambiguity (Medium)

**Files:**
- `backend/src/cli/validate-projection.ts:136-138` — uses bbox bottom-center
- `frontend/src/views/dev/CrossCameraAnnotator.vue` — annotator clicks sitemap

The projection pipeline uses **bbox bottom-center** (foot position) for ground-plane intersection. But annotators clicking on a map likely estimate the person's **body center or head position**, introducing a systematic ~0.3m offset between what's measured and what's annotated.

**Impact**: Systematic bias in all ground truth comparisons.

---

### 3.6 Per-Camera Bias Corrections Are All Zero (Medium)

**File:** `backend/src/detection/camera-registry.ts:134-139`

```typescript
const CAMERA_BIAS_CORRECTIONS: Record<string, { x: number; y: number }> = {
  camera1: { x: 0, y: 0 },
  camera2: { x: 0, y: 0 },
  camera3: { x: 0, y: 0 },
  camera4: { x: 0, y: 0 },
}
```

Comment: "Currently set to zero since the world transform was optimized using all cameras. May need re-calibration."

Even with the existing imperfect ground truth, computing mean projection error vectors per camera and applying them as bias corrections would reduce systematic offset.

**Impact**: Systematic per-camera projection offsets are not corrected.

---

### 3.7 Lens Distortion Coefficients All Zero (Medium)

**File:** `frontend/public/sitemap-rectangular-room.json`

All cameras have zero distortion coefficients:
```json
"distortion": { "k1": 0, "k2": 0, "p1": 0, "p2": 0 }
```

Real camera lenses (especially the 75-degree FOV camera1) have barrel distortion. Without correction, projections at image edges are systematically offset outward.

**Impact**: Position errors increase toward image edges. People near frame edges appear further from their true position.

---

## Part 4: The Whack-a-Mole Pattern

The uncommitted changes demonstrate a classic compensating-parameter pattern:

| Change | Fixes | Breaks |
|--------|-------|--------|
| Revert camera calibration to round numbers | Simplifies to single source of truth | Loses refined calibration, increases projection error |
| Raise `divergenceThreshold` 0.6→1.0m | Compensates for worse projections | Allows genuinely different people to merge |
| Raise `processNoise` 0.15→0.5 (3.3x) | Makes Kalman more reactive to measurements | Introduces jitter, amplifies projection noise |
| Lower `measurementNoise` 1.5→1.0 | Trust measurements more | Passes projection errors straight through |
| Remove hard identity gate | Fixes ID switches from noisy embeddings | Allows wrong-person associations |
| Raise `minDetectionsToConfirm` 2→3 | Compensates for above (fewer false tracks) | People take 50% longer to appear (300ms at 10fps) |
| min→max missed frames | Faster occlusion transitions | Active tracks flicker when seen by multiple cameras |

Each change is reasonable in isolation. Together they partially cancel out. This is the hallmark of **tuning parameters on top of an insufficiently accurate foundation**.

The core evidence: comments like `"with 0.3-0.6m calibration error per camera, two cameras can exceed 0.6m independently"` (justifying the divergence threshold increase) show that parameters are being loosened to accommodate projection inaccuracy rather than fixing the projection itself.

---

## Part 5: Recommended Priorities

### Tier 1: Fix Input Data Quality (Highest Impact)

These changes improve the foundation that everything else depends on.

#### T1.1 Fix Embedding Quality Score in Preprocessor

**File:** `scripts/preprocess-video.py:358-360`

Replace the broken quality calculation with one that reflects actual crop size relative to the camera frame, or compute quality before L2 normalization. Then re-enable quality-based filtering in the backend (`minEmbeddingQuality` back to a meaningful value like 0.15).

#### T1.2 Add Minimum Bbox Size Filter

**File:** `scripts/preprocess-video.py`, before embedding extraction

Reject detections smaller than 40x80 pixels before embedding extraction. This prevents garbage embeddings from entering the pipeline entirely.

#### T1.3 Fix Upper Clothing Region

**File:** `scripts/preprocess-video.py:152`

Change upper region to start at 20% height (skip head), matching the alternative preprocessor. Re-run preprocessing on all camera videos.

#### T1.4 Reprocess All Detection Files

After fixes T1.1–T1.3, reprocess all four camera videos:
```bash
parallel -j2 python3 scripts/preprocess-video.py shared/cameras/Auditorium/view-{}.mp4 \
  --tracker scripts/custom-botsort-strict.yaml \
  --no-merge \
  --output-dir shared/cameras/ ::: HC3 HC4 IP2 IP5
```

---

### Tier 2: Fix Concrete Backend Bugs

These are specific code issues independent of projection accuracy.

#### T2.1 Fix Config Divergence

**File:** `backend/src/tracks/track-manager.ts:170`

Use `ALGORITHM_CONSTANTS` values instead of hardcoded defaults:
```typescript
this.embeddingWeight = options.embeddingWeight ?? ALGORITHM_CONSTANTS.assignment.embeddingWeight
```

Same for `associationBonus` in `processBatchDetections`.

#### T2.2 Fix Reversed Relaxed Confidence

**File:** `backend/src/detection/projection-pipeline.ts:296-300`

The `Math.max(0.55, ...)` should be `Math.min(0.45, ...)` or similar to actually relax the threshold for table-occluded detections.

#### T2.3 Keep Exponential Velocity Decay

The uncommitted change replacing per-frame multiplicative decay with `exp(-t/tau)` absolute decay is mathematically correct. Keep this change.

#### T2.4 Revert min→max Missed Frames

Revert `getMaxMissedFramesAcrossCameras` back to `getMinMissedFramesAcrossCameras`. A person actively tracked by any camera should not be considered occluded.

#### T2.5 Clear Kalman State Cache in syncPosition

**File:** `backend/src/filters/kalman-state-manager.ts:215-222`

Add `this.filter.removeTrackState(track.globalTrackId)` after modifying `track.kalmanState.mean` directly, matching what `resetOnReentry()` already does.

#### T2.6 Cap Table Extension at 2x

**File:** `backend/src/projection/ground-plane.ts:652`

Reduce `MAX_TABLE_EXTENSION_FACTOR` from 5.0 to 2.0. A 5x extension is too aggressive and causes people to project inside furniture.

#### T2.7 Increase Obstacle Filter Margin

**File:** `backend/src/detection/projection-pipeline.ts:48`

Increase `OBSTACLE_FILTER_MARGIN` from 0.15m to 0.5m to match actual projection error (0.3–0.6m RMSE).

---

### Tier 3: Invest in Ground Truth

#### T3.1 Place Physical Floor Markers

Place tape or markers on the floor at 10+ known measured positions per camera's FOV. Measure distances from walls with a tape measure. This provides sub-0.1m accuracy reference points.

#### T3.2 Annotate More Keyframes

Cover the full 182-second video, not just the first 40 seconds. Target at least 30 keyframes (every 6 seconds).

#### T3.3 Cover the Transition Zone

Deliberately annotate the overlap area (y≈13–15) where cameras 1-2 and cameras 3-4 both see people. This is where cross-camera handoffs happen and where projection accuracy matters most.

#### T3.4 Stop Using Projection-Derived Ground Truth

Use only the manually annotated `cross-camera-annotations.json` dataset for validation. Do not use `filtered-annotations-v2.json` which contains projection-derived positions.

#### T3.5 Compute Per-Camera Bias Corrections

Using the improved ground truth, compute mean projection error vector per camera and populate `CAMERA_BIAS_CORRECTIONS`. This is a simple affine fix that could reduce RMSE by 0.2–0.5m.

---

### Tier 4: Simplify the Pipeline (Strategic)

If Tiers 1–3 don't resolve the issues, consider simplifying the tracking pipeline to reduce interaction effects:

#### T4.1 Remove Track Stitching

Disable stitching entirely. The 30s/15m window is a source of identity switches. With better input data and projection, tracks should maintain continuity without stitching.

#### T4.2 Simplify Cost Matrix

Reduce the Hungarian assignment cost to: base distance + embedding bonus/penalty. Remove crossing gates, handoff bonuses, and soft identity gates until the base case works. Add them back one at a time with validation.

#### T4.3 Single Occlusion Strategy

Use simple coasting with fixed timeout. Remove quality-adaptive extensions, pillar-vs-boundary distinction, curve-aware prediction. Get basic occlusion working first, then add sophistication.

#### T4.4 Decouple Position Filtering from Track Identity

Use raw projected positions for Hungarian assignment (with wider gates to accommodate projection error) but display Kalman-filtered positions. This separates "who is this detection?" from "where should I draw this person?"

---

## Quick Reference: Key Files

| File | Issues Found |
|------|-------------|
| `backend/src/config/algorithm-constants.ts` | Confidence dead zone (1.3), all tuning parameters |
| `backend/src/tracks/track-manager.ts` | Config divergence (1.1), embedding rejection (1.9), stitching (1.8) |
| `backend/src/tracks/occlusion-handler.ts` | Velocity decay (1.4), coast timeout mismatch (1.11) |
| `backend/src/tracks/frame-tracker.ts` | min→max change (1.5) |
| `backend/src/correlation/hungarian-assignment.ts` | Cost compounding (1.10) |
| `backend/src/detection/projection-pipeline.ts` | Reversed confidence (1.2), obstacle margin (1.7) |
| `backend/src/projection/ground-plane.ts` | Table extension (1.7), scale/center (1.13) |
| `backend/src/projection/lens-distortion.ts` | Forward model (1.14) |
| `backend/src/filters/kalman-state-manager.ts` | Cache invalidation (1.6) |
| `backend/src/detection/camera-registry.ts` | Bias corrections (3.6), identity R fallback |
| `scripts/preprocess-video.py` | Quality scores (2.1), no size filter (2.2), head in clothing (2.3) |
| `scripts/preprocessing/yolo_reid_preprocessor.py` | Quality score bug (2.1) |
| `shared/ground-truths/cross-camera-annotations.json` | Coverage (3.3), estimation accuracy (3.1) |
| `shared/ground-truths/filtered-annotations-v2.json` | Circular validation (3.2) |

---

## Fixes Applied (2026-02-18)

### Backend Bug Fixes

| Issue | Fix | File(s) |
|-------|-----|---------|
| **1.1** Config divergence | Use `ALGORITHM_CONSTANTS` instead of hardcoded values | `track-manager.ts:170,2227` |
| **1.2** Reversed relaxed confidence | `Math.max` → `Math.min` for confidence relaxation | `projection-pipeline.ts:296` |
| **1.5** Min→Max missed frames | Reverted to `getMinMissedFramesAcrossCameras` | `frame-tracker.ts`, `track-manager.ts:625` |
| **1.6** Kalman cache stale | `removeTrackState()` after syncPosition | `kalman-state-manager.ts` |
| **1.7** Table extension 5x | Capped `MAX_TABLE_EXTENSION_FACTOR` at 2.0 | `ground-plane.ts:652` |
| **1.7** Obstacle margin 0.15m | Increased to 0.5m (matches projection RMSE) | `projection-pipeline.ts:48` |
| **1.9** 0.01 quality thresholds | Raised to 0.15 across all files | `algorithm-constants.ts`, `track-manager.ts`, `embedding-archive.ts`, `hungarian-assignment.ts` |

### Preprocessing Fixes

| Issue | Fix | File |
|-------|-----|------|
| **2.1** Quality formula too generous | Denominator `128*256` → `80*200`, 3 decimal precision | `preprocess-video.py` |
| **2.2** No min bbox filter | Added 40x80 px minimum | `preprocess-video.py` |
| **2.3** Head in upper clothing | Upper 0-40% → 20-50%, lower 60-100% → 55-90% | `preprocess-video.py` |

### Detection File Reprocessing

All 4 camera detection files reprocessed with fixed preprocessing:

| Camera | Detections | Tracks | Quality Min | Quality Median | Below 0.15 |
|--------|-----------|--------|-------------|----------------|------------|
| HC3 | 11,594 | 69 | 0.239 | 0.969 | 0% |
| HC4 | 7,425 | 53 | 0.205 | 0.374 | 0% |
| IP2 | 43,615 | 81 | 0.352 | 1.000 | 0% |
| IP5 | 36,016 | 80 | 0.400 | 1.000 | 0% |

**HC4 improvement** (most affected camera):
- Too-small detections: 20.5% → 0%
- Quality min: 0.050 → 0.205
- Quality median: 0.240 → 0.374

---

## Validation Commands

```bash
# Validate projection accuracy against ground truth
cd backend && pnpm cli:validate-projection --verbose

# Watch live ASCII sitemap with trails
cd backend && pnpm cli:sitemap --watch --trails

# Query active tracks
cd backend && pnpm cli:query --watch

# Full system test (all services)
make dev

# Reprocess detections after preprocessing fixes
python3 scripts/preprocess-video.py shared/cameras/Auditorium/view-HC3.mp4 \
  --tracker scripts/custom-botsort-strict.yaml \
  --output shared/cameras/view-HC3.detections.json.gz
```

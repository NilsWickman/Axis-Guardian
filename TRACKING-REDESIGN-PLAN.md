# Tracking System Redesign Plan

## Problem Statement

The current tracking system was built incrementally for the prefunction area without a unified coordinate foundation. Key issues:

| Issue | Impact |
|-------|--------|
| Coordinate mismatch | Sitemap defines 32×30m, ground truths assume 18×12m |
| Manual calibration | K/R/T matrices extracted from dataset files, hard to verify |
| 38% projection accuracy | 2.4m average error makes cross-camera tracking unreliable |
| Camera placement uncertain | No systematic way to verify positions match reality |

## Current Architecture

```
Detection Files (YOLO + embeddings)
        ↓
Manual K/R/T calibration ← Problem: no validation loop
        ↓
Projection (38% accuracy)
        ↓
Hungarian Assignment + Kalman
        ↓
Global Tracks
```

Ground truths exist but are used only for validation testing, not as input to calibration.

---

## Proposed Redesign: Annotation-First Calibration

Build the system around **annotated tracks as the single source of truth**.

### New Architecture

```
┌─────────────────────────────────────────┐
│  Track Annotations                      │
│  (bbox + world position pairs)          │
│  20-30 per camera, high confidence      │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Calibration Pipeline                   │
│  1. PnP solver (per camera)             │
│  2. Bundle adjustment (cross-camera)    │
│  3. Distortion parameter fitting        │
│  4. Bias correction derivation          │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Generated Outputs                      │
│  - K/R/T matrices                       │
│  - Sitemap with verified dimensions     │
│  - Per-camera bias corrections          │
│  - Accuracy metrics                     │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Tracking Service (mostly unchanged)    │
│  - Hungarian assignment                 │
│  - Kalman filtering                     │
│  - Track lifecycle management           │
└─────────────────────────────────────────┘
```

### Why This Approach

1. **Single source of truth** - Annotations drive calibration, sitemap, and validation
2. **Reproducible** - Can regenerate calibration anytime from annotations
3. **Self-validating** - Accuracy is measurable against held-out annotations
4. **Camera placement is derived** - Positions come FROM data, not guessing
5. **Extensible** - New cameras added by annotating, not manual calibration

---

## Implementation Phases

### Phase 1: Annotation Data Structure & Collection

**Goal:** Define annotation format and collect initial dataset

**Annotation Schema:**
```typescript
interface CalibrationAnnotation {
  id: string;
  cameraId: string;
  frameNumber: number;
  timestamp: number;

  // Image coordinates (pixels)
  bbox: {
    x: number;      // top-left x
    y: number;      // top-left y
    width: number;
    height: number;
  };
  feetPosition: {   // bottom-center of bbox in pixels
    x: number;
    y: number;
  };

  // World coordinates (meters)
  worldPosition: {
    x: number;
    y: number;
    z: number;      // typically 0 for ground plane
  };

  confidence: 'certain' | 'estimated';
  notes?: string;
}
```

**Collection Requirements:**
- Minimum 20 annotations per camera (more is better)
- Spread across the camera's field of view (corners, center, edges)
- Include various distances from camera
- Mark physical landmarks with known positions

**Deliverables:**
- [ ] Annotation schema definition
- [ ] Annotation collection tool (enhance existing or new)
- [ ] Initial dataset: 20+ annotations per camera

---

### Phase 2: Physical Space Definition

**Goal:** Establish ground-truth coordinate system

**Tasks:**
1. Measure actual room dimensions
2. Define origin point (e.g., corner of room)
3. Mark reference points with known world coordinates
4. Document camera mounting positions (physical measurement)

**Output:**
```typescript
interface PhysicalSpace {
  dimensions: {
    width: number;   // meters (x-axis)
    depth: number;   // meters (y-axis)
    height: number;  // meters (z-axis, ceiling)
  };
  origin: {
    description: string;  // e.g., "Southwest corner at floor level"
    physical: string;     // e.g., "Corner by main entrance"
  };
  referencePoints: Array<{
    id: string;
    description: string;
    worldPosition: { x: number; y: number; z: number };
  }>;
  cameras: Array<{
    id: string;
    measuredPosition: { x: number; y: number; z: number };
    mountingNotes: string;
  }>;
}
```

**Deliverables:**
- [ ] Physical measurements document
- [ ] Reference point markers (if possible)
- [ ] Camera position measurements

---

### Phase 3: PnP Calibration Solver

**Goal:** Derive K/R/T from annotations automatically

**Algorithm:**
1. For each camera, collect N annotation pairs: (image_point, world_point)
2. Use PnP (Perspective-n-Point) to solve for camera pose
3. Decompose into K (intrinsics) and R/T (extrinsics)
4. Refine with Levenberg-Marquardt optimization

**Implementation Options:**

| Option | Pros | Cons |
|--------|------|------|
| OpenCV (Python) | Battle-tested, fast | Requires Python bridge |
| opencv4nodejs | Native Node.js bindings | Complex build, maintenance |
| Pure TypeScript | No dependencies | Need to implement from scratch |
| WebAssembly OpenCV | Browser + Node compatible | Bundle size |

**Recommended:** Python script for calibration generation, outputs JSON consumed by TypeScript backend.

**Deliverables:**
- [ ] PnP solver implementation
- [ ] Calibration validation metrics
- [ ] K/R/T output in sitemap-compatible format

---

### Phase 4: Bundle Adjustment

**Goal:** Globally optimize calibration across all cameras

**Why needed:**
- Individual PnP solutions may be inconsistent
- Cross-camera annotations constrain the solution
- Reduces systematic bias

**Algorithm:**
1. Collect cross-camera observations (same person seen by multiple cameras)
2. Joint optimization minimizing:
   - Reprojection error per camera
   - Cross-camera position disagreement
   - Physical constraint violations (camera height, etc.)

**Deliverables:**
- [ ] Bundle adjustment implementation
- [ ] Cross-camera consistency metrics
- [ ] Refined K/R/T matrices

---

### Phase 5: Sitemap Generation

**Goal:** Auto-generate sitemap from calibration results

**Generated sitemap includes:**
- Room dimensions (from physical measurements)
- Camera positions (from solved T vectors)
- Camera orientations (from solved R matrices)
- FOV (from solved K matrices)
- Obstacles (manual, but positioned in correct coordinate system)

**Deliverables:**
- [ ] Sitemap generator script
- [ ] Validation against physical measurements
- [ ] Migration from old sitemap format

---

### Phase 6: Tracking Integration

**Goal:** Use new calibration in existing tracking pipeline

**Changes required:**
- Update `sitemap-loader.ts` to load generated sitemap
- Update `camera-registry.ts` to use new K/R/T format
- Verify projection accuracy improvement
- Tune `algorithm-constants.ts` thresholds if needed

**Validation:**
- Run ground truth validation tests
- Compare accuracy: before vs after
- Verify cross-camera track merging improves

**Deliverables:**
- [ ] Integration with tracking service
- [ ] Accuracy comparison report
- [ ] Updated algorithm constants

---

## Alternative Approaches Considered

### Alternative 1: Minimal Fix (Sitemap Only)

Just update the sitemap with correct measurements:
- Fastest path
- No new infrastructure
- But: still manual, no systematic validation

**When to use:** If time-constrained and current tracking logic is acceptable.

### Alternative 2: Learned Projection

Replace geometric K/R/T with ML-based projection:
- Direct bbox→world regression
- Or polynomial transform fitted to annotations

**When to use:** If geometric calibration proves too difficult or cameras have severe distortion.

### Alternative 3: Hybrid (Keep Tracking, Replace Projection)

Keep Hungarian + Kalman unchanged, only rebuild projection:
- Less disruption
- Can be done incrementally

**When to use:** If tracking logic is proven good, only projection is the problem.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Projection accuracy (within 0.5m) | 38% | >80% |
| Average projection error | 2.4m | <0.5m |
| Cross-camera convergence | 30% | >70% |
| Track merge success | 70% | >90% |

---

## Open Questions

1. **Annotation tool:** Enhance existing `CalibrationAnnotator.vue` or build new?
2. **Python vs TypeScript:** For calibration solver, which is preferred?
3. **Obstacle definition:** Keep manual or derive from annotations?
4. **Re-ID integration:** Should embeddings influence calibration validation?
5. **Continuous improvement:** Auto-refine calibration from live tracking data?

---

## Next Steps

1. Review and approve this plan
2. Collect physical measurements of the space
3. Begin annotation collection (Phase 1)
4. Implement PnP solver (Phase 3)

---

## References

- [CALIBRATION-FROM-ANNOTATIONS.md](./CALIBRATION-FROM-ANNOTATIONS.md) - Detailed calibration math
- [tech-logs/krt-calibration-projection.md](./tech-logs/krt-calibration-projection.md) - K/R/T projection details
- [tech-logs/advanced-tracking-pipeline.md](./tech-logs/advanced-tracking-pipeline.md) - Tracking algorithm details

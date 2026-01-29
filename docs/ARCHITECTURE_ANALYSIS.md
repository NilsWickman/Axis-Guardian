# Architecture Analysis Report

> Analysis Date: 2026-01-24
> Purpose: Identify architectural issues causing developer confusion and hindering MOT progress

## Executive Summary

This analysis identified several interconnected issues in the Axis-Guardian codebase:

1. **God class syndrome** - `TrackManager` (2,845 lines) owns too many responsibilities
2. **Conceptual fog** - "Track" means 3 different things; "Detection" has 4+ type definitions
3. **Architectural churn** - Repeated "algorithm optimization" commits without clear metrics
4. **Type system fragmentation** - Backend redefines shared types with subtle differences

---

## 1. Module Boundary Issues

### 1.1 TrackManager is Too Large (2,845 lines)

**File:** `backend/src/tracks/track-manager.ts`

This class violates Single Responsibility Principle by owning:

| Responsibility | Methods | Should Be |
|----------------|---------|-----------|
| Track lifecycle | `processDetection`, `cleanupExpiredTracks` | Keep |
| Hungarian assignment | `processBatchDetections` calls `assignDetectionsToTracks` | Extract to `AssignmentOrchestrator` |
| Pre-clustering | `preClusterCrossCameraDetections` | Extract to clustering module |
| Occlusion handling | `coastUnmatchedTracks` | Extract to `TrackOcclusionHandler` |
| Track merging | `detectAndMergeDuplicates` | Already has `TrackMerger`, but logic leaked back |
| Re-identification | `attemptReidentification` | Already has `ReIdMatcher`, use it more |
| Embedding aggregation | `aggregateDetectionAttributes` | Move to ReIdMatcher |
| Trail management | owns `TrailManager` instance | Keep (delegation) |
| Kalman filtering | owns `KalmanTrackFilter` but intermixes updates | Extract to `KalmanStateManager` |

**Evidence of ownership explosion (lines 128-160):**
```typescript
private tracks: Map<string, GlobalTrack>
private kalmanFilter: KalmanTrackFilter
private trackMerger: TrackMerger
private trailManager: TrailManager
private frameTracker: FrameTracker
private exclusionValidator: ExclusionZoneValidator
private localStitcher: LocalTrackStitcher
private embeddingArchive: EmbeddingArchive
```

**Impact:** Changes to any tracking sub-system require modifying this massive class.

### 1.2 DetectionProcessor Duplicates Logic (1,008 lines)

**File:** `backend/src/detection/detection-processor.ts`

Two entry points contain nearly identical projection/filtering logic:

- Lines 317-600: `processMessage()` - single detection processing
- Lines 724-901: `processMultiCameraMessages()` - batch processing

**Duplicated operations:**
- Frame number checking and camera restart detection
- Confidence filtering (with table occlusion adjustment)
- K/R/T projection
- Bias correction
- Same-camera deduplication
- Obstacle and room bounds filtering

**Impact:** Bug fixes must be applied to both locations; easy to introduce inconsistencies.

---

## 2. Naming Inconsistencies

### 2.1 Track ID Confusion

| ID Type | Location | Scope | Problem |
|---------|----------|-------|---------|
| `detection.track_id` | Camera emulator | Local per-camera | snake_case |
| `CameraDetection.trackId` | Backend types | Local per-camera | **Misleading name** - suggests global |
| `track.globalTrackId` | TrackManager | Global across cameras | Correct name |
| `CameraTrackAssociation.trackIds` | Backend types | Array of local IDs | Plural but same scope |

**Recommendation:** Rename `CameraDetection.trackId` to `localTrackId`

### 2.2 Position Type Naming

| Type | Location | Structure |
|------|----------|-----------|
| `Point2D` | `backend/src/types/geometry.ts` | `{x: number, y: number}` |
| `Position2D` | `shared/types/src/geometry.ts` | `{x: number, y: number}` |
| `{worldX, worldY}` | `CameraDetection` | Loose fields |
| `currentPosition: Point2D` | `GlobalTrack` | Structured |

**Recommendation:** Standardize on `Point2D` everywhere, convert `worldX/worldY` to `worldPosition: Point2D`

### 2.3 Detection Type Proliferation

| Type | File | Purpose |
|------|------|---------|
| `RawDetection` | `backend/src/types/detection.ts` | From camera emulator |
| `CameraDetection` | `backend/src/types/track.ts` | Projected to world coordinates |
| `CameraImageDetection` | `backend/src/types/track.ts` | For video overlays |
| `Detection` | `frontend/src/types/detection.types.ts` | UI format |
| `Detection` | `frontend/src/types/generated.ts` | API format |

**Recommendation:** Rename for clarity:
- `RawDetection` → `YoloDetection`
- `CameraDetection` → `ProjectedDetection`
- `CameraImageDetection` → `VideoOverlayDetection`

---

## 3. Type System Fragmentation

### 3.1 Duplicate Type Definitions

Backend redefines types that exist in shared package:

| Type | Backend Location | Shared Location | Difference |
|------|-----------------|-----------------|------------|
| `Point2D` | `backend/src/types/geometry.ts` | `shared/types/src/geometry.ts` (as `Position2D`) | Name |
| `CameraDetection` | `backend/src/types/track.ts:116` | `shared/types/src/track.ts:38` | Backend has 3 extra fields |
| `DetectionAttributes` | `backend/src/types/detection.ts:39` | `shared/types/src/track.ts:146` | Structure differs |
| `GlobalTrackJSON` | `backend/src/types/track.ts:206` | `shared/types/src/track.ts:193` | Uses different position type |

### 3.2 CameraDetection Mismatch

**Backend version has extra fields:**
```typescript
// backend/src/types/track.ts:116-139
export interface CameraDetection {
  // ... common fields ...
  bbox?: { x: number; y: number; width: number; height: number }  // EXTRA
  imageCenter?: Point2D                                            // EXTRA
  isTableOccluded?: boolean                                        // EXTRA
  cameraPosition?: Point2D                                         // Uses Point2D
}
```

**Shared version:**
```typescript
// shared/types/src/track.ts:38-55
export interface CameraDetection {
  // ... common fields only ...
  cameraPosition?: Position2D  // Uses Position2D
}
```

### 3.3 Camera Emulator Duplicates

`camera-emulator/src/types.ts` redefines instead of importing:
- `ColorScore` (lines 21-24)
- `ClothingTypeScore` (lines 29-32)
- `ClothingAttributes` (lines 37-40)
- `DetectionAttributes` (lines 46-55)

---

## 4. Missing Abstractions

### 4.1 No IAssignmentStrategy Interface

TrackManager directly calls Hungarian algorithm with hard-coded config:

```typescript
// track-manager.ts:2257
const { matches, unmatchedDetections, unmatchedTracks } = assignDetectionsToTracks(
  virtualDetections,
  activeTracks,
  { maxCost, useKalmanPrediction, associationBonus, kalmanFilter, embeddingWeight }
)
```

**Problem:** Can't switch assignment algorithms without modifying TrackManager.

**Recommendation:** Create interface:
```typescript
interface IAssignmentStrategy {
  assign(detections: CameraDetection[], tracks: GlobalTrack[]): AssignmentResult
}
```

### 4.2 No Detection Pipeline

Processing steps are hard-coded in DetectionProcessor:
1. Parse bbox
2. Filter confidence
3. Project K/R/T
4. Filter obstacles
5. Apply bias correction
6. Filter room bounds
7. Deduplicate
8. Route to optimizer or track manager

**Recommendation:** Create pipeline abstraction:
```typescript
interface IDetectionFilter {
  filter(detection: CameraDetection): boolean
}

interface IDetectionTransform {
  transform(detection: CameraDetection): CameraDetection
}
```

### 4.3 No ITrackManager Interface

Cannot mock TrackManager for testing or swap implementations.

---

## 5. Scattered Kalman Logic

Kalman updates happen in multiple places:

| Location | Method | Operation |
|----------|--------|-----------|
| `track-manager.ts:1935+` | `processPendingMerge()` | Update on merge |
| `track-manager.ts:2508+` | `coastUnmatchedTracks()` | Predict for coasting |
| Hungarian assignment | `buildCostMatrix()` | Uses predictions |

**Recommendation:** Create `KalmanStateManager`:
```typescript
class KalmanStateManager {
  updateOnDetection(state: KalmanState, measurement: Point2D, timestamp: number): KalmanState
  predictForCoasting(state: KalmanState, timeDelta: number): KalmanState
  getPositionUncertainty(state: KalmanState): number
}
```

---

## 6. Recommended Refactoring Order

### Phase 1: Naming Fixes (Low Risk)
1. Rename `CameraDetection.trackId` → `localTrackId`
2. Standardize on `Point2D` (update shared types)
3. Rename detection types for clarity

### Phase 2: Type Alignment (Medium Risk)
4. Backend imports from shared types instead of redefining
5. Add missing fields to shared `CameraDetection` or create backend-specific extension

### Phase 3: Extract Components (Higher Risk)
6. Extract `KalmanStateManager` from TrackManager
7. Extract `TrackOcclusionHandler` from TrackManager
8. Create `IAssignmentStrategy` interface
9. Deduplicate DetectionProcessor projection logic

### Phase 4: Pipeline Abstraction (Highest Risk)
10. Create detection processing pipeline
11. Create `ITrackManager` interface

---

## 7. File Ownership Boundaries (Target State)

| Component | File | Responsibility |
|-----------|------|----------------|
| `DetectionProcessor` | detection-processor.ts | Projection, filtering, deduplication |
| `TrackManager` | track-manager.ts | Track lifecycle, creation, expiry |
| `KalmanStateManager` | kalman-state-manager.ts (NEW) | All Kalman predictions/updates |
| `TrackOcclusionHandler` | track-occlusion-handler.ts (NEW) | Occlusion detection, coasting |
| `AssignmentOrchestrator` | assignment-orchestrator.ts (NEW) | Detection-to-track assignment |
| `HungarianStrategy` | hungarian-strategy.ts | Hungarian algorithm implementation |
| `TrackMerger` | track-merger.ts | Duplicate detection, merging |
| `ReIdMatcher` | reid-matcher.ts | Re-identification matching |

---

## Appendix: Critical Files

| File | Lines | Complexity | Priority |
|------|-------|------------|----------|
| `backend/src/tracks/track-manager.ts` | 2,845 | Very High | High |
| `backend/src/detection/detection-processor.ts` | 1,008 | High | High |
| `backend/src/types/track.ts` | 231 | Medium | High |
| `backend/src/types/detection.ts` | 108 | Low | Medium |
| `shared/types/src/track.ts` | 218 | Medium | High |
| `shared/types/src/geometry.ts` | 50 | Low | Medium |

---

## 8. Remediation Status (Updated 2026-01-25)

### Completed Improvements

| Task | Status | Notes |
|------|--------|-------|
| Rename `trackId` → `localTrackId` | ✅ Complete | All 25+ files updated across backend, frontend, shared |
| Unify `Point2D`/`Position2D` | ✅ Complete | Deprecated `Position2D` as alias to `Point2D` |
| Create `IAssignmentStrategy` interface | ✅ Complete | `assignment-strategy.ts` + `HungarianStrategy` implementation |
| Extract `KalmanStateManager` | ✅ Complete | `filters/kalman-state-manager.ts` encapsulates all Kalman state operations |
| Align `CameraDetection` types | ✅ Complete | Shared types updated with backend-specific fields |
| Add MOT fundamentals docs | ✅ Complete | `docs/MOT_FUNDAMENTALS.md` |
| DetectionProcessor helpers | ✅ Partial | `projectDetection()` and `applyPostProjectionFilters()` created |
| Camera emulator type imports | ✅ Complete | Imports `ColorScore`, `ClothingTypeScore`, `DetectionAttributes` from `@axis-guardian/types` |
| Fix ESM extensions in shared types | ✅ Complete | Added `.js` extensions to all relative imports in `shared/types/src/` |
| Rename detection types | ⏸️ Reviewed | Not needed: names are adequate (`RawDetection` = unprocessed, `CameraDetection` = 87 occurrences) |

### Files Created

| File | Purpose |
|------|---------|
| `backend/src/filters/kalman-state-manager.ts` | Encapsulates Kalman state operations |
| `backend/src/filters/index.ts` | Module exports |
| `backend/src/correlation/assignment-strategy.ts` | Strategy interface + types |
| `backend/src/correlation/hungarian-strategy.ts` | Hungarian algorithm strategy |
| `docs/ARCHITECTURE_ANALYSIS.md` | This document |
| `docs/MOT_FUNDAMENTALS.md` | MOT concepts and algorithms |
| `docs/DEVELOPMENT_PATTERNS_ANALYSIS.md` | Git history analysis |
| `docs/TYPE_SYSTEM_ISSUES.md` | Type migration plan |

### Remaining Work

| Task | Status | Complexity | Notes |
|------|--------|------------|-------|
| Extract `TrackOcclusionHandler` | ⏳ Deferred | High | 150+ occurrences tightly coupled; `exit-detection.ts` already extracts classification logic |
| Full DetectionProcessor dedup | ⏳ Deferred | Medium | Logging interleaving prevents clean extraction; helpers available |
| Create `ITrackManager` interface | ⏳ Not started | High | Would enable testing/mocking |

### Occlusion Handling Architecture

The occlusion handling is partially modularized:

**Already Extracted (in `geometry/exit-detection.ts`):**
- `classifyExitReason()` - Determines FOV exit, boundary exit, pillar occlusion, partial occlusion, or timeout
- `getTimeoutForExitReason()` - Base timeout per exit type
- `getQualityAdaptiveTimeout()` - Quality-enhanced timeout with track history
- `shouldShowAsGhostTrack()` - Ghost track display logic
- Pillar shadow detection and ray intersection algorithms

**Remains in TrackManager:**
- State transition logic (confirmed → occluded → expired)
- Consecutive detection counting for occlusion recovery
- Predicted position updates during ghost coasting
- Integration with Kalman filter for coasting predictions

The tight coupling of state transitions with TrackManager's track lifecycle makes full extraction risky without comprehensive integration tests.

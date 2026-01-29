# Type System Issues

> Analysis of TypeScript type inconsistencies across the codebase

## Overview

The project uses a shared types package (`shared/types/`) but the backend maintains duplicate definitions that diverge from shared types. This creates hidden incompatibilities.

---

## 1. Duplicate Type Definitions

### Location Mapping

| Concept | Backend | Shared | Camera Emulator |
|---------|---------|--------|-----------------|
| Position | `backend/src/types/geometry.ts` | `shared/types/src/geometry.ts` | N/A |
| Track types | `backend/src/types/track.ts` | `shared/types/src/track.ts` | N/A |
| Detection attrs | `backend/src/types/detection.ts` | `shared/types/src/track.ts` | `camera-emulator/src/types.ts` |

### Why This is Problematic

Backend defines its own types instead of importing from shared:

```typescript
// backend/src/types/index.ts - CURRENT (BAD)
export interface Point2D { x: number; y: number }

// backend/src/types/index.ts - SHOULD BE
export { Position2D as Point2D } from '@axis-guardian/types'
```

---

## 2. Point2D vs Position2D

### The Problem

Identical structure, different names:

```typescript
// backend/src/types/geometry.ts
export interface Point2D {
  x: number
  y: number
}

// shared/types/src/geometry.ts
export interface Position2D {
  x: number
  y: number
}
```

### Impact

- 20+ backend modules import `Point2D`
- Frontend imports `Position2D` from shared
- Refactoring either requires touching many files
- No compile-time warning if structures diverge

### Resolution

Standardize on `Point2D` everywhere:

```typescript
// shared/types/src/geometry.ts - UPDATED
export interface Point2D {
  x: number
  y: number
}

// For backwards compatibility
export type Position2D = Point2D
```

---

## 3. CameraDetection Mismatch

### Backend Version (has extra fields)

```typescript
// backend/src/types/track.ts:116-139
export interface CameraDetection {
  cameraId: string
  trackId: number              // Should be localTrackId
  worldX: number
  worldY: number
  confidence: number
  timestamp: number
  bbox?: { x: number; y: number; width: number; height: number }  // EXTRA
  imageCenter?: Point2D        // EXTRA
  isTableOccluded?: boolean    // EXTRA
  frameNumber?: number
  videoTimeMs?: number
  rtpTimestamp?: number
  attributes?: DetectionAttributes
  cameraPosition?: Point2D     // Uses Point2D
}
```

### Shared Version (missing fields)

```typescript
// shared/types/src/track.ts:38-55
export interface CameraDetection {
  cameraId: string
  trackId: number
  worldX: number
  worldY: number
  confidence: number
  timestamp: number
  // NO bbox, imageCenter, isTableOccluded
  frameNumber?: number
  videoTimeMs?: number
  rtpTimestamp?: number
  attributes?: DetectionAttributes
  cameraPosition?: Position2D  // Uses Position2D
}
```

### Resolution Options

**Option A:** Add fields to shared type
```typescript
// shared/types/src/track.ts
export interface CameraDetection {
  // ... existing fields ...
  bbox?: BoundingBox
  imageCenter?: Point2D
  isTableOccluded?: boolean
}
```

**Option B:** Backend extends shared type
```typescript
// backend/src/types/track.ts
import { CameraDetection as BaseCameraDetection } from '@axis-guardian/types'

export interface CameraDetection extends BaseCameraDetection {
  bbox?: BoundingBox
  imageCenter?: Point2D
  isTableOccluded?: boolean
}
```

**Recommendation:** Option B - keeps shared types minimal, backend owns extensions

---

## 4. DetectionAttributes Structure Difference

### Backend Version

```typescript
// backend/src/types/detection.ts:39-48
export interface DetectionAttributes {
  upper_clothing?: ClothingAttributes  // Uses separate interface
  lower_clothing?: ClothingAttributes
  embedding?: number[]
  embedding_quality?: number
}

export interface ClothingAttributes {
  colors: ColorScore[]
  type?: ClothingTypeScore
}
```

### Shared Version

```typescript
// shared/types/src/track.ts:146-161
export interface DetectionAttributes {
  upper_clothing?: {           // Inline object literal
    colors: ColorScore[]
    type?: ClothingTypeScore
  }
  lower_clothing?: {
    colors: ColorScore[]
    type?: ClothingTypeScore
  }
  embedding?: number[]
  embedding_quality?: number
}
```

### Resolution

Update shared to use named interface (matches backend):

```typescript
// shared/types/src/track.ts
export interface ClothingAttributes {
  colors: ColorScore[]
  type?: ClothingTypeScore
}

export interface DetectionAttributes {
  upper_clothing?: ClothingAttributes
  lower_clothing?: ClothingAttributes
  embedding?: number[]
  embedding_quality?: number
}
```

---

## 5. Frontend Detection Type Fragmentation

### Three Different Detection Types

| Type | File | Purpose |
|------|------|---------|
| `Detection` | `frontend/src/types/detection.types.ts:51` | UI internal format |
| `Detection` | `frontend/src/types/generated.ts:4` | API format |
| `RawDetection` | `backend/src/types/detection.ts:57` | From camera |

### detection.types.ts

```typescript
export interface NormalizedBoundingBox {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Detection {
  class_name: string
  confidence: number
  bbox: NormalizedBoundingBox
  class_id: number
  track_id?: number
}
```

### generated.ts

```typescript
export interface Detection {
  id: string
  timestamp: string
  cameraId: string
  type: 'person' | 'vehicle' | 'animal' | 'unknown'
  confidence: number
  bbox: BoundingBox
  attributes?: Record<string, any>
}
```

### Resolution

Rename for clarity:
- `detection.types.ts` → `YoloDetection`
- `generated.ts` → `ApiDetection`
- Or consolidate if they represent same concept

---

## 6. Camera Emulator Duplicates

### Duplicated Types in camera-emulator/src/types.ts

| Type | Lines | Also In |
|------|-------|---------|
| `ColorScore` | 21-24 | backend/src/types/detection.ts |
| `ClothingTypeScore` | 29-32 | backend/src/types/detection.ts |
| `ClothingAttributes` | 37-40 | backend/src/types/detection.ts |
| `DetectionAttributes` | 46-55 | backend/src/types/detection.ts |

### Resolution

Import from shared types:

```typescript
// camera-emulator/src/types.ts - UPDATED
import {
  ColorScore,
  ClothingTypeScore,
  ClothingAttributes,
  DetectionAttributes
} from '@axis-guardian/types'

// Only define emulator-specific types
export interface DetectionMetadata {
  // ...
}
```

---

## 7. Excessive 'any' Usage

### Frontend replay.ts

```typescript
// frontend/src/types/replay.ts:22-30
export interface ReplaySnapshot {
  state: {
    tracks: any[]        // Should be GlobalTrackJSON[]
    zones?: any[]        // Should be Zone[]
    zoneMetrics?: any[]  // Should be ZoneMetrics[]
  }
}
```

### Resolution

```typescript
import type { GlobalTrackJSON } from '@axis-guardian/types'

export interface ReplaySnapshot {
  state: {
    tracks: GlobalTrackJSON[]
    zones?: Zone[]
    zoneMetrics?: ZoneMetric[]
  }
}
```

---

## 8. Import Path Inconsistencies

### Current State

| Package | Import Style |
|---------|--------------|
| Frontend | `from '@axis-guardian/types'` (alias) |
| Backend | `from '../types.js'` (relative) |
| Camera Emulator | `from './types.js'` (local) |

### Frontend tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@axis-guardian/types": ["../../../shared/types/src/index.ts"]
    }
  }
}
```

### Recommendation

Backend should also use path alias or workspace dependency:

```json
// backend/package.json
{
  "dependencies": {
    "@axis-guardian/types": "workspace:*"
  }
}
```

---

## 9. Migration Plan

### Phase 1: Naming Standardization

1. Rename `Position2D` → `Point2D` in shared types
2. Add `trackId` → `localTrackId` rename

### Phase 2: Shared Type Alignment

3. Add `ClothingAttributes` interface to shared
4. Add missing `CameraDetection` fields to shared (or use extension)
5. Update camera emulator to import from shared

### Phase 3: Backend Integration

6. Backend imports from shared instead of redefining
7. Backend extends shared types where needed
8. Remove duplicate definitions

### Phase 4: Frontend Cleanup

9. Consolidate `Detection` types
10. Replace `any` with proper types
11. Ensure all imports use `@axis-guardian/types`

---

## 10. Type Compatibility Matrix

### Current State

| Type | Backend → Frontend | Emulator → Backend | Notes |
|------|-------------------|-------------------|-------|
| `Point2D` | Incompatible (name) | N/A | Same structure |
| `CameraDetection` | Incompatible (fields) | Compatible | Backend has extras |
| `DetectionAttributes` | Incompatible (structure) | Compatible | Inline vs interface |
| `GlobalTrackJSON` | Compatible | N/A | Works at runtime |

### Target State

| Type | Backend → Frontend | Emulator → Backend | Notes |
|------|-------------------|-------------------|-------|
| `Point2D` | Compatible | Compatible | All use shared |
| `CameraDetection` | Compatible | Compatible | Backend extends shared |
| `DetectionAttributes` | Compatible | Compatible | All use shared |
| `GlobalTrackJSON` | Compatible | N/A | All use shared |

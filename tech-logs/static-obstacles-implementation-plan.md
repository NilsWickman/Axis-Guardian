# Static Obstacles Implementation Plan

## Overview

Add support for static objects (tables, pillars, desks, etc.) to the Axis-Guardian site map system. These objects will be:
1. **Visualized** on the site map canvas
2. **Used for camera FOV occlusion** calculation
3. **Integrated into the tracking algorithm** to improve accuracy

---

## Phase 1: Schema & Configuration ✅ COMPLETED

### 1.1 Extend Sitemap Schema
- [x] Add `obstacles` array to `shared/config/sitemap.schema.json`
- [x] Define obstacle type definitions (`rectangle`, `circle`, `polygon`)
- [x] Add `$defs/obstacle` with common properties
- [x] Add `$defs/dimensions2D` for width/height pairs

**Schema Structure:**
```json
{
  "obstacles": {
    "type": "array",
    "items": { "$ref": "#/$defs/obstacle" }
  }
}
```

**Obstacle Definition:**
```json
{
  "$defs": {
    "obstacle": {
      "type": "object",
      "required": ["id", "type", "position"],
      "properties": {
        "id": { "type": "string", "description": "Unique obstacle identifier" },
        "type": { "enum": ["rectangle", "circle", "polygon"] },
        "label": { "type": "string", "description": "Display name (e.g., 'Conference Table')" },
        "category": { "enum": ["furniture", "structural", "equipment"], "default": "furniture" },
        "position": { "$ref": "#/$defs/position2D", "description": "Center position in meters" },
        "rotation": { "type": "number", "default": 0, "description": "Rotation in degrees (clockwise)" },
        "dimensions": { "$ref": "#/$defs/dimensions2D", "description": "For rectangles: width/height" },
        "radius": { "type": "number", "description": "For circles: radius in meters" },
        "vertices": { "type": "array", "items": { "$ref": "#/$defs/position2D" }, "description": "For polygons" },
        "height": { "type": "number", "default": 1.0, "description": "Physical height in meters" },
        "blocksTracking": { "type": "boolean", "default": true, "description": "Prevents tracks inside" },
        "blocksView": { "type": "boolean", "default": true, "description": "Occludes camera FOV" },
        "color": { "type": "string", "description": "Display color (Tailwind class or hex)" }
      }
    },
    "dimensions2D": {
      "type": "object",
      "required": ["width", "height"],
      "properties": {
        "width": { "type": "number", "minimum": 0 },
        "height": { "type": "number", "minimum": 0 }
      }
    }
  }
}
```

### 1.2 Add Sample Obstacles to Config
- [x] Add example obstacles to `shared/config/sitemap-rectangular-room.json`
- [x] Include variety: tables, pillars, desks
- [x] Verify JSON validates against updated schema

**Example Configuration:**
```json
{
  "obstacles": [
    {
      "id": "table-main",
      "type": "rectangle",
      "label": "Conference Table",
      "category": "furniture",
      "position": { "x": 9, "y": 6 },
      "dimensions": { "width": 3.0, "height": 1.2 },
      "rotation": 0,
      "height": 0.75,
      "blocksTracking": false,
      "blocksView": false,
      "color": "stone-600"
    },
    {
      "id": "pillar-1",
      "type": "circle",
      "label": "Support Pillar",
      "category": "structural",
      "position": { "x": 6, "y": 4 },
      "radius": 0.4,
      "height": 3.0,
      "blocksTracking": true,
      "blocksView": true,
      "color": "slate-500"
    },
    {
      "id": "desk-1",
      "type": "rectangle",
      "label": "Reception Desk",
      "category": "furniture",
      "position": { "x": 3, "y": 10 },
      "dimensions": { "width": 2.0, "height": 0.8 },
      "rotation": 45,
      "height": 1.1,
      "blocksTracking": true,
      "blocksView": false,
      "color": "amber-700"
    }
  ]
}
```

### 1.3 TypeScript Types
- [x] Create `shared/types/obstacle.ts` with TypeScript interfaces
- [x] Export `Obstacle`, `RectangleObstacle`, `CircleObstacle`, `PolygonObstacle`
- [x] Add to shared barrel export

**Note:** Types added to `shared/types/src/sitemap.ts` with type guards (`isRectangleObstacle`, `isCircleObstacle`, `isPolygonObstacle`)

---

## Phase 2: Frontend Visualization ✅ COMPLETED

### 2.1 Canvas Rendering
- [x] Add `drawObstacles()` function in `frontend/src/composables/useSiteMapCanvas.ts`
- [x] Implement rectangle rendering with rotation support
- [x] Implement circle rendering
- [x] Implement polygon rendering (future-proof)
- [x] Add labels for obstacles (shown on hover/select)
- [x] Apply category-based styling:
  - `furniture`: Filled with semi-transparent color
  - `structural`: Solid fill with cross pattern
  - `equipment`: Dashed inner border

**Rendering Order (bottom to top):**
1. Grid
2. Obstacles (below FOV)
3. Camera FOV cones
4. Walls
5. Camera icons
6. Person positions

### 2.2 Obstacle Selection & Hover
- [x] Add hover detection for obstacles in `useSiteMapCanvas.ts` (`findObstacleAtPoint`)
- [x] Highlight obstacle on hover (amber border)
- [x] Show tooltip with obstacle label on hover
- [ ] (Optional) Click to select and show details panel - *deferred*

### 2.3 Camera FOV Occlusion ✅ COMPLETED
- [x] Extend `calculateVisibleFOV()` in `useGeometry.ts`
- [x] Add ray-obstacle intersection for rectangles (`getRectangleEdges()`)
- [x] Add ray-obstacle intersection for circles (`getRayCircleIntersection()`)
- [x] Only occlude if `blocksView: true`
- [ ] Consider obstacle height vs camera height (tall pillars block, low tables don't) - *deferred*

### 2.4 MiniMap Integration
- [x] Add obstacle rendering to `MiniMap.vue`
- [x] Simplified rendering (filled shapes)
- [x] Color-coded by category

### 2.5 Sitemap Store
- [x] Add `obstacles` state to sitemap Pinia store
- [x] Load obstacles when sitemap config is fetched
- [x] Added `Obstacle` interface and type definitions

---

## Phase 3: Tracking Service Integration ✅ COMPLETED (Core)

### 3.1 Load Obstacles
- [x] Extend `backend/src/config/sitemap-loader.ts`
- [x] Parse obstacles from sitemap JSON
- [x] Added `SiteMapObstacle` interface
- [x] Added `loadObstaclesFromSiteMap()` and `loadFullSiteMapConfig()`

### 3.2 Geometry Utilities
- [x] Create `backend/src/geometry/obstacles.ts`
- [x] Implement `isPointInsideObstacle(point, obstacle)` for each type
- [x] Implement `distanceToObstacle(point, obstacle)`
- [x] Implement `doesPathIntersectObstacle()` for path blocking
- [x] Handle rotation for rectangles

**Algorithms:**
| Obstacle Type | Point-in-Polygon Method |
|---------------|------------------------|
| Rectangle     | Transform to local coords, AABB test |
| Circle        | Distance from center < radius |
| Polygon       | Ray casting |

### 3.3 Detection Filtering
- [x] In `DetectionProcessor`, filter detections that project inside solid obstacles
- [x] Only filter if `blocksTracking: true`
- [x] Log filtered detections for debugging
- [x] Obstacles loaded in `server.ts` during initialization

### 3.4 Track Validation (Deferred)
- [ ] In `TrackManager.findNearbyTrack()`, consider obstacle boundaries
- [ ] Prevent track assignment that would require passing through solid obstacles
- [ ] Add `isPathBlocked(from, to, obstacles)` utility - *implemented but not integrated*

### 3.5 Kalman Filter Constraints (Advanced - Deferred)
- [ ] (Optional) Adjust process noise near obstacles
- [ ] (Optional) Clamp predicted positions to valid regions
- [ ] (Optional) Increase uncertainty for occluded tracks

### 3.6 Occlusion Awareness (Deferred)
- [ ] Extend occlusion handling for obstacle-caused occlusion
- [ ] When track approaches obstacle and disappears:
  - Mark as occluded
  - Extend coast time
  - Predict re-emergence on other side
- [ ] Track expected re-emergence point

---

## Phase 4: Testing & Validation ✅ COMPLETED (Core)

### 4.1 Unit Tests
- [x] Schema validation tests for obstacle definitions (24 tests)
- [x] Geometry utility tests (point-in-obstacle, intersections) (37 tests)
- [ ] Frontend canvas rendering tests (visual regression) - *deferred*
- [x] Tracking filter tests (13 tests)

**Test Files Created:**
- `backend/src/geometry/obstacles.test.ts` - Point-in-obstacle, distance, path intersection
- `backend/src/detection/detection-processor.test.ts` - Obstacle filtering integration
- `backend/tests/config/sitemap-schema.test.ts` - JSON schema validation

### 4.2 Integration Tests
- [x] End-to-end: Add obstacle, verify rendering (manual)
- [x] End-to-end: Verify tracking avoids solid obstacles (unit tests)
- [x] End-to-end: Verify camera FOV occlusion (manual)

### 4.3 Manual Testing Checklist
- [x] Add pillar to config, verify it renders correctly
- [ ] Add table to config, verify it renders correctly
- [ ] Verify rotated obstacles render correctly
- [x] Verify camera FOV is clipped by tall obstacles
- [x] Verify detections inside pillars are filtered
- [ ] Verify track doesn't jump through obstacles
- [x] Verify MiniMap shows obstacles
- [x] Verify hover/tooltip works

---

## File Changes Summary

| File | Changes |
|------|---------|
| `shared/config/sitemap.schema.json` | Add obstacle definitions |
| `shared/config/sitemap-rectangular-room.json` | Add example obstacles |
| `shared/types/obstacle.ts` | NEW: TypeScript interfaces |
| `frontend/src/composables/useSiteMapCanvas.ts` | Add `drawObstacles()` |
| `frontend/src/composables/useGeometry.ts` | Extend FOV occlusion |
| `frontend/src/components/features/site-map/MiniMap.vue` | Render obstacles |
| `frontend/src/stores/sitemap.ts` | Add obstacles state |
| `backend/src/config/sitemap-loader.ts` | Load obstacles |
| `backend/src/geometry/obstacles.ts` | NEW: Geometry utilities |
| `backend/src/detection/detection-processor.ts` | Filter by obstacles |
| `backend/src/tracks/track-manager.ts` | Path blocking checks |

---

## Implementation Priority

### MVP (Minimum Viable Product)
1. Schema extension (Phase 1.1, 1.2, 1.3)
2. Basic canvas rendering (Phase 2.1 - rectangles and circles only)
3. Obstacle loading in tracking service (Phase 3.1)

### Enhanced Visualization
4. Camera FOV occlusion (Phase 2.3)
5. Hover and selection (Phase 2.2)
6. MiniMap integration (Phase 2.4)

### Tracking Integration
7. Detection filtering (Phase 3.3)
8. Track validation (Phase 3.4)
9. Geometry utilities (Phase 3.2)

### Advanced Features
10. Polygon support
11. Kalman constraints (Phase 3.5)
12. Occlusion awareness (Phase 3.6)

---

## Configuration Examples

### Furniture (People can stand around it)
```json
{
  "id": "conference-table",
  "type": "rectangle",
  "label": "Conference Table",
  "category": "furniture",
  "position": { "x": 9, "y": 6 },
  "dimensions": { "width": 3.0, "height": 1.2 },
  "blocksTracking": false,
  "blocksView": false
}
```

### Structural (Solid, blocks everything)
```json
{
  "id": "pillar-main",
  "type": "circle",
  "label": "Support Pillar",
  "category": "structural",
  "position": { "x": 6, "y": 4 },
  "radius": 0.4,
  "height": 3.0,
  "blocksTracking": true,
  "blocksView": true
}
```

### Equipment (Blocks tracking, not view)
```json
{
  "id": "server-rack",
  "type": "rectangle",
  "label": "Server Rack",
  "category": "equipment",
  "position": { "x": 2, "y": 2 },
  "dimensions": { "width": 0.6, "height": 1.0 },
  "height": 2.0,
  "blocksTracking": true,
  "blocksView": false
}
```

---

## Notes

### Coordinate System
- All positions in meters from origin (0,0) at bottom-left
- Y-axis points up (north)
- Rotation is clockwise from north (same as camera azimuth)

### Rendering Scale
- Canvas uses 100 pixels per meter (`RENDER_SCALE`)
- All obstacle dimensions should be in meters

### Performance Considerations
- Cache obstacle geometry calculations
- Use spatial indexing if many obstacles (quadtree)
- Limit ray-casting resolution for FOV occlusion

---

## Open Questions

1. **Obstacle Editor?** Should we add a visual editor for placing obstacles?
2. **Import from CAD?** Support importing floor plans from external tools?
3. **Dynamic Obstacles?** Support for movable objects in the future?
4. **Z-levels?** Multi-floor buildings with overlapping areas?

---

*Created: 2025-12-07*
*Updated: 2025-12-07*
*Status: Phase 4 Core Complete - All core features implemented with 74 unit tests (230 total), advanced features deferred*

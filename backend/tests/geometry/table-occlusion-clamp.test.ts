import { describe, it, expect } from 'vitest'
import { clampBehindOccludingTable2D } from '../../src/geometry/obstacles.js'
import type { SiteMapObstacle } from '../../src/config/sitemap-loader.js'

describe('clampBehindOccludingTable2D', () => {
  it('prevents HC3 table-occluded projections from snapping to the bottom wall in the rectangular room sitemap', () => {
    // From @shared/config/sitemap-rectangular-room.json
    const cameraPos = { x: 16.22, y: 11.7 } // HC3
    const table: SiteMapObstacle = {
      id: 'table-1',
      type: 'rectangle',
      label: 'Registration Table',
      category: 'furniture',
      position: { x: 15, y: 1.8 },
      dimensions: { width: 1.0, height: 0.5 },
      rotation: 0,
      height: 1.0,
      blocksTracking: false,
      blocksView: true,
      color: '#f5f5f4',
    }

    // A bad projection case: person behind the table ends up almost at the bottom wall (y≈0).
    const badWorld = { x: 15.0, y: 0.0 }
    const { point, clamped } = clampBehindOccludingTable2D(cameraPos, badWorld, [table], 0.9, 0.2)

    expect(clamped).toBe(true)
    // Table far edge is at y=1.55; 0.9m behind -> y should stay well above 0.
    expect(point.y).toBeGreaterThan(0.4)
    expect(point.y).toBeLessThan(1.55)
  })

  it('prevents under-extension by clamping table-occluded points to be at least slightly behind the table', () => {
    // From @shared/config/sitemap-rectangular-room.json
    const cameraPos = { x: 16.22, y: 11.7 } // HC3
    const table: SiteMapObstacle = {
      id: 'table-1',
      type: 'rectangle',
      label: 'Registration Table',
      category: 'furniture',
      position: { x: 15, y: 1.8 },
      dimensions: { width: 1.0, height: 0.5 },
      rotation: 0,
      height: 1.0,
      blocksTracking: false,
      blocksView: true,
      color: '#f5f5f4',
    }

    // A bad under-extension case: projected point is still in front of the table (too close to camera),
    // which appears as "too high up" on the site map for HC3.
    const tooHigh = { x: 15.0, y: 4.0 }
    const { point, clamped } = clampBehindOccludingTable2D(cameraPos, tooHigh, [table], 0.9, 0.2)

    expect(clamped).toBe(true)
    // Must be pushed behind the table (y near ~1.35–1.55 range for this geometry).
    expect(point.y).toBeLessThan(2.05)
    expect(point.y).toBeGreaterThan(0.8)
  })
})



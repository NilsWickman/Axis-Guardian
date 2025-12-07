/**
 * Tests for Obstacle Geometry Utilities
 */

import { describe, it, expect } from 'vitest'
import {
  isPointInsideObstacle,
  isPointInsideAnyObstacle,
  findObstacleContainingPoint,
  distanceToObstacle,
  doesPathIntersectObstacle,
  doesPathIntersectAnyObstacle,
  getObstacleBufferRadius,
} from './obstacles.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'

describe('isPointInsideObstacle', () => {
  describe('circle obstacles', () => {
    const circleObstacle: SiteMapObstacle = {
      id: 'pillar-1',
      type: 'circle',
      position: { x: 5, y: 5 },
      radius: 1,
    }

    it('returns true for point at center', () => {
      expect(isPointInsideObstacle({ x: 5, y: 5 }, circleObstacle)).toBe(true)
    })

    it('returns true for point inside circle', () => {
      expect(isPointInsideObstacle({ x: 5.5, y: 5 }, circleObstacle)).toBe(true)
      expect(isPointInsideObstacle({ x: 5, y: 5.5 }, circleObstacle)).toBe(true)
    })

    it('returns true for point on boundary', () => {
      expect(isPointInsideObstacle({ x: 6, y: 5 }, circleObstacle)).toBe(true)
      expect(isPointInsideObstacle({ x: 5, y: 6 }, circleObstacle)).toBe(true)
    })

    it('returns false for point outside circle', () => {
      expect(isPointInsideObstacle({ x: 7, y: 5 }, circleObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 5, y: 7 }, circleObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 0, y: 0 }, circleObstacle)).toBe(false)
    })

    it('returns false if radius is undefined', () => {
      const noRadius: SiteMapObstacle = {
        id: 'no-radius',
        type: 'circle',
        position: { x: 5, y: 5 },
      }
      expect(isPointInsideObstacle({ x: 5, y: 5 }, noRadius)).toBe(false)
    })
  })

  describe('rectangle obstacles', () => {
    const rectObstacle: SiteMapObstacle = {
      id: 'table-1',
      type: 'rectangle',
      position: { x: 5, y: 5 },
      dimensions: { width: 4, height: 2 },
    }

    it('returns true for point at center', () => {
      expect(isPointInsideObstacle({ x: 5, y: 5 }, rectObstacle)).toBe(true)
    })

    it('returns true for point inside rectangle', () => {
      expect(isPointInsideObstacle({ x: 4, y: 5 }, rectObstacle)).toBe(true)
      expect(isPointInsideObstacle({ x: 6, y: 5.5 }, rectObstacle)).toBe(true)
    })

    it('returns true for point on boundary', () => {
      expect(isPointInsideObstacle({ x: 3, y: 5 }, rectObstacle)).toBe(true) // left edge
      expect(isPointInsideObstacle({ x: 7, y: 5 }, rectObstacle)).toBe(true) // right edge
      expect(isPointInsideObstacle({ x: 5, y: 4 }, rectObstacle)).toBe(true) // bottom edge
      expect(isPointInsideObstacle({ x: 5, y: 6 }, rectObstacle)).toBe(true) // top edge
    })

    it('returns false for point outside rectangle', () => {
      expect(isPointInsideObstacle({ x: 2, y: 5 }, rectObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 8, y: 5 }, rectObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 5, y: 2 }, rectObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 5, y: 8 }, rectObstacle)).toBe(false)
    })

    it('returns false if dimensions are undefined', () => {
      const noDims: SiteMapObstacle = {
        id: 'no-dims',
        type: 'rectangle',
        position: { x: 5, y: 5 },
      }
      expect(isPointInsideObstacle({ x: 5, y: 5 }, noDims)).toBe(false)
    })
  })

  describe('rotated rectangle obstacles', () => {
    const rotatedRect: SiteMapObstacle = {
      id: 'rotated-table',
      type: 'rectangle',
      position: { x: 5, y: 5 },
      dimensions: { width: 4, height: 2 },
      rotation: 45, // 45 degrees clockwise
    }

    it('returns true for point at center', () => {
      expect(isPointInsideObstacle({ x: 5, y: 5 }, rotatedRect)).toBe(true)
    })

    it('handles rotated coordinates correctly', () => {
      // Point along the rotated major axis should be inside
      const dx = 1 * Math.cos(Math.PI / 4) // ~0.707
      const dy = 1 * Math.sin(Math.PI / 4) // ~0.707
      expect(isPointInsideObstacle({ x: 5 + dx, y: 5 + dy }, rotatedRect)).toBe(true)
    })
  })

  describe('polygon obstacles', () => {
    const triangleObstacle: SiteMapObstacle = {
      id: 'triangle-1',
      type: 'polygon',
      position: { x: 5, y: 5 },
      vertices: [
        { x: 5, y: 7 },   // top
        { x: 3, y: 3 },   // bottom-left
        { x: 7, y: 3 },   // bottom-right
      ],
    }

    it('returns true for point inside triangle', () => {
      expect(isPointInsideObstacle({ x: 5, y: 5 }, triangleObstacle)).toBe(true)
      expect(isPointInsideObstacle({ x: 5, y: 4 }, triangleObstacle)).toBe(true)
    })

    it('returns false for point outside triangle', () => {
      expect(isPointInsideObstacle({ x: 5, y: 8 }, triangleObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 2, y: 2 }, triangleObstacle)).toBe(false)
      expect(isPointInsideObstacle({ x: 8, y: 5 }, triangleObstacle)).toBe(false)
    })

    it('returns false for invalid polygon (less than 3 vertices)', () => {
      const invalidPoly: SiteMapObstacle = {
        id: 'invalid',
        type: 'polygon',
        position: { x: 0, y: 0 },
        vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      }
      expect(isPointInsideObstacle({ x: 0.5, y: 0.5 }, invalidPoly)).toBe(false)
    })

    it('returns false if vertices are undefined', () => {
      const noVertices: SiteMapObstacle = {
        id: 'no-vertices',
        type: 'polygon',
        position: { x: 0, y: 0 },
      }
      expect(isPointInsideObstacle({ x: 0, y: 0 }, noVertices)).toBe(false)
    })
  })
})

describe('isPointInsideAnyObstacle', () => {
  const obstacles: SiteMapObstacle[] = [
    {
      id: 'pillar-1',
      type: 'circle',
      position: { x: 5, y: 5 },
      radius: 1,
    },
    {
      id: 'pillar-2',
      type: 'circle',
      position: { x: 10, y: 10 },
      radius: 1,
    },
  ]

  it('returns true if point is inside any obstacle', () => {
    expect(isPointInsideAnyObstacle({ x: 5, y: 5 }, obstacles)).toBe(true)
    expect(isPointInsideAnyObstacle({ x: 10, y: 10 }, obstacles)).toBe(true)
  })

  it('returns false if point is outside all obstacles', () => {
    expect(isPointInsideAnyObstacle({ x: 0, y: 0 }, obstacles)).toBe(false)
    expect(isPointInsideAnyObstacle({ x: 7.5, y: 7.5 }, obstacles)).toBe(false)
  })

  it('returns false for empty obstacle array', () => {
    expect(isPointInsideAnyObstacle({ x: 5, y: 5 }, [])).toBe(false)
  })
})

describe('findObstacleContainingPoint', () => {
  const obstacles: SiteMapObstacle[] = [
    {
      id: 'pillar-1',
      type: 'circle',
      position: { x: 5, y: 5 },
      radius: 1,
    },
    {
      id: 'pillar-2',
      type: 'circle',
      position: { x: 10, y: 10 },
      radius: 1,
    },
  ]

  it('returns the obstacle containing the point', () => {
    const result = findObstacleContainingPoint({ x: 5, y: 5 }, obstacles)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('pillar-1')
  })

  it('returns null if no obstacle contains the point', () => {
    expect(findObstacleContainingPoint({ x: 0, y: 0 }, obstacles)).toBeNull()
  })
})

describe('distanceToObstacle', () => {
  describe('circle obstacles', () => {
    const circle: SiteMapObstacle = {
      id: 'circle',
      type: 'circle',
      position: { x: 5, y: 5 },
      radius: 1,
    }

    it('returns negative distance for point inside', () => {
      expect(distanceToObstacle({ x: 5, y: 5 }, circle)).toBeLessThan(0)
      expect(distanceToObstacle({ x: 5, y: 5 }, circle)).toBeCloseTo(-1)
    })

    it('returns 0 for point on boundary', () => {
      expect(distanceToObstacle({ x: 6, y: 5 }, circle)).toBeCloseTo(0)
    })

    it('returns positive distance for point outside', () => {
      expect(distanceToObstacle({ x: 7, y: 5 }, circle)).toBeCloseTo(1)
      expect(distanceToObstacle({ x: 8, y: 5 }, circle)).toBeCloseTo(2)
    })
  })

  describe('rectangle obstacles', () => {
    const rect: SiteMapObstacle = {
      id: 'rect',
      type: 'rectangle',
      position: { x: 5, y: 5 },
      dimensions: { width: 4, height: 2 },
    }

    it('returns negative distance for point inside', () => {
      expect(distanceToObstacle({ x: 5, y: 5 }, rect)).toBeLessThan(0)
    })

    it('returns positive distance for point outside (edge case)', () => {
      // Point 1 unit to the right of the rectangle
      expect(distanceToObstacle({ x: 8, y: 5 }, rect)).toBeCloseTo(1)
    })

    it('returns positive distance for point outside (corner case)', () => {
      // Point at corner region
      const dist = distanceToObstacle({ x: 8, y: 7 }, rect)
      expect(dist).toBeGreaterThan(0)
    })
  })
})

describe('doesPathIntersectObstacle', () => {
  const circle: SiteMapObstacle = {
    id: 'circle',
    type: 'circle',
    position: { x: 5, y: 5 },
    radius: 1,
  }

  it('returns true if path passes through obstacle', () => {
    expect(doesPathIntersectObstacle({ x: 0, y: 5 }, { x: 10, y: 5 }, circle)).toBe(true)
    expect(doesPathIntersectObstacle({ x: 5, y: 0 }, { x: 5, y: 10 }, circle)).toBe(true)
  })

  it('returns true if path starts inside obstacle', () => {
    expect(doesPathIntersectObstacle({ x: 5, y: 5 }, { x: 10, y: 10 }, circle)).toBe(true)
  })

  it('returns true if path ends inside obstacle', () => {
    expect(doesPathIntersectObstacle({ x: 0, y: 0 }, { x: 5, y: 5 }, circle)).toBe(true)
  })

  it('returns false if path misses obstacle', () => {
    expect(doesPathIntersectObstacle({ x: 0, y: 0 }, { x: 0, y: 10 }, circle)).toBe(false)
    expect(doesPathIntersectObstacle({ x: 10, y: 0 }, { x: 10, y: 10 }, circle)).toBe(false)
  })
})

describe('doesPathIntersectAnyObstacle', () => {
  const obstacles: SiteMapObstacle[] = [
    {
      id: 'pillar-1',
      type: 'circle',
      position: { x: 5, y: 5 },
      radius: 1,
    },
    {
      id: 'pillar-2',
      type: 'circle',
      position: { x: 15, y: 5 },
      radius: 1,
    },
  ]

  it('returns true if path intersects any obstacle', () => {
    expect(doesPathIntersectAnyObstacle({ x: 0, y: 5 }, { x: 10, y: 5 }, obstacles)).toBe(true)
    expect(doesPathIntersectAnyObstacle({ x: 10, y: 5 }, { x: 20, y: 5 }, obstacles)).toBe(true)
  })

  it('returns false if path misses all obstacles', () => {
    expect(doesPathIntersectAnyObstacle({ x: 0, y: 0 }, { x: 0, y: 10 }, obstacles)).toBe(false)
    expect(doesPathIntersectAnyObstacle({ x: 10, y: 0 }, { x: 10, y: 10 }, obstacles)).toBe(false)
  })
})

describe('getObstacleBufferRadius', () => {
  it('returns radius + buffer for circle', () => {
    const circle: SiteMapObstacle = {
      id: 'circle',
      type: 'circle',
      position: { x: 0, y: 0 },
      radius: 1,
    }
    expect(getObstacleBufferRadius(circle, 0.5)).toBeCloseTo(1.5)
  })

  it('returns half-diagonal + buffer for rectangle', () => {
    const rect: SiteMapObstacle = {
      id: 'rect',
      type: 'rectangle',
      position: { x: 0, y: 0 },
      dimensions: { width: 6, height: 8 }, // 3-4-5 triangle, diagonal = 10, half = 5
    }
    expect(getObstacleBufferRadius(rect, 0)).toBeCloseTo(5)
  })

  it('returns max vertex distance + buffer for polygon', () => {
    const polygon: SiteMapObstacle = {
      id: 'polygon',
      type: 'polygon',
      position: { x: 0, y: 0 },
      vertices: [
        { x: 3, y: 0 },
        { x: 0, y: 4 },
        { x: -3, y: 0 },
      ],
    }
    // Max distance from center (0,0) to vertices is 4 (to vertex at 0,4)
    expect(getObstacleBufferRadius(polygon, 0)).toBeCloseTo(4)
  })

  it('uses default buffer of 0.3', () => {
    const circle: SiteMapObstacle = {
      id: 'circle',
      type: 'circle',
      position: { x: 0, y: 0 },
      radius: 1,
    }
    expect(getObstacleBufferRadius(circle)).toBeCloseTo(1.3)
  })
})

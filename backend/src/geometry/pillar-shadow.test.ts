import { describe, it, expect } from 'vitest'
import { isPointOccludedByAnyPillar } from './pillar-shadow.js'

describe('pillar-shadow geometry', () => {
  it('returns true when a point is behind a pillar from the camera viewpoint', () => {
    const camera = { x: 0, y: 0 }
    const pillar = {
      id: 'pillar',
      type: 'circle' as const,
      position: { x: 5, y: 0 },
      radius: 0.25,
      blocksTracking: true,
      blocksView: true,
    }

    // Point directly behind pillar on same ray
    const behind = { x: 7, y: 0 }
    expect(isPointOccludedByAnyPillar(camera, behind, [pillar])).toBe(true)
  })

  it('returns false when a point is not behind the pillar (off the shadow cone)', () => {
    const camera = { x: 0, y: 0 }
    const pillar = {
      id: 'pillar',
      type: 'circle' as const,
      position: { x: 5, y: 0 },
      radius: 0.25,
      blocksTracking: true,
      blocksView: true,
    }

    // Point well off-axis should not be occluded
    const visible = { x: 7, y: 2 }
    expect(isPointOccludedByAnyPillar(camera, visible, [pillar])).toBe(false)
  })
})



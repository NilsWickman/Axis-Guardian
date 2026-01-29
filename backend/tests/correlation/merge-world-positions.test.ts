import { describe, it, expect } from 'vitest'
import { mergeWorldPositions } from '../../src/correlation/track-matcher.js'
import type { CameraDetection } from '../../src/types.js'

describe('mergeWorldPositions - image edge weighting', () => {
  it('downweights edge-of-image detections so they do not pull the fused position as much', () => {
    const base: Omit<CameraDetection, 'worldX' | 'worldY'> = {
      cameraId: 'camera2',
      localTrackId: 1,
      confidence: 0.9,
      timestamp: 0,
      cameraPosition: { x: 0, y: 0 },
    }

    const centerGood: CameraDetection = {
      ...base,
      worldX: 5.0,
      worldY: 5.0,
      imageCenter: { x: 960, y: 540 }, // near center
    }

    const edgeNoisy: CameraDetection = {
      ...base,
      worldX: 5.0,
      worldY: 5.6, // within divergenceThreshold (0.8m) so we average, not pick-one
      imageCenter: { x: 1910, y: 60 }, // near top-right edge
    }

    const merged = mergeWorldPositions([centerGood, edgeNoisy]).position

    // Without edge weighting this would be ~5.3. We expect it to stay noticeably closer to 5.0.
    expect(merged.y).toBeLessThan(5.25)
    expect(merged.y).toBeGreaterThan(5.0)
  })
})





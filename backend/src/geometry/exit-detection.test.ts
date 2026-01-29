/**
 * Tests for exit detection and adaptive timeout
 */

import { describe, it, expect } from 'vitest'
import { getQualityAdaptiveTimeout, getTimeoutForExitReason } from './exit-detection.js'

describe('getTimeoutForExitReason', () => {
  const defaultConfig = {
    fovExitTimeoutMs: 1000,
    boundaryExitTimeoutMs: 500,
    maxPillarOcclusionMs: 10000,
    partialPillarOcclusionMs: 8000,
    occlusionCoastTimeMs: 2000,
  }

  it('should return short timeout for FOV exits', () => {
    const timeout = getTimeoutForExitReason('fov_exit', defaultConfig)
    expect(timeout).toBe(1000)
  })

  it('should return short timeout for boundary exits', () => {
    const timeout = getTimeoutForExitReason('boundary_exit', defaultConfig)
    expect(timeout).toBe(500)
  })

  it('should return long timeout for pillar occlusion', () => {
    const timeout = getTimeoutForExitReason('pillar_occlusion', defaultConfig)
    expect(timeout).toBe(10000)
  })

  it('should return medium timeout for partial occlusion', () => {
    const timeout = getTimeoutForExitReason('partial_occlusion', defaultConfig)
    expect(timeout).toBe(8000)
  })

  it('should return default timeout for unknown reason', () => {
    const timeout = getTimeoutForExitReason('timeout', defaultConfig)
    expect(timeout).toBe(2000)
  })
})

describe('getQualityAdaptiveTimeout', () => {
  const defaultConfig = {
    fovExitTimeoutMs: 1000,
    boundaryExitTimeoutMs: 500,
    maxPillarOcclusionMs: 5000,
    partialPillarOcclusionMs: 4000,
    occlusionCoastTimeMs: 2000,
    qualityRetentionBonus: 0.5,
    maxRetentionMultiplier: 1.8,
    minQualityForRetention: 0.3,
  }

  describe('without track history', () => {
    it('should not extend timeout for FOV exits regardless of quality', () => {
      const timeout = getQualityAdaptiveTimeout('fov_exit', 1.0, defaultConfig)
      expect(timeout).toBe(1000)  // Base timeout, no extension
    })

    it('should not extend timeout for boundary exits regardless of quality', () => {
      const timeout = getQualityAdaptiveTimeout('boundary_exit', 1.0, defaultConfig)
      expect(timeout).toBe(500)  // Base timeout, no extension
    })

    it('should not extend timeout for low-quality embeddings', () => {
      const timeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.2, defaultConfig)
      expect(timeout).toBe(5000)  // Base timeout, no extension
    })

    it('should extend timeout for high-quality pillar occlusion', () => {
      const timeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.8, defaultConfig)
      // Quality 0.8 -> normalized = (0.8-0.3)/(1-0.3) = 0.714
      // Multiplier = 1 + 0.5 * 0.714 = 1.357
      expect(timeout).toBeGreaterThan(5000)
      expect(timeout).toBeLessThan(9000)
    })

    it('should cap multiplier at maxRetentionMultiplier', () => {
      const timeout = getQualityAdaptiveTimeout('pillar_occlusion', 1.0, defaultConfig)
      // With perfect quality, multiplier should be 1 + 0.5 * 1 = 1.5, not exceeding 1.8
      expect(timeout).toBeLessThanOrEqual(5000 * 1.8)
    })
  })

  describe('with track history', () => {
    it('should extend timeout for high detection count', () => {
      const baseTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig)
      const extendedTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig, {
        detectionCount: 30,
      })
      expect(extendedTimeout).toBeGreaterThan(baseTimeout)
    })

    it('should not extend timeout for low detection count', () => {
      const baseTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig)
      const sameTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig, {
        detectionCount: 5,
      })
      expect(sameTimeout).toBe(baseTimeout)
    })

    it('should extend timeout for tracks with occlusion recovery history', () => {
      const baseTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig)
      const extendedTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig, {
        occlusionCount: 2,
      })
      expect(extendedTimeout).toBeGreaterThan(baseTimeout)
    })

    it('should extend timeout for high confidence tracks', () => {
      const baseTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig)
      const extendedTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig, {
        avgConfidence: 0.95,
      })
      expect(extendedTimeout).toBeGreaterThan(baseTimeout)
    })

    it('should combine all factors for maximum extension', () => {
      const baseTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.5, defaultConfig)
      const maxExtendedTimeout = getQualityAdaptiveTimeout('pillar_occlusion', 0.9, defaultConfig, {
        detectionCount: 50,
        occlusionCount: 3,
        avgConfidence: 0.95,
      })
      expect(maxExtendedTimeout).toBeGreaterThan(baseTimeout)
      // Should be capped at maxRetentionMultiplier * baseTimeout
      expect(maxExtendedTimeout).toBeLessThanOrEqual(5000 * 1.8)
    })

    it('should still respect maxRetentionMultiplier with all factors', () => {
      const timeout = getQualityAdaptiveTimeout('pillar_occlusion', 1.0, defaultConfig, {
        detectionCount: 100,
        occlusionCount: 10,
        avgConfidence: 1.0,
      })
      expect(timeout).toBeLessThanOrEqual(5000 * 1.8)
    })
  })
})

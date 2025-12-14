/**
 * AttributeAggregator and cosineSimilarity tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AttributeAggregator, cosineSimilarity, euclideanDistance } from './attribute-aggregator'
import type { DetectionAttributes } from '../types'

describe('AttributeAggregator', () => {
  let aggregator: AttributeAggregator

  beforeEach(() => {
    aggregator = new AttributeAggregator()
  })

  describe('Basic functionality', () => {
    it('should start empty', () => {
      expect(aggregator.hasData()).toBe(false)
      expect(aggregator.getSampleCount()).toBe(0)
    })

    it('should track sample count', () => {
      aggregator.addDetection({})
      expect(aggregator.getSampleCount()).toBe(1)
      expect(aggregator.hasData()).toBe(true)

      aggregator.addDetection({})
      expect(aggregator.getSampleCount()).toBe(2)
    })

    it('should reset state', () => {
      aggregator.addDetection({
        upper_clothing: { colors: [{ name: 'red', score: 0.8 }] },
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })
      expect(aggregator.hasData()).toBe(true)

      aggregator.reset()
      expect(aggregator.hasData()).toBe(false)
      expect(aggregator.getSampleCount()).toBe(0)
    })
  })

  describe('Color aggregation', () => {
    it('should aggregate upper clothing colors', () => {
      aggregator.addDetection({
        upper_clothing: { colors: [{ name: 'blue', score: 0.8 }, { name: 'white', score: 0.3 }] },
      })
      aggregator.addDetection({
        upper_clothing: { colors: [{ name: 'blue', score: 0.9 }] },
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.upper_clothing.dominant_colors).toHaveLength(2)
      expect(attrs.upper_clothing.dominant_colors[0].name).toBe('blue') // Most votes
    })

    it('should aggregate lower clothing colors', () => {
      aggregator.addDetection({
        lower_clothing: { colors: [{ name: 'black', score: 0.9 }] },
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.lower_clothing.dominant_colors).toHaveLength(1)
      expect(attrs.lower_clothing.dominant_colors[0].name).toBe('black')
    })

    it('should ignore colors below minimum score threshold', () => {
      aggregator.addDetection({
        upper_clothing: { colors: [{ name: 'red', score: 0.05 }] }, // Below MIN_COLOR_SCORE
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.upper_clothing.dominant_colors).toHaveLength(0)
    })

    it('should limit to top 3 dominant colors', () => {
      aggregator.addDetection({
        upper_clothing: {
          colors: [
            { name: 'red', score: 0.9 },
            { name: 'blue', score: 0.8 },
            { name: 'green', score: 0.7 },
            { name: 'yellow', score: 0.6 },
          ],
        },
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.upper_clothing.dominant_colors).toHaveLength(3)
    })
  })

  describe('Clothing type aggregation', () => {
    it('should aggregate upper clothing type', () => {
      aggregator.addDetection({
        upper_clothing: { colors: [], type: { name: 'jacket', score: 0.8 } },
      })
      aggregator.addDetection({
        upper_clothing: { colors: [], type: { name: 'jacket', score: 0.9 } },
      })
      aggregator.addDetection({
        upper_clothing: { colors: [], type: { name: 'shirt', score: 0.7 } },
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.upper_clothing.type?.name).toBe('jacket') // More votes
    })

    it('should aggregate lower clothing type', () => {
      aggregator.addDetection({
        lower_clothing: { colors: [], type: { name: 'jeans', score: 0.9 } },
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.lower_clothing.type?.name).toBe('jeans')
    })
  })

  describe('Embedding aggregation', () => {
    it('should not return embedding with fewer than 2 samples', () => {
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding).toBeUndefined()
    })

    it('should return embedding with 2+ samples', () => {
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding).toBeDefined()
      expect(attrs.embedding!.length).toBe(3)
    })

    it('should quality-weight embeddings', () => {
      // Low quality embedding [1, 0, 0]
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.1,
      })
      // High quality embedding [0, 1, 0]
      aggregator.addDetection({
        embedding: [0, 1, 0],
        embedding_quality: 0.9,
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding).toBeDefined()

      // Result should be closer to [0, 1, 0] due to higher quality weight
      const [x, y, z] = attrs.embedding!
      expect(y).toBeGreaterThan(x) // y should dominate
    })

    it('should L2 normalize the aggregated embedding', () => {
      aggregator.addDetection({
        embedding: [3, 4, 0],
        embedding_quality: 1.0,
      })
      aggregator.addDetection({
        embedding: [3, 4, 0],
        embedding_quality: 1.0,
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding).toBeDefined()

      // Check L2 norm is 1
      const norm = Math.sqrt(attrs.embedding!.reduce((sum, v) => sum + v * v, 0))
      expect(norm).toBeCloseTo(1, 5)
    })

    it('should ignore embeddings with mismatched dimensions', () => {
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })
      aggregator.addDetection({
        embedding: [1, 0], // Different dimension - should be ignored
        embedding_quality: 0.9,
      })
      aggregator.addDetection({
        embedding: [1, 0, 0],
        embedding_quality: 0.9,
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding).toBeDefined()
      expect(attrs.embedding!.length).toBe(3)
    })

    it('should use default quality of 0.5 when not specified', () => {
      aggregator.addDetection({
        embedding: [1, 0, 0],
        // No embedding_quality
      })
      aggregator.addDetection({
        embedding: [1, 0, 0],
      })

      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding_quality).toBeGreaterThan(0)
    })
  })

  describe('Embedding quality calculation', () => {
    it('should return 0 quality with no embeddings', () => {
      const attrs = aggregator.getAggregatedAttributes()
      expect(attrs.embedding_quality).toBe(0)
    })

    it('should increase quality with more samples', () => {
      const quality1 = (() => {
        const agg = new AttributeAggregator()
        agg.addDetection({ embedding: [1, 0], embedding_quality: 1.0 })
        agg.addDetection({ embedding: [1, 0], embedding_quality: 1.0 })
        return agg.getAggregatedAttributes().embedding_quality
      })()

      const quality2 = (() => {
        const agg = new AttributeAggregator()
        for (let i = 0; i < 10; i++) {
          agg.addDetection({ embedding: [1, 0], embedding_quality: 1.0 })
        }
        return agg.getAggregatedAttributes().embedding_quality
      })()

      expect(quality2).toBeGreaterThan(quality1)
    })

    it('should factor in input embedding quality', () => {
      const lowQualityAgg = new AttributeAggregator()
      lowQualityAgg.addDetection({ embedding: [1, 0], embedding_quality: 0.1 })
      lowQualityAgg.addDetection({ embedding: [1, 0], embedding_quality: 0.1 })
      const lowQuality = lowQualityAgg.getAggregatedAttributes().embedding_quality

      const highQualityAgg = new AttributeAggregator()
      highQualityAgg.addDetection({ embedding: [1, 0], embedding_quality: 1.0 })
      highQualityAgg.addDetection({ embedding: [1, 0], embedding_quality: 1.0 })
      const highQuality = highQualityAgg.getAggregatedAttributes().embedding_quality

      expect(highQuality).toBeGreaterThan(lowQuality)
    })
  })
})

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const a = [1, 0, 0]
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5)
  })

  it('should return -1 for opposite vectors', () => {
    const a = [1, 0, 0]
    const b = [-1, 0, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5)
  })

  it('should return 0 for orthogonal vectors', () => {
    const a = [1, 0, 0]
    const b = [0, 1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
  })

  it('should return 0 for mismatched dimensions', () => {
    const a = [1, 0]
    const b = [1, 0, 0]
    expect(cosineSimilarity(a, b)).toBe(0)
  })

  it('should return 0 for empty arrays', () => {
    expect(cosineSimilarity([], [])).toBe(0)
  })

  it('should handle normalized vectors', () => {
    // 45-degree angle vectors
    const a = [1, 0]
    const b = [Math.sqrt(0.5), Math.sqrt(0.5)]
    expect(cosineSimilarity(a, b)).toBeCloseTo(Math.sqrt(0.5), 5)
  })

  it('should clamp result to [-1, 1]', () => {
    // Even with floating point issues, should be clamped
    const a = [0.9999999999, 0.0000000001]
    const b = [0.9999999999, 0.0000000001]
    const sim = cosineSimilarity(a, b)
    expect(sim).toBeLessThanOrEqual(1)
    expect(sim).toBeGreaterThanOrEqual(-1)
  })
})

describe('euclideanDistance', () => {
  it('should return 0 for identical vectors', () => {
    const a = [1, 2, 3]
    expect(euclideanDistance(a, a)).toBe(0)
  })

  it('should calculate correct distance for simple case', () => {
    const a = [0, 0]
    const b = [3, 4]
    expect(euclideanDistance(a, b)).toBe(5) // 3-4-5 triangle
  })

  it('should return Infinity for mismatched dimensions', () => {
    const a = [1, 0]
    const b = [1, 0, 0]
    expect(euclideanDistance(a, b)).toBe(Infinity)
  })

  it('should return Infinity for empty arrays', () => {
    expect(euclideanDistance([], [])).toBe(Infinity)
  })

  it('should calculate distance in higher dimensions', () => {
    const a = [1, 1, 1, 1]
    const b = [2, 2, 2, 2]
    expect(euclideanDistance(a, b)).toBe(2) // sqrt(4) = 2
  })
})

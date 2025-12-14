/**
 * Attribute Aggregator
 *
 * Aggregates detection-level attributes (clothing colors, types, embeddings)
 * into track-level aggregated attributes for display and re-identification.
 *
 * Uses weighted voting for colors/types and quality-weighted averaging for embeddings.
 */

import type {
  DetectionAttributes,
  TrackAttributes,
  AggregatedClothingAttributes,
  ColorScore,
  ClothingTypeScore,
} from '../types.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Maximum number of top colors to keep in aggregated attributes
 */
const MAX_DOMINANT_COLORS = ALGORITHM_CONSTANTS.attributeAggregation.maxDominantColors

/**
 * Minimum score threshold for a color to be considered
 */
const MIN_COLOR_SCORE = ALGORITHM_CONSTANTS.attributeAggregation.minColorScore

/**
 * Minimum samples required for reliable embedding aggregation
 */
const MIN_EMBEDDING_SAMPLES = ALGORITHM_CONSTANTS.attributeAggregation.minEmbeddingSamples

/**
 * Aggregates detection attributes into track-level attributes over time.
 * Each track maintains its own AttributeAggregator instance.
 */
export class AttributeAggregator {
  // Color voting: clothing_type -> color_name -> weighted_votes
  private upperColorVotes: Map<string, number> = new Map()
  private lowerColorVotes: Map<string, number> = new Map()

  // Clothing type voting: type_name -> weighted_votes
  private upperTypeVotes: Map<string, number> = new Map()
  private lowerTypeVotes: Map<string, number> = new Map()

  // Embedding accumulation (quality-weighted)
  private embeddingSum: number[] | null = null
  private embeddingWeightSum = 0
  private embeddingCount = 0

  // Sample tracking
  private sampleCount = 0

  /**
   * Add a detection's attributes to the aggregator
   */
  addDetection(attributes: DetectionAttributes): void {
    this.sampleCount++

    // Aggregate upper clothing colors
    if (attributes.upper_clothing?.colors) {
      for (const color of attributes.upper_clothing.colors) {
        if (color.score >= MIN_COLOR_SCORE) {
          const current = this.upperColorVotes.get(color.name) ?? 0
          this.upperColorVotes.set(color.name, current + color.score)
        }
      }
    }

    // Aggregate upper clothing type
    if (attributes.upper_clothing?.type) {
      const current = this.upperTypeVotes.get(attributes.upper_clothing.type.name) ?? 0
      this.upperTypeVotes.set(
        attributes.upper_clothing.type.name,
        current + attributes.upper_clothing.type.score
      )
    }

    // Aggregate lower clothing colors
    if (attributes.lower_clothing?.colors) {
      for (const color of attributes.lower_clothing.colors) {
        if (color.score >= MIN_COLOR_SCORE) {
          const current = this.lowerColorVotes.get(color.name) ?? 0
          this.lowerColorVotes.set(color.name, current + color.score)
        }
      }
    }

    // Aggregate lower clothing type
    if (attributes.lower_clothing?.type) {
      const current = this.lowerTypeVotes.get(attributes.lower_clothing.type.name) ?? 0
      this.lowerTypeVotes.set(
        attributes.lower_clothing.type.name,
        current + attributes.lower_clothing.type.score
      )
    }

    // Aggregate embedding (quality-weighted average)
    if (attributes.embedding && attributes.embedding.length > 0) {
      const quality = attributes.embedding_quality ?? 0.5

      if (this.embeddingSum === null) {
        // First embedding - initialize
        this.embeddingSum = attributes.embedding.map(v => v * quality)
      } else if (this.embeddingSum.length === attributes.embedding.length) {
        // Add weighted embedding
        for (let i = 0; i < attributes.embedding.length; i++) {
          this.embeddingSum[i] += attributes.embedding[i] * quality
        }
      }
      // Skip if embedding dimension mismatch (shouldn't happen with consistent model)

      this.embeddingWeightSum += quality
      this.embeddingCount++
    }
  }

  /**
   * Get aggregated attributes for the track
   */
  getAggregatedAttributes(): TrackAttributes {
    return {
      upper_clothing: this.getAggregatedClothing(this.upperColorVotes, this.upperTypeVotes),
      lower_clothing: this.getAggregatedClothing(this.lowerColorVotes, this.lowerTypeVotes),
      embedding: this.getAggregatedEmbedding(),
      embedding_quality: this.getEmbeddingQuality(),
      sample_count: this.sampleCount,
    }
  }

  /**
   * Check if aggregator has any data
   */
  hasData(): boolean {
    return this.sampleCount > 0
  }

  /**
   * Get the number of samples aggregated
   */
  getSampleCount(): number {
    return this.sampleCount
  }

  /**
   * Clear all accumulated data (for track reset)
   */
  reset(): void {
    this.upperColorVotes.clear()
    this.lowerColorVotes.clear()
    this.upperTypeVotes.clear()
    this.lowerTypeVotes.clear()
    this.embeddingSum = null
    this.embeddingWeightSum = 0
    this.embeddingCount = 0
    this.sampleCount = 0
  }

  /**
   * Aggregate clothing attributes from vote maps
   */
  private getAggregatedClothing(
    colorVotes: Map<string, number>,
    typeVotes: Map<string, number>
  ): AggregatedClothingAttributes {
    // Get dominant colors sorted by vote count
    const dominantColors = this.getDominantColors(colorVotes)

    // Get most voted type
    const type = this.getDominantType(typeVotes)

    return {
      dominant_colors: dominantColors,
      type,
    }
  }

  /**
   * Get top N colors by vote count
   */
  private getDominantColors(colorVotes: Map<string, number>): ColorScore[] {
    if (colorVotes.size === 0) {
      return []
    }

    // Sort by votes descending
    const sorted = [...colorVotes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_DOMINANT_COLORS)

    // Normalize scores to 0-1 (relative to max)
    const maxVotes = sorted[0][1]
    return sorted.map(([name, votes]) => ({
      name,
      score: Math.min(1, votes / maxVotes),
    }))
  }

  /**
   * Get the most voted type
   */
  private getDominantType(typeVotes: Map<string, number>): ClothingTypeScore | undefined {
    if (typeVotes.size === 0) {
      return undefined
    }

    // Find highest voted type
    let maxType = ''
    let maxVotes = 0
    let totalVotes = 0

    for (const [type, votes] of typeVotes) {
      totalVotes += votes
      if (votes > maxVotes) {
        maxVotes = votes
        maxType = type
      }
    }

    if (!maxType) {
      return undefined
    }

    return {
      name: maxType,
      score: Math.min(1, maxVotes / totalVotes), // Confidence based on vote share
    }
  }

  /**
   * Get averaged embedding (quality-weighted)
   */
  private getAggregatedEmbedding(): number[] | undefined {
    if (!this.embeddingSum || this.embeddingWeightSum === 0) {
      return undefined
    }

    if (this.embeddingCount < MIN_EMBEDDING_SAMPLES) {
      // Not enough samples for reliable embedding
      return undefined
    }

    // Normalize by weight sum
    const normalized = this.embeddingSum.map(v => v / this.embeddingWeightSum)

    // L2 normalize the embedding for cosine similarity
    const norm = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0))
    if (norm === 0) {
      return undefined
    }

    return normalized.map(v => v / norm)
  }

  /**
   * Get embedding quality/confidence
   */
  private getEmbeddingQuality(): number {
    if (this.embeddingCount === 0) {
      return 0
    }

    // Quality based on:
    // 1. Number of samples (more = better, saturates at 10)
    // 2. Average quality of input embeddings
    const sampleFactor = Math.min(1, this.embeddingCount / 10)
    const avgQuality = this.embeddingWeightSum / this.embeddingCount

    return sampleFactor * avgQuality
  }
}

/**
 * Compute cosine similarity between two embeddings
 * Both embeddings should already be L2-normalized
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0
  }

  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }

  // Clamp to [-1, 1] for numerical stability
  return Math.max(-1, Math.min(1, dot))
}

/**
 * Compute Euclidean distance between two embeddings
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return Infinity
  }

  let sumSq = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sumSq += diff * diff
  }

  return Math.sqrt(sumSq)
}

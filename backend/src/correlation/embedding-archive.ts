/**
 * Embedding Archive - Long-term storage for track embeddings
 *
 * When tracks expire, their embeddings are archived here for potential
 * re-identification when the same person reappears after a long gap.
 * This enables re-ID across gaps of minutes rather than seconds.
 */

import type { GlobalTrack, CameraDetection } from '../types.js'
import { cosineSimilarity } from '../tracks/attribute-aggregator.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Archived embedding entry
 */
export interface ArchivedEmbedding {
  /** Original global track ID */
  globalTrackId: string
  /** Averaged embedding vector */
  embedding: number[]
  /** Embedding quality (0-1) */
  quality: number
  /** Last known position */
  lastPosition: { x: number; y: number }
  /** Time when track was archived */
  archivedAt: number
  /** Time when track was last seen */
  lastSeen: number
  /** Camera IDs that saw this track */
  cameraIds: string[]
  /** Number of detections used to build embedding */
  sampleCount: number
}

/**
 * Match result from archive search
 */
export interface ArchiveMatchResult {
  /** Matched archived entry */
  entry: ArchivedEmbedding | null
  /** Cosine similarity score */
  similarity: number
  /** Combined confidence considering quality and recency */
  confidence: number
}

/**
 * Configuration for embedding archive
 */
export interface EmbeddingArchiveConfig {
  /** Maximum archive age in ms (default: 10 minutes) */
  maxArchiveAgeMs: number
  /** Minimum embedding quality to archive */
  minQualityToArchive: number
  /** Minimum sample count to archive (default: 3) */
  minSampleCount: number
  /** Minimum similarity for a match (default: 0.80) */
  minSimilarity: number
  /** Maximum entries in archive (default: 100) */
  maxEntries: number
}

const DEFAULT_CONFIG: EmbeddingArchiveConfig = {
  maxArchiveAgeMs: 10 * 60 * 1000, // 10 minutes
  minQualityToArchive: ALGORITHM_CONSTANTS.reid.minEmbeddingQuality,
  minSampleCount: 3,
  minSimilarity: 0.80,
  maxEntries: 100,
}

/**
 * Archive for expired track embeddings enabling long-term re-identification
 */
export class EmbeddingArchive {
  private archive: Map<string, ArchivedEmbedding> = new Map()
  private config: EmbeddingArchiveConfig

  constructor(config: Partial<EmbeddingArchiveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Archive a track's embedding when it expires
   */
  archiveTrack(track: GlobalTrack, timestamp: number): boolean {
    const embedding = track.attributes?.embedding
    const quality = track.attributes?.embedding_quality ?? 0
    const sampleCount = track.attributes?.sample_count ?? 1

    // Only archive high-quality embeddings with enough samples
    if (!embedding || embedding.length === 0) {
      return false
    }
    if (quality < this.config.minQualityToArchive) {
      return false
    }
    if (sampleCount < this.config.minSampleCount) {
      return false
    }

    const cameraIds = Array.from(track.cameraAssociations.keys())

    const entry: ArchivedEmbedding = {
      globalTrackId: track.globalTrackId,
      embedding: [...embedding], // Copy to avoid mutation
      quality,
      lastPosition: { ...track.currentPosition },
      archivedAt: timestamp,
      lastSeen: track.lastSeen,
      cameraIds,
      sampleCount,
    }

    this.archive.set(track.globalTrackId, entry)

    // Enforce max entries limit
    if (this.archive.size > this.config.maxEntries) {
      this.evictOldest()
    }

    return true
  }

  /**
   * Find best matching archived embedding for a detection
   */
  findMatch(
    detection: CameraDetection,
    timestamp: number,
    excludeTrackIds?: Set<string>
  ): ArchiveMatchResult {
    const detectionEmbedding = detection.attributes?.embedding
    const detectionQuality = detection.attributes?.embedding_quality ?? 0

    if (!detectionEmbedding || detectionEmbedding.length === 0) {
      return { entry: null, similarity: 0, confidence: 0 }
    }

    let bestEntry: ArchivedEmbedding | null = null
    let bestSimilarity = this.config.minSimilarity
    let secondBestSimilarity = 0
    let bestConfidence = 0

    for (const [trackId, entry] of this.archive) {
      // Skip excluded tracks (already active)
      if (excludeTrackIds?.has(trackId)) {
        continue
      }

      // Skip expired entries
      const age = timestamp - entry.archivedAt
      if (age > this.config.maxArchiveAgeMs) {
        continue
      }

      // Calculate cosine similarity
      const similarity = cosineSimilarity(detectionEmbedding, entry.embedding)

      if (similarity > bestSimilarity) {
        // Calculate confidence based on:
        // - Similarity score
        // - Both embedding qualities
        // - Sample count (more samples = more reliable)
        // - Recency (more recent = more reliable)
        const qualityFactor = Math.sqrt(detectionQuality * entry.quality)
        const sampleFactor = Math.min(1.0, entry.sampleCount / 10)
        const recencyFactor = 1.0 - (age / this.config.maxArchiveAgeMs) * 0.3 // Up to 30% decay

        const confidence = similarity * qualityFactor * sampleFactor * recencyFactor

        // Track second best for margin calculation
        secondBestSimilarity = bestSimilarity
        bestSimilarity = similarity
        bestEntry = entry
        bestConfidence = confidence
      } else if (similarity > secondBestSimilarity) {
        secondBestSimilarity = similarity
      }
    }

    // Require a margin between best and second-best to avoid ambiguous matches
    // If multiple archived tracks have similar similarity, it's risky to match
    const margin = bestSimilarity - secondBestSimilarity
    const minMargin = 0.05 // Require at least 5% margin
    if (margin < minMargin && secondBestSimilarity > 0) {
      // Ambiguous match - don't return it
      return { entry: null, similarity: 0, confidence: 0 }
    }

    return {
      entry: bestEntry,
      similarity: bestSimilarity,
      confidence: bestConfidence,
    }
  }

  /**
   * Remove an entry from archive (e.g., when track is re-identified)
   */
  remove(globalTrackId: string): boolean {
    return this.archive.delete(globalTrackId)
  }

  /**
   * Clean up expired entries
   */
  cleanup(timestamp: number): number {
    let removed = 0
    for (const [trackId, entry] of this.archive) {
      const age = timestamp - entry.archivedAt
      if (age > this.config.maxArchiveAgeMs) {
        this.archive.delete(trackId)
        removed++
      }
    }
    return removed
  }

  /**
   * Evict oldest entry to make room
   */
  private evictOldest(): void {
    let oldestId: string | null = null
    let oldestTime = Infinity

    for (const [trackId, entry] of this.archive) {
      if (entry.archivedAt < oldestTime) {
        oldestTime = entry.archivedAt
        oldestId = trackId
      }
    }

    if (oldestId) {
      this.archive.delete(oldestId)
    }
  }

  /**
   * Get archive size
   */
  get size(): number {
    return this.archive.size
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.archive.clear()
  }

  /**
   * Get all archived track IDs
   */
  getArchivedTrackIds(): string[] {
    return Array.from(this.archive.keys())
  }
}

/**
 * Default singleton instance
 */
let defaultArchive: EmbeddingArchive | null = null

/**
 * Get default embedding archive instance
 */
export function getEmbeddingArchive(): EmbeddingArchive {
  if (!defaultArchive) {
    defaultArchive = new EmbeddingArchive()
  }
  return defaultArchive
}

/**
 * Reset default archive (for testing)
 */
export function resetEmbeddingArchive(): void {
  defaultArchive = null
}

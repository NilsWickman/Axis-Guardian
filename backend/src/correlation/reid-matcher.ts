/**
 * ReID Matcher - Embedding-based Person Re-Identification
 *
 * Uses cosine similarity between detection and track embeddings for:
 * 1. Cross-camera track correlation (handoff between cameras)
 * 2. Occlusion recovery (re-identify person after they reappear)
 * 3. Track stitching (merge fragmented tracks)
 */

import type { GlobalTrack, CameraDetection } from '../types.js'
import { cosineSimilarity } from '../tracks/attribute-aggregator.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Configuration for re-ID matching
 */
export interface ReIDMatcherConfig {
  /** Minimum cosine similarity to consider a match (0-1, default 0.85) */
  minSimilarity: number
  /** Bonus multiplier for same-camera re-ID (default 1.1) */
  sameCameraBonus: number
  /** Maximum age in ms for a track to be considered for re-ID (default 7000) */
  maxTrackAgeMs: number
  /** Minimum embedding quality to use in matching (default 0.3) */
  minEmbeddingQuality: number
}

const DEFAULT_CONFIG: ReIDMatcherConfig = {
  minSimilarity: ALGORITHM_CONSTANTS.reid.minSimilarity,
  sameCameraBonus: ALGORITHM_CONSTANTS.reid.sameCameraBonus,
  maxTrackAgeMs: ALGORITHM_CONSTANTS.reid.maxTrackAgeMs,
  minEmbeddingQuality: ALGORITHM_CONSTANTS.reid.minEmbeddingQuality,
}

/**
 * Result of a re-ID match attempt
 */
export interface ReIDMatchResult {
  /** Matched track, if found */
  track: GlobalTrack | null
  /** Cosine similarity score (0-1) */
  similarity: number
  /** Confidence in the match (accounts for embedding quality) */
  confidence: number
  /** Was same-camera bonus applied? */
  sameCameraMatch: boolean
}

/**
 * ReID Matcher for embedding-based person re-identification
 */
export class ReIDMatcher {
  private config: ReIDMatcherConfig

  constructor(config: Partial<ReIDMatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ReIDMatcherConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Find the best matching track for a detection using embedding similarity
   *
   * @param detection - Detection with embedding to match
   * @param candidateTracks - Tracks to consider for matching
   * @param timestamp - Current timestamp for age filtering
   * @returns Match result with best track and similarity score
   */
  findBestMatch(
    detection: CameraDetection,
    candidateTracks: GlobalTrack[],
    timestamp: number
  ): ReIDMatchResult {
    const detectionEmbedding = detection.attributes?.embedding
    const detectionQuality = detection.attributes?.embedding_quality ?? 0.5

    // No embedding = no match
    if (!detectionEmbedding || detectionEmbedding.length === 0) {
      return { track: null, similarity: 0, confidence: 0, sameCameraMatch: false }
    }

    // Skip if detection embedding quality is too low
    if (detectionQuality < this.config.minEmbeddingQuality) {
      return { track: null, similarity: 0, confidence: 0, sameCameraMatch: false }
    }

    let bestTrack: GlobalTrack | null = null
    let bestSimilarity = this.config.minSimilarity
    let bestSameCameraMatch = false

    for (const track of candidateTracks) {
      // Skip tracks without embeddings
      const trackEmbedding = track.attributes?.embedding
      if (!trackEmbedding || trackEmbedding.length === 0) {
        continue
      }

      // Skip tracks with low-quality embeddings
      const trackQuality = track.attributes?.embedding_quality ?? 0
      if (trackQuality < this.config.minEmbeddingQuality) {
        continue
      }

      // Skip tracks that are too old
      const trackAge = timestamp - track.lastSeen
      if (trackAge > this.config.maxTrackAgeMs) {
        continue
      }

      // Calculate cosine similarity
      const similarity = cosineSimilarity(detectionEmbedding, trackEmbedding)

      // Apply same-camera bonus
      const isSameCamera = track.cameraAssociations.has(detection.cameraId)
      const effectiveSimilarity = isSameCamera
        ? similarity * this.config.sameCameraBonus
        : similarity

      if (effectiveSimilarity > bestSimilarity) {
        bestSimilarity = effectiveSimilarity
        bestTrack = track
        bestSameCameraMatch = isSameCamera
      }
    }

    // Calculate confidence based on similarity and embedding qualities
    const confidence = bestTrack
      ? bestSimilarity * Math.sqrt(detectionQuality * (bestTrack.attributes?.embedding_quality ?? 0.5))
      : 0

    return {
      track: bestTrack,
      similarity: bestSimilarity,
      confidence,
      sameCameraMatch: bestSameCameraMatch,
    }
  }

  /**
   * Find the best matching occluded track for re-identification
   * Specialized for tracks in 'occluded' state
   *
   * @param detection - Detection to match
   * @param occludedTracks - Tracks in occluded state
   * @param timestamp - Current timestamp
   * @returns Best matching track or null
   */
  findBestReIDMatch(
    detection: CameraDetection,
    occludedTracks: GlobalTrack[],
    timestamp: number
  ): GlobalTrack | null {
    const result = this.findBestMatch(detection, occludedTracks, timestamp)
    return result.track
  }

  /**
   * Calculate similarity between two tracks (for merging decisions)
   *
   * @param track1 - First track
   * @param track2 - Second track
   * @returns Cosine similarity (0-1) or 0 if either lacks embedding
   */
  calculateTrackSimilarity(track1: GlobalTrack, track2: GlobalTrack): number {
    const emb1 = track1.attributes?.embedding
    const emb2 = track2.attributes?.embedding

    if (!emb1 || !emb2 || emb1.length === 0 || emb2.length === 0) {
      return 0
    }

    return cosineSimilarity(emb1, emb2)
  }

  /**
   * Check if two tracks should be merged based on embedding similarity
   *
   * @param track1 - First track
   * @param track2 - Second track
   * @param spatialDistance - Spatial distance between tracks (meters)
   * @returns True if tracks should be merged
   */
  shouldMergeTracks(
    track1: GlobalTrack,
    track2: GlobalTrack,
    spatialDistance: number
  ): boolean {
    const similarity = this.calculateTrackSimilarity(track1, track2)

    // High similarity (>0.8) can override larger spatial distances
    if (similarity > 0.8 && spatialDistance < 2.0) {
      return true
    }

    // Medium similarity needs closer spatial distance
    if (similarity > this.config.minSimilarity && spatialDistance < 0.8) {
      return true
    }

    return false
  }

  /**
   * Rank candidate tracks by embedding similarity
   *
   * @param detection - Detection to match
   * @param candidateTracks - Tracks to rank
   * @param timestamp - Current timestamp
   * @returns Tracks ranked by similarity (highest first)
   */
  rankByEmbeddingSimilarity(
    detection: CameraDetection,
    candidateTracks: GlobalTrack[],
    timestamp: number
  ): Array<{ track: GlobalTrack; similarity: number }> {
    const detectionEmbedding = detection.attributes?.embedding

    if (!detectionEmbedding || detectionEmbedding.length === 0) {
      return []
    }

    const ranked: Array<{ track: GlobalTrack; similarity: number }> = []

    for (const track of candidateTracks) {
      const trackEmbedding = track.attributes?.embedding
      if (!trackEmbedding || trackEmbedding.length === 0) {
        continue
      }

      const trackAge = timestamp - track.lastSeen
      if (trackAge > this.config.maxTrackAgeMs) {
        continue
      }

      const similarity = cosineSimilarity(detectionEmbedding, trackEmbedding)
      ranked.push({ track, similarity })
    }

    // Sort by similarity descending
    ranked.sort((a, b) => b.similarity - a.similarity)

    return ranked
  }
}

/**
 * Default singleton instance
 */
let defaultMatcher: ReIDMatcher | null = null

/**
 * Get default ReID matcher instance
 */
export function getReIDMatcher(): ReIDMatcher {
  if (!defaultMatcher) {
    defaultMatcher = new ReIDMatcher()
  }
  return defaultMatcher
}

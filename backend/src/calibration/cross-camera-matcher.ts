/**
 * Cross-Camera Matcher
 *
 * Discovers same-person detections across different cameras using:
 * 1. ReID embedding similarity (OSNet 512-dim)
 * 2. TrackTruths.json ground truth validation
 *
 * These matches are used to calibrate camera projections by finding
 * parameter values that make cross-camera projections converge.
 */

import { readFileSync, existsSync } from 'fs'
import { gunzipSync } from 'zlib'
import { cosineSimilarity } from '../tracks/attribute-aggregator.js'
import type {
  CrossCameraMatch,
  MatchDiscoveryConfig,
  MatchableDetection,
  NormalizedBBox,
  DetectionFile,
  TrackTruthsFile,
} from './types.js'

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_MATCH_CONFIG: MatchDiscoveryConfig = {
  minSimilarity: 0.70,           // Increased from 0.65 for higher quality matches
  maxFrameGapMs: 100,
  minMatchesRequired: 50,
  minEmbeddingQuality: 0.6,      // Increased from 0.5 for better embeddings
}

// ============================================================================
// File Loading
// ============================================================================

/**
 * Load a JSON file, automatically handling .gz compression
 */
function loadJsonOrGz<T>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = readFileSync(filePath)

  if (filePath.endsWith('.gz')) {
    return JSON.parse(gunzipSync(content).toString('utf-8')) as T
  }

  return JSON.parse(content.toString('utf-8')) as T
}

/**
 * Load a detection file (.json or .json.gz)
 */
export function loadDetectionFile(filePath: string): DetectionFile {
  return loadJsonOrGz<DetectionFile>(filePath)
}

/**
 * Load TrackTruths annotation file
 */
export function loadTrackTruths(filePath: string): TrackTruthsFile {
  if (!existsSync(filePath)) {
    throw new Error(`TrackTruths file not found: ${filePath}`)
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as TrackTruthsFile
}

// ============================================================================
// Bounding Box Utilities
// ============================================================================

/**
 * Convert detection bbox [x, y, w, h] to normalized bbox structure
 */
function convertBBox(bbox: [number, number, number, number]): NormalizedBBox {
  const [x, y, w, h] = bbox
  return {
    centerX: x + w / 2,
    centerY: y + h / 2,
    width: w,
    height: h,
    bottomY: y + h, // Foot position for ground projection
  }
}

// ============================================================================
// Frame Synchronization
// ============================================================================

/**
 * Build an index of detections by timestamp bucket for efficient matching
 *
 * @param detectionFiles Map of cameraId -> DetectionFile
 * @param syncWindowMs Time window for considering detections simultaneous
 * @returns Map of bucketKey -> Map of cameraId -> MatchableDetection[]
 */
function buildFrameIndex(
  detectionFiles: Map<string, DetectionFile>,
  syncWindowMs: number
): Map<number, Map<string, MatchableDetection[]>> {
  const index = new Map<number, Map<string, MatchableDetection[]>>()

  for (const [cameraId, file] of detectionFiles) {
    for (const frame of file.frames) {
      // Quantize timestamp to syncWindowMs buckets
      const timestampMs = frame.timestamp * 1000
      const bucketKey = Math.round(timestampMs / syncWindowMs) * syncWindowMs

      if (!index.has(bucketKey)) {
        index.set(bucketKey, new Map())
      }

      const cameraMap = index.get(bucketKey)!
      if (!cameraMap.has(cameraId)) {
        cameraMap.set(cameraId, [])
      }

      // Extract matchable detections (those with embeddings)
      for (const det of frame.detections) {
        if (
          det.attributes?.embedding &&
          det.attributes.embedding.length > 0 &&
          det.class_name === 'person'
        ) {
          const quality = det.attributes.embedding_quality ?? 0.5

          cameraMap.get(cameraId)!.push({
            cameraId,
            frameNumber: frame.frame_number,
            timestamp: frame.timestamp,
            trackId: det.track_id ?? -1,
            bbox: convertBBox(det.bbox),
            embedding: det.attributes.embedding,
            embeddingQuality: quality,
            confidence: det.confidence,
          })
        }
      }
    }
  }

  return index
}

// ============================================================================
// TrackTruths Validation
// ============================================================================

/**
 * Build a lookup table from camera-track pairs to person IDs
 *
 * TrackTruths format: globalTrackId like "camera1-5" -> personId
 */
function buildTrackTruthsLookup(
  trackTruths: TrackTruthsFile
): Map<string, number> {
  const lookup = new Map<string, number>()

  for (const ann of trackTruths.annotations) {
    lookup.set(ann.globalTrackId, ann.personId)
  }

  return lookup
}

/**
 * Check if two detections represent the same person according to TrackTruths
 *
 * @returns personId if both detections map to the same person, undefined otherwise
 */
function validateWithTrackTruths(
  det1: MatchableDetection,
  det2: MatchableDetection,
  trackTruthsLookup: Map<string, number> | null
): number | undefined {
  if (!trackTruthsLookup) return undefined

  // Build potential globalTrackId patterns
  // Format: "camera1-5" where 5 is the YOLO track_id
  const id1 = `${det1.cameraId}-${det1.trackId}`
  const id2 = `${det2.cameraId}-${det2.trackId}`

  const personId1 = trackTruthsLookup.get(id1)
  const personId2 = trackTruthsLookup.get(id2)

  // Both must be annotated and match
  if (personId1 !== undefined && personId2 !== undefined && personId1 === personId2) {
    return personId1
  }

  return undefined
}

// ============================================================================
// Match Discovery
// ============================================================================

/**
 * Find all cross-camera matches using embedding similarity
 *
 * @param detectionFiles Map of cameraId -> DetectionFile
 * @param trackTruths Optional TrackTruths for validation
 * @param config Match discovery configuration
 * @returns Array of CrossCameraMatch
 */
export function discoverCrossMatches(
  detectionFiles: Map<string, DetectionFile>,
  trackTruths: TrackTruthsFile | null = null,
  config: Partial<MatchDiscoveryConfig> = {}
): CrossCameraMatch[] {
  const cfg = { ...DEFAULT_MATCH_CONFIG, ...config }
  const matches: CrossCameraMatch[] = []

  // Build TrackTruths lookup if available
  const trackTruthsLookup = trackTruths
    ? buildTrackTruthsLookup(trackTruths)
    : null

  // Build synchronized frame index
  const frameIndex = buildFrameIndex(detectionFiles, cfg.maxFrameGapMs)
  const cameras = Array.from(detectionFiles.keys())

  if (cameras.length < 2) {
    console.warn('[CrossCameraMatcher] Need at least 2 cameras for cross-camera matching')
    return []
  }

  console.log(`[CrossCameraMatcher] Searching ${frameIndex.size} time buckets across ${cameras.length} cameras`)

  // For each synchronized time bucket
  for (const [, cameraMap] of frameIndex) {
    // Compare each camera pair
    for (let i = 0; i < cameras.length - 1; i++) {
      for (let j = i + 1; j < cameras.length; j++) {
        const cam1Dets = cameraMap.get(cameras[i]) ?? []
        const cam2Dets = cameraMap.get(cameras[j]) ?? []

        // Find matching pairs using embedding similarity
        for (const det1 of cam1Dets) {
          // Skip low quality embeddings
          if (det1.embeddingQuality < cfg.minEmbeddingQuality) continue

          for (const det2 of cam2Dets) {
            // Skip low quality embeddings
            if (det2.embeddingQuality < cfg.minEmbeddingQuality) continue

            // Calculate embedding similarity
            const similarity = cosineSimilarity(det1.embedding, det2.embedding)

            if (similarity >= cfg.minSimilarity) {
              // Validate against TrackTruths if available
              const personId = validateWithTrackTruths(det1, det2, trackTruthsLookup)

              matches.push({
                timestamp: (det1.timestamp + det2.timestamp) / 2,
                detection1: det1,
                detection2: det2,
                similarity,
                personId,
                isValidated: personId !== undefined,
              })
            }
          }
        }
      }
    }
  }

  // Filter ambiguous matches (same detection matched to multiple others)
  const filteredMatches = filterAmbiguousMatches(matches, cfg)

  const validatedCount = filteredMatches.filter(m => m.isValidated).length
  console.log(`[CrossCameraMatcher] Found ${filteredMatches.length} matches (${validatedCount} validated by TrackTruths)`)

  return filteredMatches
}

/**
 * Filter out ambiguous matches where the same detection matches multiple others
 *
 * For each detection, keep only the highest-similarity match
 */
function filterAmbiguousMatches(
  matches: CrossCameraMatch[],
  _config: MatchDiscoveryConfig
): CrossCameraMatch[] {
  // Group matches by detection (from both sides)
  const det1BestMatch = new Map<string, CrossCameraMatch>()
  const det2BestMatch = new Map<string, CrossCameraMatch>()

  for (const match of matches) {
    const det1Key = `${match.detection1.cameraId}-${match.detection1.frameNumber}-${match.detection1.trackId}`
    const det2Key = `${match.detection2.cameraId}-${match.detection2.frameNumber}-${match.detection2.trackId}`

    // Check if this is the best match for det1
    const existing1 = det1BestMatch.get(det1Key)
    if (!existing1 || match.similarity > existing1.similarity) {
      det1BestMatch.set(det1Key, match)
    }

    // Check if this is the best match for det2
    const existing2 = det2BestMatch.get(det2Key)
    if (!existing2 || match.similarity > existing2.similarity) {
      det2BestMatch.set(det2Key, match)
    }
  }

  // Keep only matches that are best from both sides (mutual best match)
  const filtered: CrossCameraMatch[] = []
  const seen = new Set<string>()

  for (const match of matches) {
    const det1Key = `${match.detection1.cameraId}-${match.detection1.frameNumber}-${match.detection1.trackId}`
    const det2Key = `${match.detection2.cameraId}-${match.detection2.frameNumber}-${match.detection2.trackId}`
    const matchKey = `${det1Key}|${det2Key}`

    // Skip if already added
    if (seen.has(matchKey)) continue

    // Check if this is the mutual best match
    const best1 = det1BestMatch.get(det1Key)
    const best2 = det2BestMatch.get(det2Key)

    if (best1 === match && best2 === match) {
      filtered.push(match)
      seen.add(matchKey)
    }
  }

  return filtered
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Compute statistics about discovered matches
 */
export function computeMatchStatistics(matches: CrossCameraMatch[]): {
  totalMatches: number
  validatedMatches: number
  cameraPairs: Map<string, number>
  similarityDistribution: { min: number; max: number; mean: number; median: number }
  personIdCounts: Map<number, number>
} {
  const cameraPairs = new Map<string, number>()
  const personIdCounts = new Map<number, number>()
  const similarities: number[] = []

  for (const match of matches) {
    // Count camera pairs
    const pairKey = [match.detection1.cameraId, match.detection2.cameraId].sort().join('-')
    cameraPairs.set(pairKey, (cameraPairs.get(pairKey) ?? 0) + 1)

    // Track similarities
    similarities.push(match.similarity)

    // Count person IDs
    if (match.personId !== undefined) {
      personIdCounts.set(match.personId, (personIdCounts.get(match.personId) ?? 0) + 1)
    }
  }

  // Calculate similarity distribution
  similarities.sort((a, b) => a - b)
  const mean = similarities.length > 0
    ? similarities.reduce((a, b) => a + b, 0) / similarities.length
    : 0
  const median = similarities.length > 0
    ? similarities[Math.floor(similarities.length / 2)]
    : 0

  return {
    totalMatches: matches.length,
    validatedMatches: matches.filter(m => m.isValidated).length,
    cameraPairs,
    similarityDistribution: {
      min: similarities[0] ?? 0,
      max: similarities[similarities.length - 1] ?? 0,
      mean,
      median,
    },
    personIdCounts,
  }
}

/**
 * Track Stitcher
 *
 * Post-processes detection data to stitch fragmented tracks back together.
 * YOLOv8's built-in tracker loses track IDs on occlusion/lost detection,
 * assigning new IDs when people reappear. This module identifies and fixes
 * these fragmentations based on spatial proximity and temporal continuity.
 */

import type { DetectionData, Detection } from '../types.js'

// Bbox can be either format: [x,y,w,h] or {left,top,right,bottom}
type BboxArray = [number, number, number, number]
type BboxObject = { left: number; top: number; right: number; bottom: number }
type Bbox = BboxArray | BboxObject

interface TrackLifecycle {
  trackId: number
  firstFrame: number
  lastFrame: number
  firstBbox: Bbox
  lastBbox: Bbox
  frameCount: number
}

export interface StitchResult {
  originalTrackCount: number
  stitchedTrackCount: number
  stitchesPerformed: number
}

/**
 * Configuration for track stitching
 */
export interface StitchConfig {
  /** Maximum frames gap to consider stitching (default: 30 = 1 second at 30fps) */
  maxFrameGap: number
  /** Maximum position distance (normalized 0-1) to consider same person (default: 0.15) */
  maxPositionDistance: number
  /** Minimum frames a track must exist to be considered for stitching (default: 3) */
  minTrackFrames: number
}

const DEFAULT_STITCH_CONFIG: StitchConfig = {
  maxFrameGap: 30,
  maxPositionDistance: 0.15,
  minTrackFrames: 3,
}

/**
 * Get center of bounding box (handles both formats)
 */
function getBboxCenter(bbox: Bbox): { x: number; y: number } {
  if (Array.isArray(bbox)) {
    return { x: bbox[0] + bbox[2] / 2, y: bbox[1] + bbox[3] / 2 }
  } else {
    return { x: (bbox.left + bbox.right) / 2, y: (bbox.top + bbox.bottom) / 2 }
  }
}

/**
 * Calculate distance between two bounding box centers
 */
function calculateDistance(bbox1: Bbox, bbox2: Bbox): number {
  const c1 = getBboxCenter(bbox1)
  const c2 = getBboxCenter(bbox2)
  return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2)
}

/**
 * Find the root of a track ID in the union-find structure
 */
function findRoot(trackIdMap: Map<number, number>, id: number): number {
  let root = id
  while (trackIdMap.has(root) && trackIdMap.get(root) !== root) {
    root = trackIdMap.get(root)!
  }
  // Path compression
  let current = id
  while (trackIdMap.has(current) && trackIdMap.get(current) !== root) {
    const next = trackIdMap.get(current)!
    trackIdMap.set(current, root)
    current = next
  }
  return root
}

/**
 * Stitch fragmented tracks in detection data
 * Modifies the data in-place and returns statistics
 */
export function stitchTracks(
  data: DetectionData,
  config: Partial<StitchConfig> = {}
): StitchResult {
  const cfg = { ...DEFAULT_STITCH_CONFIG, ...config }

  // First pass: collect track lifecycles
  const lifecycles = new Map<number, TrackLifecycle>()

  for (const frame of data.frames) {
    for (const det of frame.detections) {
      if (det.track_id === undefined) continue

      const existing = lifecycles.get(det.track_id)
      if (!existing) {
        lifecycles.set(det.track_id, {
          trackId: det.track_id,
          firstFrame: frame.frame_number,
          lastFrame: frame.frame_number,
          firstBbox: det.bbox as Bbox,
          lastBbox: det.bbox as Bbox,
          frameCount: 1,
        })
      } else {
        existing.lastFrame = frame.frame_number
        existing.lastBbox = det.bbox as Bbox
        existing.frameCount++
      }
    }
  }

  const originalTrackCount = lifecycles.size

  // Convert to sorted array for efficient matching
  const tracks = Array.from(lifecycles.values())
    .filter(t => t.frameCount >= cfg.minTrackFrames)
    .sort((a, b) => a.firstFrame - b.firstFrame)

  // Build union-find mapping: which track IDs should be merged
  const trackIdMap = new Map<number, number>()
  let stitchesPerformed = 0

  // For each track, find if it should be stitched to a previous track
  const usedAsStitchTarget = new Set<number>()

  for (let i = 0; i < tracks.length; i++) {
    const current = tracks[i]

    // Look for a track that ended recently and is spatially close
    let bestMatch: TrackLifecycle | null = null
    let bestDistance = Infinity

    for (let j = i - 1; j >= 0; j--) {
      const candidate = tracks[j]

      // Skip if this track is already used as a stitch target
      if (usedAsStitchTarget.has(candidate.trackId)) continue

      // Check frame gap
      const frameGap = current.firstFrame - candidate.lastFrame
      if (frameGap <= 0) continue // Overlapping tracks
      if (frameGap > cfg.maxFrameGap) continue // Too far apart

      // Check spatial distance
      const dist = calculateDistance(candidate.lastBbox, current.firstBbox)
      if (dist < cfg.maxPositionDistance && dist < bestDistance) {
        bestDistance = dist
        bestMatch = candidate
      }
    }

    if (bestMatch) {
      // Stitch: map current track ID to the matched track's root ID
      const rootId = findRoot(trackIdMap, bestMatch.trackId)
      trackIdMap.set(current.trackId, rootId)
      usedAsStitchTarget.add(bestMatch.trackId)
      stitchesPerformed++
    }
  }

  // Second pass: apply the mapping to all detections
  for (const frame of data.frames) {
    for (const det of frame.detections) {
      if (det.track_id === undefined) continue
      const rootId = findRoot(trackIdMap, det.track_id)
      if (rootId !== det.track_id) {
        det.track_id = rootId
      }
    }
  }

  // Count unique track IDs after stitching
  const stitchedTrackIds = new Set<number>()
  for (const frame of data.frames) {
    for (const det of frame.detections) {
      if (det.track_id !== undefined) {
        stitchedTrackIds.add(det.track_id)
      }
    }
  }

  return {
    originalTrackCount,
    stitchedTrackCount: stitchedTrackIds.size,
    stitchesPerformed,
  }
}

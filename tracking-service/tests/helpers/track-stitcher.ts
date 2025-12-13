/**
 * Track Stitcher for Test Data
 *
 * Post-processes detection data to stitch fragmented tracks back together.
 * This reduces fragmentation from YOLOv8's tracker in the preprocessed detection files.
 */

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

export interface StitchConfig {
  maxFrameGap: number
  maxPositionDistance: number
  minTrackFrames: number
}

const DEFAULT_CONFIG: StitchConfig = {
  maxFrameGap: 30,
  maxPositionDistance: 0.15,
  minTrackFrames: 3,
}

function getBboxCenter(bbox: Bbox): { x: number; y: number } {
  if (Array.isArray(bbox)) {
    return { x: bbox[0] + bbox[2] / 2, y: bbox[1] + bbox[3] / 2 }
  } else {
    return { x: (bbox.left + bbox.right) / 2, y: (bbox.top + bbox.bottom) / 2 }
  }
}

function calculateDistance(bbox1: Bbox, bbox2: Bbox): number {
  const c1 = getBboxCenter(bbox1)
  const c2 = getBboxCenter(bbox2)
  return Math.sqrt((c2.x - c1.x) ** 2 + (c2.y - c1.y) ** 2)
}

function findRoot(trackIdMap: Map<number, number>, id: number): number {
  let root = id
  while (trackIdMap.has(root) && trackIdMap.get(root) !== root) {
    root = trackIdMap.get(root)!
  }
  return root
}

interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Array<{
    bbox: Bbox
    confidence: number
    class_name: string
    track_id: number
  }>
}

interface DetectionFile {
  frames: DetectionFrame[]
}

/**
 * Stitch fragmented tracks in detection data
 * Modifies the data in-place and returns statistics
 */
export function stitchTracks(
  data: DetectionFile,
  config: Partial<StitchConfig> = {}
): StitchResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }

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
          firstBbox: det.bbox,
          lastBbox: det.bbox,
          frameCount: 1,
        })
      } else {
        existing.lastFrame = frame.frame_number
        existing.lastBbox = det.bbox
        existing.frameCount++
      }
    }
  }

  const originalTrackCount = lifecycles.size

  // Convert to sorted array for efficient matching
  const tracks = Array.from(lifecycles.values())
    .filter(t => t.frameCount >= cfg.minTrackFrames)
    .sort((a, b) => a.firstFrame - b.firstFrame)

  // Build union-find mapping
  const trackIdMap = new Map<number, number>()
  let stitchesPerformed = 0
  const usedAsStitchTarget = new Set<number>()

  for (let i = 0; i < tracks.length; i++) {
    const current = tracks[i]
    let bestMatch: TrackLifecycle | null = null
    let bestDistance = Infinity

    for (let j = i - 1; j >= 0; j--) {
      const candidate = tracks[j]
      if (usedAsStitchTarget.has(candidate.trackId)) continue

      const frameGap = current.firstFrame - candidate.lastFrame
      if (frameGap <= 0 || frameGap > cfg.maxFrameGap) continue

      const dist = calculateDistance(candidate.lastBbox, current.firstBbox)
      if (dist < cfg.maxPositionDistance && dist < bestDistance) {
        bestDistance = dist
        bestMatch = candidate
      }
    }

    if (bestMatch) {
      const rootId = findRoot(trackIdMap, bestMatch.trackId)
      trackIdMap.set(current.trackId, rootId)
      usedAsStitchTarget.add(bestMatch.trackId)
      stitchesPerformed++
    }
  }

  // Apply mapping to all detections
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

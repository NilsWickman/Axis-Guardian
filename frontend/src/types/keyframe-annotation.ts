/**
 * Type definitions for keyframe-based cross-camera annotation system
 */

// =============================================================================
// Detection File Types (matches .detections.json.gz format v2.0)
// =============================================================================

export interface DetectionFileVideoInfo {
  width: number
  height: number
  fps: number
  total_frames: number
  duration: number // seconds
}

export interface DetectionFileConfig {
  model: string
  tracker: string
  confidence_threshold: number
  iou_threshold: number
  reid_enabled: boolean
  color_analysis_enabled: boolean
}

/** Bounding box in [x, y, w, h] normalized format (top-left corner) */
export type NormalizedBbox = [number, number, number, number]

export interface ColorInfo {
  name: string
  score: number
}

export interface ClothingAttributes {
  dominant_colors: ColorInfo[]
  type?: { name: string; score: number }
}

export interface DetectionAttributes {
  embedding?: number[] // 512-dim OSNet vector
  embedding_quality?: number
  upper_clothing?: ClothingAttributes
  lower_clothing?: ClothingAttributes
}

export interface FileDetection {
  bbox: NormalizedBbox // [x, y, w, h] normalized 0-1 (top-left)
  confidence: number
  class_id: number
  class_name: string
  track_id: number
  track_state: 'new' | 'active' | 'lost'
  attributes?: DetectionAttributes
}

export interface DetectionFrame {
  frame_number: number
  timestamp: number // seconds
  detections: FileDetection[]
}

export interface DetectionFileData {
  format_version: string
  detection_config: DetectionFileConfig
  video_info: DetectionFileVideoInfo
  frames: DetectionFrame[]
}

// =============================================================================
// Camera Configuration
// =============================================================================

export interface CameraConfig {
  id: string // e.g., 'camera1'
  label: string // e.g., 'HC3'
  videoPath: string // e.g., '/cameras/view-HC3.mp4'
  detectionsPath: string // e.g., '/cameras/view-HC3.detections.json.gz'
}

// =============================================================================
// Annotation Types
// =============================================================================

export interface KeyframeAnnotation {
  id: string // unique ID
  timestamp: number // seconds
  cameraId: string // which camera was clicked
  trackId: number // detection track_id in that camera
  personId: number // assigned person (0 = Invalid)
  bbox: NormalizedBbox // reference bbox at annotation time
  confidence: number // detection confidence
  assignedAt: string // ISO timestamp
  // Ground truth world position (optional - set by clicking sitemap)
  worldPosition?: { x: number; y: number }
}

export interface PersonDefinition {
  id: number
  label: string
  color: string
  thumbnailUrl?: string
}

export interface AnnotationDataset {
  version: '2.0'
  keyframeIntervalSeconds: number
  videoDuration: number
  cameras: string[]
  annotations: KeyframeAnnotation[]
  persons: PersonDefinition[]
  metadata: {
    createdAt: string
    lastModifiedAt: string
  }
}

// =============================================================================
// Legacy Track Truths Format (TrackTruths.json)
// =============================================================================

export interface LegacyTrackAnnotation {
  id: string
  globalTrackId: string // format: "camera1-5" = cameraId + "-" + trackId
  personId: number
  assignedAt: string
}

export interface LegacyTrackTruths {
  version: string
  annotations: LegacyTrackAnnotation[]
  persons: PersonDefinition[]
}

/**
 * Parse globalTrackId into cameraId and trackId
 */
export function parseGlobalTrackId(globalTrackId: string): { cameraId: string; trackId: number } | null {
  const match = globalTrackId.match(/^(camera\d+)-(\d+)$/)
  if (!match) return null
  return {
    cameraId: match[1],
    trackId: parseInt(match[2], 10),
  }
}

// =============================================================================
// UI State Types
// =============================================================================

export interface SelectedDetection {
  cameraId: string
  trackId: number
  bbox: NormalizedBbox
  timestamp: number
}

export interface CameraDetections {
  cameraId: string
  detections: FileDetection[]
  frameNumber: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Generate unique annotation ID */
export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/** Convert [x, y, w, h] bbox to corner format (for rendering) */
export function bboxToCorners(bbox: NormalizedBbox): {
  left: number
  top: number
  right: number
  bottom: number
} {
  const [x, y, w, h] = bbox
  return {
    left: x,
    top: y,
    right: x + w,
    bottom: y + h,
  }
}

/** Default person colors (21 persons: 0=Invalid + 1-20) */
export const DEFAULT_PERSON_COLORS: string[] = [
  '#6b7280', // 0 - Invalid (gray)
  '#ef4444', // 1 - red
  '#f97316', // 2 - orange
  '#eab308', // 3 - yellow
  '#84cc16', // 4 - lime
  '#22c55e', // 5 - green
  '#14b8a6', // 6 - teal
  '#06b6d4', // 7 - cyan
  '#3b82f6', // 8 - blue
  '#6366f1', // 9 - indigo
  '#8b5cf6', // 10 - violet
  '#a855f7', // 11 - purple
  '#d946ef', // 12 - fuchsia
  '#ec4899', // 13 - pink
  '#f43f5e', // 14 - rose
  '#78716c', // 15 - stone
  '#fbbf24', // 16 - amber
  '#a3e635', // 17 - lime-400
  '#2dd4bf', // 18 - teal-400
  '#38bdf8', // 19 - sky-400
  '#c084fc', // 20 - purple-400
]

/** Create default person definitions */
export function createDefaultPersons(): PersonDefinition[] {
  return DEFAULT_PERSON_COLORS.map((color, id) => ({
    id,
    label: id === 0 ? 'Invalid' : `Person ${id}`,
    color,
    // Mugshot images are available for persons 1-21 in /people/
    thumbnailUrl: id > 0 && id <= 21 ? `/people/person${id}.png` : undefined,
  }))
}

/** Create empty annotation dataset */
export function createEmptyDataset(
  cameras: string[],
  intervalSeconds: number,
  videoDuration: number
): AnnotationDataset {
  const now = new Date().toISOString()
  return {
    version: '2.0',
    keyframeIntervalSeconds: intervalSeconds,
    videoDuration,
    cameras,
    annotations: [],
    persons: createDefaultPersons(),
    metadata: {
      createdAt: now,
      lastModifiedAt: now,
    },
  }
}

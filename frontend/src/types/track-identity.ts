/**
 * Track Identity Annotation Types
 *
 * Types for annotating which tracks represent the same person.
 * Used by the Track Annotator dev page for real-time labeling.
 */

/**
 * A thumbnail extracted from a video frame showing a tracked person
 */
export interface TrackThumbnail {
  /** Data URL of the cropped image (base64) */
  dataUrl: string
  /** Frame number where this was extracted */
  frameNumber: number
  /** Timestamp in seconds */
  timestamp: number
  /** Camera that captured this */
  cameraId: string
  /** Confidence score of the detection */
  confidence: number
}

/**
 * Thumbnails for a specific global track
 */
export interface TrackThumbnailSet {
  globalTrackId: string
  thumbnails: TrackThumbnail[]
  /** When thumbnails were last updated */
  updatedAt: number
}

/**
 * A single track-to-person identity mapping
 */
export interface TrackIdentityAnnotation {
  /** Unique ID for this annotation */
  id: string

  /** The globalTrackId from the tracking system (e.g., "global-1") */
  globalTrackId: string

  /** Human-assigned person identifier (1-10) */
  personId: number

  /** When this assignment was made */
  assignedAt: string // ISO timestamp

  /** Position where assignment was made (for reference) */
  assignedAtPosition?: { x: number; y: number }

  /** Optional notes about the assignment */
  notes?: string
}

/**
 * Person definition for consistent labeling
 */
export interface PersonDefinition {
  id: number
  label: string
  color: string
  /** Optional thumbnail image URL (base64 data URL) */
  thumbnailUrl?: string
}

/**
 * Session metadata
 */
export interface SessionInfo {
  dataSource: 'live' | 'replay'
  replayFile?: string
  startedAt: string
}

/**
 * Full dataset for track identity annotations
 */
export interface TrackIdentityDataset {
  version: '1.0'
  createdAt: string
  updatedAt: string

  /** Session metadata */
  sessionInfo: SessionInfo

  /** All track identity annotations */
  annotations: TrackIdentityAnnotation[]

  /** Person registry - predefined persons */
  persons: PersonDefinition[]
}

// Default person colors (distinct, accessible) - 20 colors
const PERSON_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
  '#6366f1', // indigo
  '#a855f7', // purple
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#64748b', // slate
  '#78716c', // stone
  '#dc2626', // red-600
  '#7c3aed', // violet-600
]

/**
 * Generate default person definitions (1-20)
 */
export function createDefaultPersons(): PersonDefinition[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    label: `Person ${i + 1}`,
    color: PERSON_COLORS[i],
  }))
}

/**
 * Generate unique annotation ID
 */
export function generateAnnotationId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `tid_${timestamp}_${random}`
}

/**
 * Create empty dataset with default persons
 */
export function createEmptyDataset(dataSource: 'live' | 'replay' = 'live'): TrackIdentityDataset {
  const now = new Date().toISOString()
  return {
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    sessionInfo: {
      dataSource,
      startedAt: now,
    },
    annotations: [],
    persons: createDefaultPersons(),
  }
}

/**
 * Validate dataset structure
 */
export function isValidDataset(data: unknown): data is TrackIdentityDataset {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.version === '1.0' &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string' &&
    Array.isArray(d.annotations) &&
    Array.isArray(d.persons)
  )
}

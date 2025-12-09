/**
 * Type definitions for ground truth calibration data
 * Used for manually annotating person positions to create gold standard datasets
 */

export interface GroundTruthDataset {
  version: '1.0'
  createdAt: string
  updatedAt: string
  videoFile: string
  cameraId: string
  room: {
    width: number  // meters
    height: number // meters
  }

  /** Annotated frames with ground truth positions */
  annotations: FrameAnnotation[]

  /** Summary statistics */
  stats: {
    totalFrames: number
    annotatedFrames: number
    totalDetections: number
    annotatedDetections: number
  }
}

export interface FrameAnnotation {
  frameNumber: number
  timestamp: number // seconds
  detections: DetectionAnnotation[]
}

export interface DetectionAnnotation {
  /** Detection track ID from the detection file */
  trackId: number

  /** Original bounding box from detection (normalized 0-1) */
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }

  /** Ground truth position on floor plan (meters) */
  groundPosition: {
    x: number
    y: number
  } | null  // null if not yet annotated

  /** Annotation metadata */
  annotatedAt?: string
  confidence: 'certain' | 'estimated' | 'uncertain'
  notes?: string
}

/** State for the annotation session */
export interface AnnotationSession {
  videoId: string
  cameraId: string
  currentFrame: number
  selectedDetectionIndex: number | null
  isModified: boolean
  lastSavedAt: string | null
}

/** Export format for calibration tool */
export interface CalibrationGroundTruth {
  /** World position in meters */
  positions: Array<{
    x: number
    y: number
  }>
  /** Frame numbers where these positions were observed */
  frameNumbers: number[]
}

/** Helper to create an empty dataset */
export function createEmptyDataset(
  videoFile: string,
  cameraId: string,
  roomWidth: number,
  roomHeight: number
): GroundTruthDataset {
  const now = new Date().toISOString()
  return {
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    videoFile,
    cameraId,
    room: {
      width: roomWidth,
      height: roomHeight
    },
    annotations: [],
    stats: {
      totalFrames: 0,
      annotatedFrames: 0,
      totalDetections: 0,
      annotatedDetections: 0
    }
  }
}

/** Calculate annotation statistics */
export function calculateStats(annotations: FrameAnnotation[]): GroundTruthDataset['stats'] {
  let totalDetections = 0
  let annotatedDetections = 0
  let annotatedFrames = 0

  for (const frame of annotations) {
    totalDetections += frame.detections.length
    let hasAnnotation = false

    for (const det of frame.detections) {
      if (det.groundPosition !== null) {
        annotatedDetections++
        hasAnnotation = true
      }
    }

    if (hasAnnotation) {
      annotatedFrames++
    }
  }

  return {
    totalFrames: annotations.length,
    annotatedFrames,
    totalDetections,
    annotatedDetections
  }
}

// ============================================================================
// Version 2.0 - Cross-Camera Annotation Types
// ============================================================================

/** Bounding box in normalized coordinates (0-1) */
export interface BoundingBox {
  left: number
  top: number
  right: number
  bottom: number
}

/** A detection linked to a cross-camera annotation */
export interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: BoundingBox
}

/** A single cross-camera annotation point */
export interface CrossCameraAnnotation {
  /** Unique identifier for this annotation */
  id: string

  /** Ground truth position on floor plan (meters) */
  groundPosition: {
    x: number
    y: number
  }

  /** Reference timestamp in seconds (for syncing across cameras) */
  timestamp: number

  /** Annotation confidence */
  confidence: 'certain' | 'estimated' | 'uncertain'

  /** When this annotation was created */
  annotatedAt: string

  /** Optional notes */
  notes?: string

  /** Linked detections from one or more cameras */
  linkedDetections: LinkedDetection[]
}

/** Camera source configuration */
export interface CameraSource {
  cameraId: string
  videoFile: string
  detectionsFile: string
}

/** Version 2.0 dataset for cross-camera annotation */
export interface CrossCameraDataset {
  version: '2.0'
  createdAt: string
  updatedAt: string

  /** Room dimensions in meters */
  room: {
    width: number
    height: number
  }

  /** Camera sources used in this dataset */
  cameras: CameraSource[]

  /** Sparse array of cross-camera annotations (only annotated points) */
  annotations: CrossCameraAnnotation[]
}

/** Helper to generate unique IDs */
export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** Helper to create an empty v2.0 dataset */
export function createEmptyCrossCameraDataset(
  cameras: CameraSource[],
  roomWidth: number,
  roomHeight: number
): CrossCameraDataset {
  const now = new Date().toISOString()
  return {
    version: '2.0',
    createdAt: now,
    updatedAt: now,
    room: {
      width: roomWidth,
      height: roomHeight
    },
    cameras,
    annotations: []
  }
}

/** Calculate statistics for cross-camera dataset */
export function calculateCrossCameraStats(dataset: CrossCameraDataset): {
  totalAnnotations: number
  annotationsPerCamera: Record<string, number>
  uniqueTimestamps: number
} {
  const annotationsPerCamera: Record<string, number> = {}
  const timestamps = new Set<number>()

  for (const ann of dataset.annotations) {
    timestamps.add(ann.timestamp)
    for (const det of ann.linkedDetections) {
      annotationsPerCamera[det.cameraId] = (annotationsPerCamera[det.cameraId] || 0) + 1
    }
  }

  return {
    totalAnnotations: dataset.annotations.length,
    annotationsPerCamera,
    uniqueTimestamps: timestamps.size
  }
}

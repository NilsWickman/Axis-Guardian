/**
 * Detection Types
 *
 * Types for camera detections from YOLOv8 + Re-ID preprocessing.
 */

// ============================================================================
// Detection Attributes (from YOLOv8 + Re-ID preprocessing)
// ============================================================================

/**
 * Color with confidence score
 */
export interface ColorScore {
  name: string
  score: number
}

/**
 * Clothing type with confidence score
 */
export interface ClothingTypeScore {
  name: string // e.g., 'jacket', 'shirt', 'dress', 'jeans', 'shorts'
  score: number
}

/**
 * Clothing attributes (colors and type)
 */
export interface ClothingAttributes {
  colors: ColorScore[]
  type?: ClothingTypeScore
}

/**
 * Person detection attributes from re-ID preprocessing
 * All fields optional for backwards compatibility with old detection files
 */
export interface DetectionAttributes {
  /** Upper body clothing (shirt, jacket, etc.) */
  upper_clothing?: ClothingAttributes
  /** Lower body clothing (pants, shorts, skirt, etc.) */
  lower_clothing?: ClothingAttributes
  /** Re-ID embedding vector (typically 512-dim from OSNet) */
  embedding?: number[]
  /** Quality/confidence of the embedding (0-1) */
  embedding_quality?: number
}

// ============================================================================
// Detection Messages
// ============================================================================

/**
 * Single detection from camera
 */
export interface RawDetection {
  class_name: string
  bbox: [number, number, number, number] // [x, y, w, h] normalized 0-1
  confidence: number
  track_id?: number
  /** Person attributes from re-ID preprocessing (optional for backwards compat) */
  attributes?: DetectionAttributes
}

/**
 * Detection message from camera emulator (msgpack format)
 */
export interface DetectionMessage {
  camera_id: string
  frame_number: number
  timestamp: number // seconds
  detection_count: number
  detections: RawDetection[]
  /** Video time in milliseconds (position within video, for sync) */
  video_time_ms?: number
  /** RTP timestamp (90kHz clock) for frame-perfect sync */
  rtp_timestamp?: number
  /** High-resolution dispatch time in ms (for latency measurement) */
  dispatch_time?: number
}

/**
 * Detection bounding box (can be normalized or pixel coords)
 */
export interface DetectionBBox {
  x: number
  y: number
  width: number
  height: number
}

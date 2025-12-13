/**
 * Types for the camera emulator
 */

export interface CameraConfig {
  cameraId: string
  videoPath: string
  detectionsPath: string
  port: number
  trackingCameraId: string
  trackingServiceUrl: string
}

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
  name: string  // e.g., 'jacket', 'shirt', 'dress', 'jeans', 'shorts'
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
// Detection Types
// ============================================================================

export interface Detection {
  bbox: [number, number, number, number]  // [x, y, width, height] in pixels
  confidence: number
  class_id: number
  class_name: string
  track_id?: number
  track_state?: 'new' | 'active' | 'lost'
  /** Person attributes from re-ID preprocessing (optional for backwards compat) */
  attributes?: DetectionAttributes
}

export interface DetectionFrame {
  frame_number: number
  timestamp: number  // seconds
  detections: Detection[]
  dispatch_time?: number  // High-res ms timestamp for timing measurement
}

export interface DetectionData {
  format_version: string
  video_info: {
    width: number
    height: number
    fps: number
    total_frames: number
    duration: number
  }
  detection_config: {
    model: string
    confidence_threshold: number
    iou_threshold: number
  }
  frames: DetectionFrame[]
}

export interface DetectionMetadata {
  camera_id: string
  frame_number: number
  timestamp: number
  detection_count: number
  detections: Detection[]
  detection_frame?: number
  dispatch_time?: number  // High-res ms timestamp for timing measurement
  video_time_ms?: number  // Video presentation time in ms (for sync with video element)
  rtp_timestamp?: number  // RTP timestamp (90kHz clock) for frame-perfect sync
}

export interface ClientSession {
  id: string
  transport: import('mediasoup').types.WebRtcTransport
  consumer?: import('mediasoup').types.Consumer
  dataConsumer?: import('mediasoup').types.DataConsumer
}

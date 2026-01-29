/**
 * Types for the camera emulator
 */

// Import shared types instead of duplicating
import type {
  ColorScore,
  ClothingTypeScore,
  DetectionAttributes,
} from '@axis-guardian/types'

// Re-export for consumers
export type { ColorScore, ClothingTypeScore, DetectionAttributes }

export interface CameraConfig {
  cameraId: string
  videoPath: string
  detectionsPath: string
  port: number
  trackingCameraId: string
  trackingServiceUrl: string
}

// ClothingAttributes is used locally but not in shared types
// It matches the inline structure in DetectionAttributes
export interface ClothingAttributes {
  colors: Array<{ name: string; score: number }>
  type?: { name: string; score: number }
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

/**
 * Sync coordinator for multi-camera time synchronization
 */
export interface SyncCoordinator {
  /** Shared start time across all cameras (may be a getter for lazy evaluation) */
  readonly sharedStartTime: number
  /** Called when any camera loops - should reset all cameras */
  onSyncReset: () => void
}

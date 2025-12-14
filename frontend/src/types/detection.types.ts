/**
 * Type definitions for object detection system
 */

import type { BoundingBox as ApiBoundingBox } from './generated'

/**
 * Bounding box coordinates in normalized format (0-1 range)
 * Used by WebRTC detection service
 */
export interface NormalizedBoundingBox {
  left: number    // Left edge (0-1)
  top: number     // Top edge (0-1)
  right: number   // Right edge (0-1)
  bottom: number  // Bottom edge (0-1)
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use NormalizedBoundingBox or ApiBoundingBox from generated.ts
 */
export type BoundingBox = NormalizedBoundingBox

/**
 * Convert API bounding box to normalized format
 */
export function apiToNormalizedBbox(bbox: ApiBoundingBox, imageWidth: number, imageHeight: number): NormalizedBoundingBox {
  return {
    left: bbox.x / imageWidth,
    top: bbox.y / imageHeight,
    right: (bbox.x + bbox.width) / imageWidth,
    bottom: (bbox.y + bbox.height) / imageHeight,
  }
}

/**
 * Convert normalized bounding box to API format
 */
export function normalizedToApiBbox(bbox: NormalizedBoundingBox, imageWidth: number, imageHeight: number): ApiBoundingBox {
  return {
    x: bbox.left * imageWidth,
    y: bbox.top * imageHeight,
    width: (bbox.right - bbox.left) * imageWidth,
    height: (bbox.bottom - bbox.top) * imageHeight,
  }
}

/**
 * Single object detection result (WebRTC format)
 */
export interface Detection {
  class_name: string      // Detected object class (e.g., "person", "car")
  confidence: number      // Detection confidence (0.0 - 1.0)
  bbox: NormalizedBoundingBox  // Bounding box coordinates (normalized)
  class_id: number        // COCO class ID
  track_id?: number       // Persistent object tracking ID (ByteTrack)
  track_state?: 'new' | 'active' | 'lost'  // Track lifecycle state
}

/**
 * Timing information for detection pipeline
 */
export interface DetectionTiming {
  // Basic timing
  inference?: number      // Time spent on inference (ms)
  preprocessing?: number  // Time spent on preprocessing (ms)
  postprocessing?: number // Time spent on postprocessing (ms)
  total?: number          // Total processing time (ms)

  // Video synchronization timing
  frame_timestamp?: number       // Frame timestamp in seconds
  processing_latency_ms?: number // Processing latency in ms
  detection_delay_ms?: number    // Detection delay in ms

  // PTS-based synchronization
  pts_based?: boolean            // Whether using PTS-based sync
  video_pts_ms?: number          // Video PTS in milliseconds
  loop_count?: number            // Video loop count
  use_video_pts?: boolean        // Whether to use video PTS
}

/**
 * Detection message received from MQTT
 */
export interface DetectionMessage {
  camera_id: string           // Camera identifier
  timestamp: number           // Message timestamp
  detection_count: number     // Number of detections in this message
  detections: Detection[]     // Array of detection results
  timing?: DetectionTiming    // Optional timing information
}

/**
 * Detection state for a single camera
 */
export interface CameraDetectionState {
  camera_id: string
  last_update: number
  detections: Detection[]
  total_count: number
  timing?: DetectionTiming  // Optional timing information
}

/**
 * Detection statistics by class
 */
export interface DetectionStats {
  [className: string]: number
}

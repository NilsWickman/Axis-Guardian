/**
 * Type definitions for object detection system
 */

/**
 * Bounding box coordinates in normalized format (0-1 range)
 */
export interface BoundingBox {
  left: number    // Left edge (0-1)
  top: number     // Top edge (0-1)
  right: number   // Right edge (0-1)
  bottom: number  // Bottom edge (0-1)
}

/**
 * Single object detection result
 */
export interface Detection {
  class_name: string      // Detected object class (e.g., "person", "car")
  confidence: number      // Detection confidence (0.0 - 1.0)
  bbox: BoundingBox       // Bounding box coordinates (normalized)
}

/**
 * Detection message received from MQTT
 */
export interface DetectionMessage {
  camera_id: string           // Camera identifier
  timestamp: number           // Message timestamp
  detection_count: number     // Number of detections in this message
  detections: Detection[]     // Array of detection results
}

/**
 * Detection state for a single camera
 */
export interface CameraDetectionState {
  camera_id: string
  last_update: number
  detections: Detection[]
  total_count: number
}

/**
 * Detection statistics by class
 */
export interface DetectionStats {
  [className: string]: number
}

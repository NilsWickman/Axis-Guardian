/**
 * Type definitions for object detection system
 */

/**
 * Bounding box coordinates in pixels
 */
export interface BoundingBox {
  x1: number      // Top-left X coordinate
  y1: number      // Top-left Y coordinate
  width: number   // Box width in pixels
  height: number  // Box height in pixels
}

/**
 * Single object detection result
 */
export interface Detection {
  class_name: string      // Detected object class (e.g., "person", "car")
  confidence: number      // Detection confidence (0.0 - 1.0)
  timestamp: number       // Unix timestamp of detection
  bbox: BoundingBox       // Bounding box coordinates
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

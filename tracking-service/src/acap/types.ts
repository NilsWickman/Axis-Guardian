/**
 * ACAP Client Type Definitions
 *
 * Types for receiving analytics scene metadata from Axis cameras via MQTT.
 * Based on the Axis Analytics Scene Description format.
 */

// ============================================================================
// ACAP Message Types (from Axis cameras)
// ============================================================================

/**
 * Classification info for a detected object
 */
export interface AcapClassification {
  /** Object type (e.g., "Human", "Vehicle") */
  type: string
  /** Confidence score 0-1 */
  score: number
  /** Optional clothing color attributes */
  lower_clothing_colors?: Array<{ name: string; score: number }>
  upper_clothing_colors?: Array<{ name: string; score: number }>
}

/**
 * Bounding box in normalized image coordinates (0-1)
 */
export interface AcapBoundingBox {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Geographic position (if camera has geolocation enabled)
 */
export interface AcapGeoPosition {
  latitude: number
  longitude: number
}

/**
 * Single observation (detection) from the analytics scene
 */
export interface AcapObservation {
  /** UUID track identifier from camera */
  track_id: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Bounding box in normalized coordinates */
  bounding_box: AcapBoundingBox
  /** Classification info */
  class: AcapClassification
  /** Optional geographic position */
  geoposition?: AcapGeoPosition
}

/**
 * Frame data containing all observations
 */
export interface AcapFrame {
  /** ISO 8601 timestamp */
  timestamp: string
  /** Array of detected objects */
  observations: AcapObservation[]
}

/**
 * Full ACAP message from MQTT
 */
export interface AcapMessage {
  frame: AcapFrame
}

// ============================================================================
// ACAP Client Configuration
// ============================================================================

/**
 * ACAP client configuration options
 */
export interface AcapClientConfig {
  /** MQTT broker hostname */
  brokerHost: string
  /** MQTT broker port */
  brokerPort: number
  /** Topic prefix for analytics scene data */
  topicPrefix: string
  /** Optional MQTT username */
  username?: string
  /** Optional MQTT password */
  password?: string
  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number
  /** Max reconnect delay in ms (default: 60000) */
  maxReconnectDelay?: number
}

/**
 * ACAP client connection status
 */
export interface AcapConnectionStatus {
  /** Whether connected to MQTT broker */
  connected: boolean
  /** Broker URL */
  brokerUrl: string
  /** Subscribed topics */
  topics: string[]
  /** Number of messages received */
  messagesReceived: number
  /** Number of detections processed */
  detectionsProcessed: number
  /** Last message timestamp */
  lastMessageTime: number | null
  /** Last error message */
  lastError: string | null
  /** Active camera device IDs */
  activeCameras: string[]
}

/**
 * Internal state for tracking per-camera frame numbers
 * (ACAP doesn't provide frame numbers, so we generate them)
 */
export interface CameraFrameState {
  frameNumber: number
  lastTimestamp: number
}

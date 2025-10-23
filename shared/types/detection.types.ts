/**
 * Detection-related types
 *
 * TODO: Generate these from OpenAPI schemas
 */

export interface DetectionEvent {
  detection_id: string;
  device_id: string;
  timestamp: string;
  object: {
    type: 'person' | 'vehicle' | 'animal';
    confidence: number;
    bbox: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
  geo: {
    lat: number;
    lon: number;
    x: number;
    y: number;
  };
  frame_ref?: string;
  sequence_id: number;
  ingest_time: string;
}

export interface NormalizedDetection extends DetectionEvent {
  track_id?: string;
}

// YOLOv8 Detection Types (from object-detection-service)
export interface YOLODetection {
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    left: number;   // VAPIX normalized (0-1)
    top: number;    // VAPIX normalized (0-1)
    right: number;  // VAPIX normalized (0-1)
    bottom: number; // VAPIX normalized (0-1)
  };
  confidence: number;
  class_id: number;
  class_name: string;
  timestamp: number; // Unix timestamp in seconds
  // PTS-based timing metadata
  video_pts_ms: number;  // Video presentation timestamp in milliseconds
  loop_count: number;    // Number of video loops detected
  pts_based: boolean;    // Whether using PTS-based timing
}

export interface DetectionTiming {
  frame_timestamp: number;      // When frame was captured/processed (Unix seconds)
  publish_timestamp: number;    // When MQTT message was sent (Unix seconds)
  processing_latency_ms: number; // Detection processing time (milliseconds)
  detection_delay_ms: number;    // Configured sync offset (milliseconds)
  // PTS-based timing metadata
  video_pts_ms: number;          // Video presentation timestamp in milliseconds
  loop_count: number;            // Number of video loops detected
  pts_based: boolean;            // Whether using PTS-based timing
  use_video_pts: boolean;        // Configuration flag
}

export interface DetectionMessage {
  camera_id: string;
  timestamp: number;             // Frame timestamp (Unix seconds)
  publish_timestamp: number;     // MQTT publish timestamp (Unix seconds)
  detection_count: number;
  detections: YOLODetection[];
  timing: DetectionTiming;
}

export interface CameraDetectionState {
  camera_id: string;
  last_update: number;
  detections: YOLODetection[];
  total_count: number;
  timing?: DetectionTiming;
}

export interface DetectionStats {
  [className: string]: number;
}

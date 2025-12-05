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

export interface Detection {
  bbox: [number, number, number, number]  // [x, y, width, height] in pixels
  confidence: number
  class_id: number
  class_name: string
  track_id?: number
  track_state?: 'new' | 'active' | 'lost'
}

export interface DetectionFrame {
  frame_number: number
  timestamp: number  // seconds
  detections: Detection[]
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
}

export interface ClientSession {
  id: string
  transport: import('mediasoup').types.WebRtcTransport
  consumer?: import('mediasoup').types.Consumer
  dataConsumer?: import('mediasoup').types.DataConsumer
}

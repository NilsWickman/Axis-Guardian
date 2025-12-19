/**
 * Type definitions for frame-by-frame video review with detection data
 */

export interface DetectionFile {
  format_version: string
  video_info: VideoInfo
  detection_config: DetectionConfig
  statistics: DetectionStatistics
  frames: FrameData[]
}

export interface VideoInfo {
  source_file: string
  output_file: string
  width: number
  height: number
  fps: number
  total_frames: number
  duration_seconds: number
}

export interface DetectionConfig {
  model: string
  confidence_threshold: number
  iou_threshold: number
  inference_size: number
}

export interface DetectionStatistics {
  total_detections: number
  total_frames_with_detections: number
  detection_density: number
  unique_classes: string[]
  class_distribution: Record<string, number>
}

export interface FrameData {
  frame_number: number
  timestamp: number // seconds
  detections: Detection[]
  stats: FrameStats
}

export interface FrameStats {
  detection_count: number
  classes: string[]
  avg_confidence: number
  max_confidence: number
  has_high_confidence: boolean
}

export interface Detection {
  bbox: BoundingBox
  confidence: number
  raw_confidence: number
  class_id: number
  class_name: string
  track_id: number
  track_state: 'new' | 'active' | 'lost'
}

export interface BoundingBox {
  left: number   // normalized 0-1
  top: number    // normalized 0-1
  right: number  // normalized 0-1
  bottom: number // normalized 0-1
}

export interface VideoFileOption {
  id: string
  displayName: string
  videoPath: string
  detectionsPath: string
}

// Available preprocessed video files
// Video file options for frame review
export const AVAILABLE_VIDEOS: VideoFileOption[] = [
  {
    id: 'hc3',
    displayName: 'Camera HC3',
    videoPath: '/cameras/view-HC3.mp4',
    detectionsPath: '/cameras/view-HC3.detections.json.gz',
  },
  {
    id: 'hc4',
    displayName: 'Camera HC4',
    videoPath: '/cameras/view-HC4.mp4',
    detectionsPath: '/cameras/view-HC4.detections.json.gz',
  },
]

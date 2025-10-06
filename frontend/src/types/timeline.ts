/**
 * Timeline Data Management Types
 */

export type TimelineEventType =
  | 'motion'
  | 'person'
  | 'vehicle'
  | 'sound'
  | 'alarm'
  | 'zone_breach'
  | 'camera_offline'
  | 'camera_online'
  | 'recording_started'
  | 'recording_stopped'
  | 'custom'

export type RecordingQuality = 'low' | 'medium' | 'high' | 'ultra'
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4 | 8 | 16
export type TimelineGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'
export type ExportFormat = 'mp4' | 'avi' | 'mkv' | 'webm'

/**
 * Recording Segment
 */
export interface RecordingSegment {
  id: string
  cameraId: string
  startTime: number
  endTime: number
  duration: number
  quality: RecordingQuality
  bitrate: number // kbps
  fileSize: number // bytes
  filePath: string
  fps: number
  resolution: string
  hasAudio: boolean
  isCorrupted: boolean
  storageLocation: string
}

/**
 * Timeline Event
 */
export interface TimelineEvent {
  id: string
  type: TimelineEventType
  cameraId: string
  timestamp: number
  duration?: number
  confidence?: number // 0-1 for AI detections
  thumbnailUrl?: string
  metadata?: Record<string, any>
  zone?: string
  objectCount?: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  acknowledged?: boolean
  acknowledgedBy?: string
  acknowledgedAt?: number
  notes?: string
}

/**
 * Event Cluster (for grouping nearby events)
 */
export interface EventCluster {
  id: string
  events: TimelineEvent[]
  startTime: number
  endTime: number
  dominantType: TimelineEventType
  cameraId: string
  count: number
}

/**
 * Bookmark/Marker
 */
export interface TimelineBookmark {
  id: string
  name: string
  description?: string
  timestamp: number
  cameraIds: string[]
  color?: string
  tags?: string[]
  createdBy: string
  createdAt: number
  shared?: boolean
}

/**
 * Event Filter Configuration
 */
export interface EventFilter {
  types?: TimelineEventType[]
  cameraIds?: string[]
  zones?: string[]
  severities?: ('low' | 'medium' | 'high' | 'critical')[]
  minConfidence?: number
  dateRange?: {
    start: number
    end: number
  }
  acknowledged?: boolean
  tags?: string[]
}

/**
 * Timeline View Configuration
 */
export interface TimelineViewConfig {
  id: string
  name: string
  granularity: TimelineGranularity
  showEvents: boolean
  showRecordingGaps: boolean
  showBookmarks: boolean
  perCameraTimeline: boolean
  syncCameras: boolean
  eventFilter: EventFilter
  selectedCameras: string[]
  zoomLevel: number // 1-100
  theme?: 'compact' | 'detailed' | 'minimal'
}

/**
 * Playback State
 */
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  speed: PlaybackSpeed
  isMuted: boolean
  volume: number
  loop: boolean
  motionOnlyMode: boolean
  selectedCameraId?: string
  syncedCameras: string[]
}

/**
 * Export Configuration
 */
export interface ExportConfig {
  id: string
  name: string
  format: ExportFormat
  quality: RecordingQuality
  startTime: number
  endTime: number
  cameraIds: string[]
  includeAudio: boolean
  includeOverlay: boolean
  includeTimestamp: boolean
  includeCameraName: boolean
  includeEvents: boolean
  watermark?: string
  splitByCamera: boolean
  maxFileSize?: number // MB
}

/**
 * Recording Statistics
 */
export interface RecordingStats {
  cameraId: string
  totalRecordingTime: number // milliseconds
  totalFileSize: number // bytes
  averageBitrate: number
  gapCount: number
  totalGapTime: number
  qualityDistribution: Record<RecordingQuality, number>
  lastRecordingTime?: number
  storageHealth: 'good' | 'warning' | 'critical'
}

/**
 * Timeline Range Preset
 */
export interface TimelinePreset {
  id: string
  name: string
  label: string
  getDuration: () => number // milliseconds
}

/**
 * Motion Detection Zone
 */
export interface DetectionZone {
  id: string
  name: string
  cameraId: string
  polygon: { x: number; y: number }[]
  color: string
  enabled: boolean
  sensitivity: number
  eventTypes: TimelineEventType[]
}

/**
 * Event Analytics
 */
export interface EventAnalytics {
  period: {
    start: number
    end: number
  }
  totalEvents: number
  eventsByType: Record<TimelineEventType, number>
  eventsByCameraId: Record<string, number>
  eventsByHour: number[] // 24 hours
  eventsByDayOfWeek: number[] // 7 days
  peakHour: number
  peakDay: number
  averageEventsPerDay: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Video Clip
 */
export interface VideoClip {
  id: string
  name: string
  description?: string
  startTime: number
  endTime: number
  duration: number
  cameraIds: string[]
  thumbnailUrl?: string
  tags?: string[]
  createdBy: string
  createdAt: number
  exportConfig?: ExportConfig
  fileUrl?: string
  fileSize?: number
  shared?: boolean
}

/**
 * Network Quality Indicator
 */
export interface NetworkQuality {
  timestamp: number
  cameraId: string
  latency: number // ms
  packetLoss: number // percentage
  bandwidth: number // kbps
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

/**
 * Storage Information
 */
export interface StorageInfo {
  location: string
  totalCapacity: number // bytes
  usedSpace: number // bytes
  availableSpace: number // bytes
  recordingsByCamera: Record<string, number>
  oldestRecording?: number
  newestRecording?: number
  retentionDays: number
  isHealthy: boolean
}

// Generated TypeScript models from OpenAPI contracts

// Detection Types
export interface Detection {
  id: string
  timestamp: string
  cameraId: string
  type: 'person' | 'vehicle' | 'animal' | 'unknown'
  confidence: number // 0-1
  bbox: BoundingBox
  attributes?: Record<string, any>
  trackId?: number // Optional tracking ID from ByteTrack
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Track {
  trackId: string
  detections: Detection[]
  startTime: string
  lastUpdate: string
  predictedPosition?: Position
  velocity?: Velocity
}

export interface Position {
  x: number
  y: number
  z?: number
  azimuth?: number // Camera heading in degrees (0-360)
  elevation?: number // Camera tilt in degrees
}

export interface Velocity {
  dx?: number
  dy?: number
  speed?: number
}

// Alarm Types
export type AlarmStatus = 'pending' | 'acknowledged' | 'confirmed' | 'dismissed' | 'archived'
export type AlarmType = 'intrusion' | 'loitering' | 'line_crossing' | 'zone_violation' | 'abandoned_object'
export type AlarmSeverity = 'low' | 'medium' | 'high' | 'critical'
export type OutcomeCategory = 'incident_created' | 'false_alarm' | 'authorized_personnel' | 'other'

export interface Alarm {
  id: string
  timestamp: string
  type?: AlarmType
  severity: AlarmSeverity
  source: AlarmSource

  // Acknowledgement
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string

  // Status and lifecycle
  status?: AlarmStatus

  // Confirmation
  confirmedBy?: string
  confirmedAt?: string

  // Dismissal
  dismissedBy?: string
  dismissedAt?: string
  dismissalReason?: string

  // Closure
  outcomeCategory?: OutcomeCategory
  closureNotes?: string
  incidentId?: string

  // Metadata
  tags?: string[]
}

export interface AlarmSource {
  cameraId: string
  zoneId: string
  trackId?: string
  snapshot?: string
  snapshots?: string[]
  videoUrl?: string
  coordinates?: { x: number; y: number }
}

// Camera Types
export interface Camera {
  id: string
  name: string
  rtspUrl: string
  status: 'online' | 'offline' | 'error'
  capabilities?: CameraCapabilities
  position?: Position
  ipAddress?: string
  macAddress?: string
  model?: string
  serialNumber?: string
  firmwareVersion?: string
}

export interface CameraCapabilities {
  ptz?: boolean
  audio?: boolean
  analytics?: boolean
  resolution?: string
  fps?: number
}

// Zone Types
export interface Zone {
  id: string
  name: string
  type: 'restricted' | 'monitored' | 'entry' | 'exit'
  polygon: Position[]
  rules?: Rule[]
}

export interface Rule {
  id: string
  type: 'no_entry' | 'speed_limit' | 'loitering' | 'occupancy'
  enabled: boolean
  parameters?: Record<string, any>
}

// Camera Control Types
export interface StreamRequest {
  quality: 'low' | 'medium' | 'high' | 'source'
  protocol: 'rtsp' | 'hls' | 'webrtc'
  analytics?: boolean
}

export interface StreamResponse {
  streamId: string
  url: string
  protocol?: string
  sessionId?: string
}

export interface PTZCommand {
  action: 'pan' | 'tilt' | 'zoom' | 'preset' | 'home'
  value?: number
  speed?: number // 0-1
  preset?: string
}

// Error Types
export interface ErrorResponse {
  error: string
  message: string
  timestamp: string
  details?: Record<string, any>
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// OpenAPI-style components namespace for compatibility
export namespace components {
  export namespace schemas {
    export type Detection = import('.').Detection
    export type BoundingBox = import('.').BoundingBox
    export type Track = import('.').Track
    export type Position = import('.').Position
    export type Velocity = import('.').Velocity
    export type AlarmStatus = import('.').AlarmStatus
    export type AlarmType = import('.').AlarmType
    export type AlarmSeverity = import('.').AlarmSeverity
    export type OutcomeCategory = import('.').OutcomeCategory
    export type Alarm = import('.').Alarm
    export type AlarmSource = import('.').AlarmSource
    export type Camera = import('.').Camera
    export type CameraCapabilities = import('.').CameraCapabilities
    export type Zone = import('.').Zone
    export type Rule = import('.').Rule
    export type StreamRequest = import('.').StreamRequest
    export type StreamResponse = import('.').StreamResponse
    export type PTZCommand = import('.').PTZCommand
    export type ErrorResponse = import('.').ErrorResponse
    export type ApiResponse<T = any> = import('.').ApiResponse<T>
    export type PaginatedResponse<T> = import('.').PaginatedResponse<T>
  }
}
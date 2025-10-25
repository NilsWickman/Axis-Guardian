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
export interface Alarm {
  id: string
  timestamp: string
  type: 'intrusion' | 'loitering' | 'line_crossing' | 'zone_violation' | 'abandoned_object'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: AlarmSource
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface AlarmSource {
  cameraId: string
  zoneId: string
  trackId?: string
  snapshot?: string
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

// Authentication Types
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  user: User
}

export interface RefreshRequest {
  refreshToken: string
}

export interface TokenResponse {
  accessToken: string
  expiresIn?: number
}

export interface User {
  id: string
  username: string
  email?: string
  role: 'admin' | 'operator' | 'viewer'
}

// Role-based access control
export interface Role {
  id: string
  name: 'admin' | 'operator' | 'viewer'
  description: string
  permissions: Permission[]
}

export type Permission =
  | 'cameras:view'
  | 'cameras:control'
  | 'cameras:manage'
  | 'detections:view'
  | 'alarms:view'
  | 'alarms:acknowledge'
  | 'alarms:manage'
  | 'zones:view'
  | 'zones:manage'
  | 'users:view'
  | 'users:manage'
  | 'analytics:view'
  | 'settings:view'
  | 'settings:manage'

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
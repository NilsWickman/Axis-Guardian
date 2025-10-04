// Centralized Mock Data for Prototyping
// This file contains all mock data used across the application during development

import type {
  Camera,
  Alarm,
  Detection,
  User,
  Zone,
  Track,
  AlarmSource,
  Role,
} from '../types/generated'

// ============================================================================
// CAMERAS
// ============================================================================

export const mockCameras: Camera[] = [
  {
    id: 'cam-01',
    name: 'Front Entrance',
    rtspUrl: 'rtsp://camera1.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: true,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 100, y: 200, z: 3 },
  },
  {
    id: 'cam-02',
    name: 'Parking Lot',
    rtspUrl: 'rtsp://camera2.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 25,
    },
    position: { x: 300, y: 150, z: 3 },
  },
  {
    id: 'cam-03',
    name: 'Warehouse',
    rtspUrl: 'rtsp://camera3.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '2560x1440',
      fps: 30,
    },
    position: { x: 500, y: 100, z: 3 },
  },
  {
    id: 'cam-04',
    name: 'Loading Dock',
    rtspUrl: 'rtsp://camera4.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: true,
      analytics: false,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 200, y: 300, z: 3 },
  },
  {
    id: 'cam-05',
    name: 'Back Entrance',
    rtspUrl: 'rtsp://camera5.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 400, y: 250, z: 3 },
  },
  {
    id: 'cam-06',
    name: 'Perimeter North',
    rtspUrl: 'rtsp://camera6.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 25,
    },
    position: { x: 150, y: 50, z: 3 },
  },
  {
    id: 'cam-07',
    name: 'Perimeter South',
    rtspUrl: 'rtsp://camera7.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 350, y: 350, z: 3 },
  },
  {
    id: 'cam-08',
    name: 'Office Corridor',
    rtspUrl: 'rtsp://camera8.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: true,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 250, y: 180, z: 3 },
  },
  {
    id: 'cam-09',
    name: 'Server Room',
    rtspUrl: 'rtsp://camera9.local/stream',
    status: 'offline',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 450, y: 200, z: 3 },
  },
  {
    id: 'cam-10',
    name: 'Storage Area',
    rtspUrl: 'rtsp://camera10.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 25,
    },
    position: { x: 180, y: 280, z: 3 },
  },
  {
    id: 'cam-11',
    name: 'Reception',
    rtspUrl: 'rtsp://camera11.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: true,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 80, y: 120, z: 3 },
  },
  {
    id: 'cam-12',
    name: 'Cafeteria',
    rtspUrl: 'rtsp://camera12.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: true,
      analytics: false,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 320, y: 80, z: 3 },
  },
  {
    id: 'cam-13',
    name: 'Parking West',
    rtspUrl: 'rtsp://camera13.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '2560x1440',
      fps: 30,
    },
    position: { x: 50, y: 300, z: 3 },
  },
  {
    id: 'cam-14',
    name: 'Parking East',
    rtspUrl: 'rtsp://camera14.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 25,
    },
    position: { x: 550, y: 300, z: 3 },
  },
  {
    id: 'cam-15',
    name: 'Emergency Exit',
    rtspUrl: 'rtsp://camera15.local/stream',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 280, y: 380, z: 3 },
  },
  {
    id: 'cam-16',
    name: 'Rooftop',
    rtspUrl: 'rtsp://camera16.local/stream',
    status: 'online',
    capabilities: {
      ptz: true,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: { x: 300, y: 200, z: 15 },
  },
]

// ============================================================================
// ALARMS
// ============================================================================

export const mockAlarms: Alarm[] = [
  {
    id: 'alarm-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    type: 'intrusion',
    severity: 'critical',
    source: {
      cameraId: 'cam-01',
      zoneId: 'zone-entrance',
      trackId: 'track-001',
      snapshot: 'http://localhost:8000/snapshots/alarm-001.jpg',
    },
    acknowledged: false,
  },
  {
    id: 'alarm-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    type: 'loitering',
    severity: 'medium',
    source: {
      cameraId: 'cam-02',
      zoneId: 'zone-parking',
      trackId: 'track-002',
      snapshot: 'http://localhost:8000/snapshots/alarm-002.jpg',
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'alarm-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    type: 'line_crossing',
    severity: 'high',
    source: {
      cameraId: 'cam-03',
      zoneId: 'zone-warehouse',
      trackId: 'track-003',
      snapshot: 'http://localhost:8000/snapshots/alarm-003.jpg',
    },
    acknowledged: false,
  },
  {
    id: 'alarm-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    type: 'zone_violation',
    severity: 'high',
    source: {
      cameraId: 'cam-05',
      zoneId: 'zone-restricted',
      trackId: 'track-004',
      snapshot: 'http://localhost:8000/snapshots/alarm-004.jpg',
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 'alarm-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    type: 'abandoned_object',
    severity: 'low',
    source: {
      cameraId: 'cam-11',
      zoneId: 'zone-reception',
      snapshot: 'http://localhost:8000/snapshots/alarm-005.jpg',
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
  },
  {
    id: 'alarm-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    type: 'intrusion',
    severity: 'medium',
    source: {
      cameraId: 'cam-07',
      zoneId: 'zone-perimeter-south',
      trackId: 'track-006',
      snapshot: 'http://localhost:8000/snapshots/alarm-006.jpg',
    },
    acknowledged: false,
  },
]

// ============================================================================
// DETECTIONS
// ============================================================================

export const mockDetections: Detection[] = [
  {
    id: 'det-001',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    cameraId: 'cam-01',
    type: 'person',
    confidence: 0.95,
    bbox: { x: 120, y: 80, width: 100, height: 200 },
    attributes: { age: 'adult', clothing: 'dark jacket' },
  },
  {
    id: 'det-002',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    cameraId: 'cam-02',
    type: 'vehicle',
    confidence: 0.89,
    bbox: { x: 300, y: 150, width: 200, height: 120 },
    attributes: { color: 'red', type: 'sedan' },
  },
  {
    id: 'det-003',
    timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
    cameraId: 'cam-03',
    type: 'person',
    confidence: 0.92,
    bbox: { x: 450, y: 200, width: 90, height: 180 },
    attributes: { age: 'adult', clothing: 'hi-vis vest' },
  },
  {
    id: 'det-004',
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
    cameraId: 'cam-01',
    type: 'vehicle',
    confidence: 0.87,
    bbox: { x: 50, y: 100, width: 220, height: 140 },
    attributes: { color: 'white', type: 'van' },
  },
  {
    id: 'det-005',
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    cameraId: 'cam-05',
    type: 'person',
    confidence: 0.91,
    bbox: { x: 200, y: 120, width: 95, height: 190 },
    attributes: { age: 'adult' },
  },
]

// ============================================================================
// ROLES
// ============================================================================

export const mockRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'admin',
    description: 'Full system access with user and configuration management',
    permissions: [
      'cameras:view',
      'cameras:control',
      'cameras:manage',
      'detections:view',
      'alarms:view',
      'alarms:acknowledge',
      'alarms:manage',
      'zones:view',
      'zones:manage',
      'users:view',
      'users:manage',
      'analytics:view',
      'settings:view',
      'settings:manage',
    ],
  },
  {
    id: 'role-operator',
    name: 'operator',
    description: 'Operational access with camera control and alarm management',
    permissions: [
      'cameras:view',
      'cameras:control',
      'detections:view',
      'alarms:view',
      'alarms:acknowledge',
      'zones:view',
      'analytics:view',
      'settings:view',
    ],
  },
  {
    id: 'role-viewer',
    name: 'viewer',
    description: 'Read-only access to cameras and detections',
    permissions: [
      'cameras:view',
      'detections:view',
      'alarms:view',
      'zones:view',
      'analytics:view',
    ],
  },
]

// ============================================================================
// USERS
// ============================================================================

export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@axis.local',
    role: 'admin',
  },
  {
    id: 'user-002',
    username: 'operator',
    email: 'operator@axis.local',
    role: 'operator',
  },
  {
    id: 'user-003',
    username: 'viewer',
    email: 'viewer@axis.local',
    role: 'viewer',
  },
  {
    id: 'user-004',
    username: 'security_chief',
    email: 'chief@axis.local',
    role: 'admin',
  },
]

// ============================================================================
// ZONES
// ============================================================================

export const mockZones: Zone[] = [
  {
    id: 'zone-entrance',
    name: 'Main Entrance',
    type: 'entry',
    polygon: [
      { x: 50, y: 150 },
      { x: 150, y: 150 },
      { x: 150, y: 250 },
      { x: 50, y: 250 },
    ],
    rules: [
      {
        id: 'rule-001',
        type: 'no_entry',
        enabled: true,
        parameters: { timeRange: '22:00-06:00' },
      },
    ],
  },
  {
    id: 'zone-parking',
    name: 'Parking Area',
    type: 'monitored',
    polygon: [
      { x: 200, y: 100 },
      { x: 400, y: 100 },
      { x: 400, y: 200 },
      { x: 200, y: 200 },
    ],
    rules: [
      {
        id: 'rule-002',
        type: 'loitering',
        enabled: true,
        parameters: { maxDuration: 300 },
      },
    ],
  },
  {
    id: 'zone-warehouse',
    name: 'Warehouse Floor',
    type: 'restricted',
    polygon: [
      { x: 450, y: 50 },
      { x: 550, y: 50 },
      { x: 550, y: 150 },
      { x: 450, y: 150 },
    ],
    rules: [
      {
        id: 'rule-003',
        type: 'no_entry',
        enabled: true,
        parameters: { requiresAuthorization: true },
      },
    ],
  },
  {
    id: 'zone-restricted',
    name: 'Restricted Area',
    type: 'restricted',
    polygon: [
      { x: 350, y: 200 },
      { x: 450, y: 200 },
      { x: 450, y: 300 },
      { x: 350, y: 300 },
    ],
    rules: [
      {
        id: 'rule-004',
        type: 'no_entry',
        enabled: true,
        parameters: { requiresAuthorization: true },
      },
    ],
  },
]

// ============================================================================
// TRACKS
// ============================================================================

export const mockTracks: Track[] = [
  {
    trackId: 'track-001',
    detections: [mockDetections[0]],
    startTime: new Date(Date.now() - 1000 * 60).toISOString(),
    lastUpdate: new Date(Date.now() - 1000 * 30).toISOString(),
    predictedPosition: { x: 125, y: 200 },
    velocity: { dx: 1.2, dy: 0.5, speed: 1.3 },
  },
  {
    trackId: 'track-002',
    detections: [mockDetections[1]],
    startTime: new Date(Date.now() - 1000 * 90).toISOString(),
    lastUpdate: new Date(Date.now() - 1000 * 45).toISOString(),
    predictedPosition: { x: 350, y: 175 },
    velocity: { dx: -0.8, dy: 0.2, speed: 0.8 },
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get camera by ID
 */
export function getCameraById(id: string): Camera | undefined {
  return mockCameras.find((camera) => camera.id === id)
}

/**
 * Get cameras by status
 */
export function getCamerasByStatus(status: Camera['status']): Camera[] {
  return mockCameras.filter((camera) => camera.status === status)
}

/**
 * Get alarms by acknowledgement status
 */
export function getAlarmsByAcknowledged(acknowledged: boolean): Alarm[] {
  return mockAlarms.filter((alarm) => alarm.acknowledged === acknowledged)
}

/**
 * Get alarms by severity
 */
export function getAlarmsBySeverity(severity: Alarm['severity']): Alarm[] {
  return mockAlarms.filter((alarm) => alarm.severity === severity)
}

/**
 * Get detections by camera ID
 */
export function getDetectionsByCameraId(cameraId: string): Detection[] {
  return mockDetections.filter((detection) => detection.cameraId === cameraId)
}

/**
 * Simulate adding a new detection
 */
export function addMockDetection(detection: Omit<Detection, 'id' | 'timestamp'>): Detection {
  const newDetection: Detection = {
    ...detection,
    id: `det-${String(mockDetections.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
  }
  mockDetections.unshift(newDetection)
  return newDetection
}

/**
 * Simulate acknowledging an alarm
 */
export function acknowledgeMockAlarm(alarmId: string, acknowledgedBy: string): Alarm | undefined {
  const alarm = mockAlarms.find((a) => a.id === alarmId)
  if (alarm) {
    alarm.acknowledged = true
    alarm.acknowledgedBy = acknowledgedBy
    alarm.acknowledgedAt = new Date().toISOString()
  }
  return alarm
}

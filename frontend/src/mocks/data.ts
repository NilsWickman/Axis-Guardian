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
    id: 'camera1',
    name: 'Auditorium - High Corner View 3',
    rtspUrl: 'rtsp://localhost:8554/camera1',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: {
      x: 16.22,
      y: 0.3,
      z: 1.68,
      azimuth: 18,
      elevation: 1,
    },
    ipAddress: '192.168.1.101',
    macAddress: 'AC:CC:8E:12:34:60',
    model: 'AXIS P3245-LVE',
    serialNumber: 'ACCC8E123460',
    firmwareVersion: '11.8.67',
  },
  {
    id: 'camera2',
    name: 'Auditorium - High Corner View 4',
    rtspUrl: 'rtsp://localhost:8554/camera2',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: {
      x: 0.9,
      y: 0.5,
      z: 1.67,
      azimuth: 313,
      elevation: -5,
    },
    ipAddress: '192.168.1.102',
    macAddress: 'AC:CC:8E:12:34:61',
    model: 'AXIS P3245-LVE',
    serialNumber: 'ACCC8E123461',
    firmwareVersion: '11.8.67',
  },
  {
    id: 'camera3',
    name: 'Auditorium - IP Camera View 2',
    rtspUrl: 'rtsp://localhost:8554/camera3',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: {
      x: 20.6,
      y: 28.31,
      z: 2.62,
      azimuth: 140,
      elevation: -9,
    },
    ipAddress: '192.168.1.103',
    macAddress: 'AC:CC:8E:12:34:62',
    model: 'AXIS P3245-LVE',
    serialNumber: 'ACCC8E123462',
    firmwareVersion: '11.8.67',
  },
  {
    id: 'camera4',
    name: 'Auditorium - IP Camera View 5',
    rtspUrl: 'rtsp://localhost:8554/camera4',
    status: 'online',
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
      resolution: '1920x1080',
      fps: 30,
    },
    position: {
      x: 10.57,
      y: 16.31,
      z: 1.84,
      azimuth: 339,
      elevation: 0,
    },
    ipAddress: '192.168.1.104',
    macAddress: 'AC:CC:8E:12:34:63',
    model: 'AXIS P3245-LVE',
    serialNumber: 'ACCC8E123463',
    firmwareVersion: '11.8.67',
  },
]

// ============================================================================
// ALARMS
// ============================================================================

export const mockAlarms: Alarm[] = [
  {
    id: 'alarm-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    severity: 'critical',
    source: {
      cameraId: 'camera1',
      zoneId: 'zone-entrance',
      trackId: 'track-001',
      snapshot: 'http://localhost:8000/snapshots/alarm-001.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-001-1.jpg',
        'http://localhost:8000/snapshots/alarm-001-2.jpg',
        'http://localhost:8000/snapshots/alarm-001-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-001.mp4',
      coordinates: { x: 16.22, y: 0.3 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['perimeter-breach', 'after-hours'],
  },
  {
    id: 'alarm-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 min ago
    severity: 'medium',
    source: {
      cameraId: 'camera2',
      zoneId: 'zone-auditorium',
      trackId: 'track-002',
      snapshot: 'http://localhost:8000/snapshots/alarm-002.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-002-1.jpg',
        'http://localhost:8000/snapshots/alarm-002-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-002.mp4',
      coordinates: { x: 0.9, y: 0.5 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['auditorium'],
  },
  {
    id: 'alarm-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    severity: 'high',
    source: {
      cameraId: 'camera3',
      zoneId: 'zone-auditorium',
      trackId: 'track-003',
      snapshot: 'http://localhost:8000/snapshots/alarm-003.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-003-1.jpg',
        'http://localhost:8000/snapshots/alarm-003-2.jpg',
        'http://localhost:8000/snapshots/alarm-003-3.jpg',
        'http://localhost:8000/snapshots/alarm-003-4.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-003.mp4',
      coordinates: { x: 20.6, y: 28.31 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: 'acknowledged',
    tags: ['auditorium', 'restricted-area'],
  },
  {
    id: 'alarm-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), // 22 min ago
    severity: 'high',
    source: {
      cameraId: 'camera4',
      zoneId: 'zone-restricted',
      trackId: 'track-004',
      snapshot: 'http://localhost:8000/snapshots/alarm-004.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-004-1.jpg',
        'http://localhost:8000/snapshots/alarm-004-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-004.mp4',
      coordinates: { x: 10.57, y: 16.31 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    confirmedBy: 'admin',
    confirmedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'confirmed',
    outcomeCategory: 'incident_created',
    closureNotes: 'Unauthorized person detected in restricted area. Security dispatched. Incident report filed.',
    incidentId: 'incident-2025-10-06-001',
    tags: ['confirmed-intrusion', 'restricted-area', 'security-response'],
  },
  {
    id: 'alarm-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    severity: 'low',
    source: {
      cameraId: 'camera1',
      zoneId: 'zone-entrance',
      snapshot: 'http://localhost:8000/snapshots/alarm-005.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-005-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-005.mp4',
      coordinates: { x: 16.22, y: 0.3 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    dismissalReason: 'Cleaning staff working late, properly identified',
    status: 'dismissed',
    outcomeCategory: 'authorized_personnel',
    closureNotes: 'Confirmed as cleaning crew with valid access badge.',
    tags: ['false-alarm', 'authorized-personnel'],
  },
  {
    id: 'alarm-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    severity: 'critical',
    source: {
      cameraId: 'camera2',
      zoneId: 'zone-auditorium',
      trackId: 'track-006',
      snapshot: 'http://localhost:8000/snapshots/alarm-006.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-006-1.jpg',
        'http://localhost:8000/snapshots/alarm-006-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-006.mp4',
      coordinates: { x: 0.9, y: 0.5 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['auditorium', 'night-time'],
  },
  {
    id: 'alarm-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), // 50 min ago
    severity: 'medium',
    source: {
      cameraId: 'camera3',
      zoneId: 'zone-auditorium',
      trackId: 'track-007',
      snapshot: 'http://localhost:8000/snapshots/alarm-007.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-007-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-007.mp4',
      coordinates: { x: 20.6, y: 28.31 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    dismissalReason: 'Animal detected, not a security threat',
    status: 'dismissed',
    outcomeCategory: 'false_alarm',
    closureNotes: 'Bird in auditorium.',
    tags: ['false-alarm', 'animal'],
  },
  {
    id: 'alarm-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 65 min ago
    severity: 'high',
    source: {
      cameraId: 'camera4',
      zoneId: 'zone-auditorium',
      trackId: 'track-008',
      snapshot: 'http://localhost:8000/snapshots/alarm-008.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-008-1.jpg',
        'http://localhost:8000/snapshots/alarm-008-2.jpg',
        'http://localhost:8000/snapshots/alarm-008-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-008.mp4',
      coordinates: { x: 10.57, y: 16.31 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    status: 'acknowledged',
    tags: ['auditorium'],
  },
  {
    id: 'alarm-009',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 75 min ago
    severity: 'medium',
    source: {
      cameraId: 'camera1',
      zoneId: 'zone-entrance',
      trackId: 'track-009',
      snapshot: 'http://localhost:8000/snapshots/alarm-009.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-009-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-009.mp4',
      coordinates: { x: 16.22, y: 0.3 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 72).toISOString(),
    dismissedBy: 'admin',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    dismissalReason: 'Employee working overtime with proper authorization',
    status: 'dismissed',
    outcomeCategory: 'authorized_personnel',
    tags: ['false-alarm', 'authorized-personnel'],
  },
  {
    id: 'alarm-010',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    severity: 'critical',
    source: {
      cameraId: 'camera2',
      zoneId: 'zone-entrance',
      trackId: 'track-010',
      snapshot: 'http://localhost:8000/snapshots/alarm-010.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-010-1.jpg',
        'http://localhost:8000/snapshots/alarm-010-2.jpg',
        'http://localhost:8000/snapshots/alarm-010-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-010.mp4',
      coordinates: { x: 0.9, y: 0.5 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 88).toISOString(),
    confirmedBy: 'admin',
    confirmedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    status: 'confirmed',
    outcomeCategory: 'incident_created',
    closureNotes: 'Attempted break-in at main entrance. Police notified and responded.',
    incidentId: 'incident-2025-10-06-002',
    tags: ['confirmed-intrusion', 'police-notified'],
  },
]

// ============================================================================
// DETECTIONS
// ============================================================================

export const mockDetections: Detection[] = [
  {
    id: 'det-001',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    cameraId: 'camera1',
    type: 'person',
    confidence: 0.95,
    bbox: { x: 120, y: 80, width: 100, height: 200 },
    attributes: { age: 'adult', clothing: 'dark jacket' },
  },
  {
    id: 'det-002',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    cameraId: 'camera2',
    type: 'person',
    confidence: 0.89,
    bbox: { x: 300, y: 150, width: 80, height: 180 },
    attributes: { age: 'adult', clothing: 'blue shirt' },
  },
  {
    id: 'det-003',
    timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
    cameraId: 'camera3',
    type: 'person',
    confidence: 0.92,
    bbox: { x: 450, y: 200, width: 90, height: 180 },
    attributes: { age: 'adult', clothing: 'casual wear' },
  },
  {
    id: 'det-004',
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
    cameraId: 'camera4',
    type: 'person',
    confidence: 0.87,
    bbox: { x: 50, y: 100, width: 85, height: 175 },
    attributes: { age: 'adult', clothing: 'formal attire' },
  },
  {
    id: 'det-005',
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    cameraId: 'camera1',
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

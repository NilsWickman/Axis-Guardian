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
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    severity: 'critical',
    source: {
      cameraId: 'cam-01',
      zoneId: 'zone-entrance',
      trackId: 'track-001',
      snapshot: 'http://localhost:8000/snapshots/alarm-001.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-001-1.jpg',
        'http://localhost:8000/snapshots/alarm-001-2.jpg',
        'http://localhost:8000/snapshots/alarm-001-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-001.mp4',
      coordinates: { x: 125, y: 180 },
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
      cameraId: 'cam-02',
      zoneId: 'zone-parking',
      trackId: 'track-002',
      snapshot: 'http://localhost:8000/snapshots/alarm-002.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-002-1.jpg',
        'http://localhost:8000/snapshots/alarm-002-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-002.mp4',
      coordinates: { x: 350, y: 175 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['parking'],
  },
  {
    id: 'alarm-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    severity: 'high',
    source: {
      cameraId: 'cam-03',
      zoneId: 'zone-warehouse',
      trackId: 'track-003',
      snapshot: 'http://localhost:8000/snapshots/alarm-003.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-003-1.jpg',
        'http://localhost:8000/snapshots/alarm-003-2.jpg',
        'http://localhost:8000/snapshots/alarm-003-3.jpg',
        'http://localhost:8000/snapshots/alarm-003-4.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-003.mp4',
      coordinates: { x: 475, y: 120 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: 'acknowledged',
    tags: ['warehouse', 'restricted-area'],
  },
  {
    id: 'alarm-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), // 22 min ago
    severity: 'high',
    source: {
      cameraId: 'cam-04',
      zoneId: 'zone-restricted',
      trackId: 'track-004',
      snapshot: 'http://localhost:8000/snapshots/alarm-004.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-004-1.jpg',
        'http://localhost:8000/snapshots/alarm-004-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-004.mp4',
      coordinates: { x: 380, y: 250 },
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
      cameraId: 'cam-05',
      zoneId: 'zone-reception',
      snapshot: 'http://localhost:8000/snapshots/alarm-005.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-005-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-005.mp4',
      coordinates: { x: 200, y: 120 },
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
      cameraId: 'cam-06',
      zoneId: 'zone-perimeter-north',
      trackId: 'track-006',
      snapshot: 'http://localhost:8000/snapshots/alarm-006.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-006-1.jpg',
        'http://localhost:8000/snapshots/alarm-006-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-006.mp4',
      coordinates: { x: 150, y: 50 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['perimeter', 'night-time'],
  },
  {
    id: 'alarm-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), // 50 min ago
    severity: 'medium',
    source: {
      cameraId: 'cam-05',
      zoneId: 'zone-parking-west',
      trackId: 'track-007',
      snapshot: 'http://localhost:8000/snapshots/alarm-007.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-007-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-007.mp4',
      coordinates: { x: 50, y: 300 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    dismissalReason: 'Animal detected, not a security threat',
    status: 'dismissed',
    outcomeCategory: 'false_alarm',
    closureNotes: 'Deer passing through parking area.',
    tags: ['false-alarm', 'animal'],
  },
  {
    id: 'alarm-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 65 min ago
    severity: 'high',
    source: {
      cameraId: 'cam-06',
      zoneId: 'zone-perimeter-south',
      trackId: 'track-008',
      snapshot: 'http://localhost:8000/snapshots/alarm-008.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-008-1.jpg',
        'http://localhost:8000/snapshots/alarm-008-2.jpg',
        'http://localhost:8000/snapshots/alarm-008-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-008.mp4',
      coordinates: { x: 350, y: 350 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    status: 'acknowledged',
    tags: ['perimeter'],
  },
  {
    id: 'alarm-009',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 75 min ago
    severity: 'medium',
    source: {
      cameraId: 'cam-05',
      zoneId: 'zone-office-corridor',
      trackId: 'track-009',
      snapshot: 'http://localhost:8000/snapshots/alarm-009.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-009-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-009.mp4',
      coordinates: { x: 250, y: 180 },
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
      cameraId: 'cam-01',
      zoneId: 'zone-entrance',
      trackId: 'track-010',
      snapshot: 'http://localhost:8000/snapshots/alarm-010.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-010-1.jpg',
        'http://localhost:8000/snapshots/alarm-010-2.jpg',
        'http://localhost:8000/snapshots/alarm-010-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-010.mp4',
      coordinates: { x: 100, y: 200 },
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
  {
    id: 'alarm-011',
    timestamp: new Date(Date.now() - 1000 * 60 * 105).toISOString(), // 105 min ago
    severity: 'low',
    source: {
      cameraId: 'cam-02',
      zoneId: 'zone-parking-east',
      trackId: 'track-011',
      snapshot: 'http://localhost:8000/snapshots/alarm-011.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-011-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-011.mp4',
      coordinates: { x: 550, y: 300 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 103).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
    dismissalReason: 'Shadow detected, not an actual intrusion',
    status: 'dismissed',
    outcomeCategory: 'false_alarm',
    tags: ['false-alarm'],
  },
  {
    id: 'alarm-012',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    severity: 'medium',
    source: {
      cameraId: 'cam-02',
      zoneId: 'zone-parking',
      snapshot: 'http://localhost:8000/snapshots/alarm-012.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-012-1.jpg',
        'http://localhost:8000/snapshots/alarm-012-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-012.mp4',
      coordinates: { x: 300, y: 150 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    status: 'acknowledged',
    tags: ['parking'],
  },
  {
    id: 'alarm-013',
    timestamp: new Date(Date.now() - 1000 * 60 * 135).toISOString(), // 2.25 hours ago
    severity: 'high',
    source: {
      cameraId: 'cam-04',
      zoneId: 'zone-storage',
      trackId: 'track-013',
      snapshot: 'http://localhost:8000/snapshots/alarm-013.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-013-1.jpg',
        'http://localhost:8000/snapshots/alarm-013-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-013.mp4',
      coordinates: { x: 180, y: 280 },
    },
    acknowledged: false,
    status: 'pending',
    tags: ['storage'],
  },
  {
    id: 'alarm-014',
    timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), // 2.5 hours ago
    severity: 'critical',
    source: {
      cameraId: 'cam-03',
      zoneId: 'zone-warehouse',
      trackId: 'track-014',
      snapshot: 'http://localhost:8000/snapshots/alarm-014.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-014-1.jpg',
        'http://localhost:8000/snapshots/alarm-014-2.jpg',
        'http://localhost:8000/snapshots/alarm-014-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-014.mp4',
      coordinates: { x: 500, y: 100 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 148).toISOString(),
    confirmedBy: 'admin',
    confirmedAt: new Date(Date.now() - 1000 * 60 * 145).toISOString(),
    status: 'confirmed',
    outcomeCategory: 'incident_created',
    closureNotes: 'Theft attempt detected. Suspect fled before security arrival. Evidence preserved.',
    incidentId: 'incident-2025-10-06-003',
    tags: ['confirmed-intrusion', 'theft-attempt'],
  },
  {
    id: 'alarm-015',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    severity: 'medium',
    source: {
      cameraId: 'cam-01',
      zoneId: 'zone-cafeteria',
      trackId: 'track-015',
      snapshot: 'http://localhost:8000/snapshots/alarm-015.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-015-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-015.mp4',
      coordinates: { x: 320, y: 80 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 178).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
    dismissalReason: 'Employee forgot to clock out, legitimate presence',
    status: 'dismissed',
    outcomeCategory: 'authorized_personnel',
    tags: ['false-alarm', 'authorized-personnel'],
  },
  {
    id: 'alarm-016',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    severity: 'low',
    source: {
      cameraId: 'cam-06',
      zoneId: 'zone-server-room',
      trackId: 'track-016',
      snapshot: 'http://localhost:8000/snapshots/alarm-016.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-016-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-016.mp4',
      coordinates: { x: 450, y: 200 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 238).toISOString(),
    dismissedBy: 'admin',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 235).toISOString(),
    dismissalReason: 'IT staff performing scheduled maintenance',
    status: 'dismissed',
    outcomeCategory: 'authorized_personnel',
    tags: ['false-alarm', 'authorized-personnel', 'maintenance'],
  },
  {
    id: 'alarm-017',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    severity: 'high',
    source: {
      cameraId: 'cam-04',
      zoneId: 'zone-loading-dock',
      trackId: 'track-017',
      snapshot: 'http://localhost:8000/snapshots/alarm-017.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-017-1.jpg',
        'http://localhost:8000/snapshots/alarm-017-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-017.mp4',
      coordinates: { x: 200, y: 300 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 298).toISOString(),
    status: 'acknowledged',
    tags: ['loading-dock'],
  },
  {
    id: 'alarm-018',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    severity: 'low',
    source: {
      cameraId: 'cam-03',
      zoneId: 'zone-office-corridor',
      snapshot: 'http://localhost:8000/snapshots/alarm-018.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-018-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-018.mp4',
      coordinates: { x: 250, y: 180 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 358).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 355).toISOString(),
    dismissalReason: 'Motion caused by HVAC system',
    status: 'dismissed',
    outcomeCategory: 'false_alarm',
    tags: ['false-alarm', 'environmental'],
  },
  {
    id: 'alarm-019',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    severity: 'medium',
    source: {
      cameraId: 'cam-06',
      zoneId: 'zone-perimeter-north',
      trackId: 'track-019',
      snapshot: 'http://localhost:8000/snapshots/alarm-019.jpg',
      snapshots: ['http://localhost:8000/snapshots/alarm-019-1.jpg'],
      videoUrl: 'http://localhost:8000/videos/alarm-019.mp4',
      coordinates: { x: 150, y: 50 },
    },
    acknowledged: true,
    acknowledgedBy: 'operator',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 478).toISOString(),
    dismissedBy: 'operator',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 475).toISOString(),
    dismissalReason: 'Delivery truck parked outside fence',
    status: 'dismissed',
    outcomeCategory: 'false_alarm',
    tags: ['false-alarm'],
  },
  {
    id: 'alarm-020',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hours ago
    severity: 'critical',
    source: {
      cameraId: 'cam-01',
      zoneId: 'zone-entrance',
      trackId: 'track-020',
      snapshot: 'http://localhost:8000/snapshots/alarm-020.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-020-1.jpg',
        'http://localhost:8000/snapshots/alarm-020-2.jpg',
        'http://localhost:8000/snapshots/alarm-020-3.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-020.mp4',
      coordinates: { x: 100, y: 200 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 718).toISOString(),
    confirmedBy: 'admin',
    confirmedAt: new Date(Date.now() - 1000 * 60 * 715).toISOString(),
    status: 'confirmed',
    outcomeCategory: 'incident_created',
    closureNotes: 'Vandalism attempt at entrance. Suspects fled when detected. Incident reported to police.',
    incidentId: 'incident-2025-10-05-015',
    tags: ['confirmed-intrusion', 'vandalism', 'police-notified'],
  },
  {
    id: 'alarm-021',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 24 hours ago
    severity: 'high',
    source: {
      cameraId: 'cam-03',
      zoneId: 'zone-warehouse',
      trackId: 'track-021',
      snapshot: 'http://localhost:8000/snapshots/alarm-021.jpg',
      snapshots: [
        'http://localhost:8000/snapshots/alarm-021-1.jpg',
        'http://localhost:8000/snapshots/alarm-021-2.jpg',
      ],
      videoUrl: 'http://localhost:8000/videos/alarm-021.mp4',
      coordinates: { x: 500, y: 100 },
    },
    acknowledged: true,
    acknowledgedBy: 'admin',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 1438).toISOString(),
    dismissedBy: 'admin',
    dismissedAt: new Date(Date.now() - 1000 * 60 * 1435).toISOString(),
    dismissalReason: 'Night shift worker, authorized access verified',
    status: 'dismissed',
    outcomeCategory: 'authorized_personnel',
    tags: ['false-alarm', 'authorized-personnel', 'night-shift'],
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

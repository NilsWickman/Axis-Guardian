/**
 * Camera emulator configuration
 */

import fs from 'fs'
import path from 'path'
import type { CameraConfig } from './types.js'

// Allow environment override for Docker deployment
const BASE_PATH = process.env.VIDEO_PATH || '/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p'

export const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || 'http://localhost:3010'

/**
 * Which detections variant to use:
 * - auto (default): use first existing of [reid(.gz|.json), preprocessed(.gz|.json)]
 * - reid: prefer reid, fallback to preprocessed if missing
 * - preprocessed: prefer preprocessed, fallback to reid if missing
 */
const DETECTIONS_VARIANT = (process.env.DETECTIONS_VARIANT || 'auto').toLowerCase()

// Public IP for WebRTC (required for external clients)
const ANNOUNCED_IP = process.env.ANNOUNCED_IP || '127.0.0.1'

function pickExistingPath(candidates: string[]): string | undefined {
  return candidates.find(p => fs.existsSync(p))
}

function detectionsCandidates(basePath: string, viewName: string) {
  const reid = [
    path.join(basePath, `${viewName}-reid.detections.json.gz`),
    path.join(basePath, `${viewName}-reid.detections.json`),
  ]
  const preprocessed = [
    path.join(basePath, `${viewName}-preprocessed.detections.json.gz`),
    path.join(basePath, `${viewName}-preprocessed.detections.json`),
  ]

  if (DETECTIONS_VARIANT === 'reid') return [...reid, ...preprocessed]
  if (DETECTIONS_VARIANT === 'preprocessed') return [...preprocessed, ...reid]
  // auto
  return [...reid, ...preprocessed]
}

function resolveDetectionsPath(basePath: string, viewName: string): string {
  const candidates = detectionsCandidates(basePath, viewName)
  const picked = pickExistingPath(candidates)
  if (picked) return picked

  // Fall back to a reasonable default to keep the config deterministic,
  // but the loader will throw with ENOENT if nothing exists on disk.
  return candidates[0]
}

export const cameras: CameraConfig[] = [
  {
    cameraId: 'camera-HC3',
    videoPath: path.join(BASE_PATH, 'view-HC3-preprocessed.mp4'),
    // Detections (auto-select reid vs preprocessed based on availability)
    detectionsPath: resolveDetectionsPath(BASE_PATH, 'view-HC3'),
    port: 9101,
    trackingCameraId: 'camera1',
    trackingServiceUrl: TRACKING_SERVICE_URL,
  },
  {
    cameraId: 'camera-HC4',
    videoPath: path.join(BASE_PATH, 'view-HC4-preprocessed.mp4'),
    // Detections (auto-select reid vs preprocessed based on availability)
    detectionsPath: resolveDetectionsPath(BASE_PATH, 'view-HC4'),
    port: 9102,
    trackingCameraId: 'camera2',
    trackingServiceUrl: TRACKING_SERVICE_URL,
  },
]

// mediasoup configuration
export const mediasoupConfig = {
  worker: {
    logLevel: 'warn' as const,
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  },
  router: {
    mediaCodecs: [
      {
        kind: 'video' as const,
        mimeType: 'video/H264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
        },
      },
    ],
  },
  webRtcTransport: {
    listenIps: [{ ip: '0.0.0.0', announcedIp: ANNOUNCED_IP }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true,
    numSctpStreams: { OS: 1024, MIS: 1024 },
  },
}

// FFmpeg RTP configuration
export const ffmpegConfig = {
  baseRtpPort: 5000,  // Each camera gets its own port
  payloadType: 96,    // Dynamic payload type for H.264
}

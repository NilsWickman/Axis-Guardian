/**
 * Camera emulator configuration
 */

import fs from 'fs'
import path from 'path'
import type { CameraConfig } from './types.js'

// Allow environment override for Docker deployment
const BASE_PATH = process.env.VIDEO_PATH || '/home/nilwi971/projects/Axis-Guardian/shared/cameras'

export const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || 'http://localhost:3010'

function parseCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProd = nodeEnv === 'production'

const defaultAllowedOrigins = [
  'https://pummenc2.win',
  'https://www.pummenc2.win',
  ...(isProd ? [] : [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]),
]

const allowedOrigins = parseCsv(process.env.WS_ALLOWED_ORIGINS)

export const WS_ALLOWED_ORIGINS = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins
export const WS_ALLOW_NO_ORIGIN = process.env.WS_ALLOW_NO_ORIGIN === 'true' || !isProd
export const WS_MAX_PAYLOAD_BYTES = parseInt(process.env.WS_MAX_PAYLOAD_BYTES ?? '1048576', 10)
export const WS_MAX_CONNECTIONS_PER_IP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP ?? '20', 10)
export const WS_PING_INTERVAL_MS = parseInt(process.env.WS_PING_INTERVAL_MS ?? '30000', 10)

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
  // New naming convention: {viewName}.detections.json(.gz)
  const standard = [
    path.join(basePath, `${viewName}.detections.json.gz`),
    path.join(basePath, `${viewName}.detections.json`),
  ]
  // Legacy naming conventions for backward compatibility
  const reid = [
    path.join(basePath, `${viewName}-reid.detections.json.gz`),
    path.join(basePath, `${viewName}-reid.detections.json`),
  ]
  const preprocessed = [
    path.join(basePath, `${viewName}-preprocessed.detections.json.gz`),
    path.join(basePath, `${viewName}-preprocessed.detections.json`),
  ]

  if (DETECTIONS_VARIANT === 'reid') return [...reid, ...standard, ...preprocessed]
  if (DETECTIONS_VARIANT === 'preprocessed') return [...preprocessed, ...standard, ...reid]
  // auto - prefer new standard naming first
  return [...standard, ...reid, ...preprocessed]
}

function resolveDetectionsPath(basePath: string, viewName: string): string {
  const candidates = detectionsCandidates(basePath, viewName)
  const picked = pickExistingPath(candidates)
  if (picked) return picked

  // Fall back to a reasonable default to keep the config deterministic,
  // but the loader will throw with ENOENT if nothing exists on disk.
  return candidates[0]
}

function buildCameraConfig(
  cameraId: string,
  viewName: string,
  port: number,
  trackingCameraId: string
): CameraConfig | null {
  const videoPath = path.join(BASE_PATH, `${viewName}.mp4`)
  const detectionsPath = resolveDetectionsPath(BASE_PATH, viewName)

  // Validate video file exists
  if (!fs.existsSync(videoPath)) {
    console.warn(`⚠️  Skipping ${cameraId}: video file not found at ${videoPath}`)
    return null
  }

  return {
    cameraId,
    videoPath,
    detectionsPath,
    port,
    trackingCameraId,
    trackingServiceUrl: TRACKING_SERVICE_URL,
  }
}

// Build camera configs, filtering out any with missing video files
const allCameraConfigs = [
  buildCameraConfig('camera-HC3', 'view-HC3', 9101, 'camera1'),
  buildCameraConfig('camera-HC4', 'view-HC4', 9102, 'camera2'),
]

export const cameras: CameraConfig[] = allCameraConfigs.filter(
  (c): c is CameraConfig => c !== null
)

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

/**
 * Camera emulator configuration
 */

import path from 'path'
import type { CameraConfig } from './types.js'

const BASE_PATH = '/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p'

export const TRACKING_SERVICE_URL = process.env.TRACKING_SERVICE_URL || 'http://localhost:3010'

export const cameras: CameraConfig[] = [
  {
    cameraId: 'camera-HC3',
    videoPath: path.join(BASE_PATH, 'view-HC3-preprocessed.mp4'),
    detectionsPath: path.join(BASE_PATH, 'view-HC3-preprocessed.detections.json.gz'),
    port: 9101,
    trackingCameraId: 'camera1',
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
    listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
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

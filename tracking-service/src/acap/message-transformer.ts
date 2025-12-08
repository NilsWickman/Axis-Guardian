/**
 * ACAP Message Transformer
 *
 * Transforms ACAP analytics scene messages from Axis cameras
 * into the DetectionMessage format used by the tracking service.
 */

import type { DetectionMessage, RawDetection } from '../types.js'
import type { AcapMessage, AcapObservation, CameraFrameState } from './types.js'

/**
 * Parse ACAP track_id (UUID string) to numeric track_id
 * Uses a simple hash to convert UUID to a stable numeric ID
 */
export function parseTrackId(uuidTrackId: string): number {
  // Simple hash: sum of char codes modulo a large prime
  let hash = 0
  for (let i = 0; i < uuidTrackId.length; i++) {
    hash = ((hash << 5) - hash + uuidTrackId.charCodeAt(i)) | 0
  }
  // Ensure positive number
  return Math.abs(hash)
}

/**
 * Validate and parse an ACAP message from JSON
 */
export function parseAcapMessage(data: Buffer | string): AcapMessage | null {
  try {
    const json = typeof data === 'string' ? data : data.toString('utf-8')
    const parsed = JSON.parse(json)

    // Validate structure
    if (!parsed.frame || !parsed.frame.timestamp || !Array.isArray(parsed.frame.observations)) {
      console.warn('[ACAP] Invalid message structure: missing frame, timestamp, or observations')
      return null
    }

    return parsed as AcapMessage
  } catch (error) {
    console.warn('[ACAP] Failed to parse message:', error)
    return null
  }
}

/**
 * Transform an ACAP observation to a RawDetection
 */
export function transformObservation(obs: AcapObservation, _index: number): RawDetection | null {
  // Only process Human detections
  if (obs.class.type !== 'Human') {
    return null
  }

  // Validate bounding box
  const bb = obs.bounding_box
  if (
    bb.left < 0 || bb.left > 1 ||
    bb.top < 0 || bb.top > 1 ||
    bb.right < 0 || bb.right > 1 ||
    bb.bottom < 0 || bb.bottom > 1 ||
    bb.right <= bb.left ||
    bb.bottom <= bb.top
  ) {
    console.warn('[ACAP] Invalid bounding box:', bb)
    return null
  }

  // Convert {left, top, right, bottom} to [x, y, width, height]
  const bbox: [number, number, number, number] = [
    bb.left,
    bb.top,
    bb.right - bb.left,
    bb.bottom - bb.top,
  ]

  return {
    class_name: 'person',
    confidence: obs.class.score,
    bbox,
    track_id: parseTrackId(obs.track_id),
  }
}

/**
 * Transform an ACAP message to a DetectionMessage
 *
 * @param cameraId - Internal camera ID (mapped from ACAP device ID)
 * @param acapMessage - Parsed ACAP message
 * @param frameState - Per-camera frame state for generating frame numbers
 * @returns DetectionMessage compatible with tracking service
 */
export function transformAcapToDetection(
  cameraId: string,
  acapMessage: AcapMessage,
  frameState: Map<string, CameraFrameState>
): DetectionMessage {
  const frame = acapMessage.frame

  // Get or create frame state for this camera
  let state = frameState.get(cameraId)
  if (!state) {
    state = { frameNumber: 0, lastTimestamp: 0 }
    frameState.set(cameraId, state)
  }

  // Increment frame number
  state.frameNumber++
  state.lastTimestamp = Date.now()

  // Parse ISO timestamp to seconds
  const timestamp = new Date(frame.timestamp).getTime() / 1000

  // Transform observations to detections, filtering non-Human
  const detections: RawDetection[] = []
  for (let i = 0; i < frame.observations.length; i++) {
    const detection = transformObservation(frame.observations[i], i)
    if (detection) {
      detections.push(detection)
    }
  }

  return {
    camera_id: cameraId,
    frame_number: state.frameNumber,
    timestamp,
    detection_count: detections.length,
    detections,
  }
}

/**
 * Extract device ID from MQTT topic
 * Topic format: {prefix}/{device_id} (e.g., "analytics_scene/raw/ACAP00408CA1234")
 */
export function extractDeviceIdFromTopic(topic: string, prefix: string): string | null {
  // Remove trailing slash from prefix if present
  const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix

  if (!topic.startsWith(cleanPrefix + '/')) {
    return null
  }

  const deviceId = topic.slice(cleanPrefix.length + 1)

  // Handle nested topics (take first segment)
  const slashIndex = deviceId.indexOf('/')
  if (slashIndex !== -1) {
    return deviceId.slice(0, slashIndex)
  }

  return deviceId || null
}

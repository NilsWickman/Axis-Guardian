/**
 * API Types
 *
 * Types for REST API and WebSocket messages.
 */

import type { GlobalTrackJSON } from './track.js'
import type { ZoneConfig, ZoneViolation, ZoneMetricsData } from './zone.js'

// ============================================================================
// REST API Types
// ============================================================================

/**
 * Detection injection request (for testing via REST API)
 */
export interface InjectDetectionRequest {
  camera_id: string
  timestamp?: number
  frame_number?: number
  detections: Array<{
    class_name?: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    track_id?: number
  }>
}

/**
 * Track list response
 */
export interface TracksResponse {
  count: number
  tracks: GlobalTrackJSON[]
}

/**
 * Frame info per camera for timing diagnostics
 */
export interface CameraFrameInfo {
  cameraId: string
  frameNumber: number
  timestamp: number
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

/**
 * WebSocket message types
 */
export type WebSocketMessage =
  | { type: 'snapshot'; tracks: GlobalTrackJSON[]; frames?: CameraFrameInfo[]; zones?: ZoneConfig[]; zoneMetrics?: ZoneMetricsData[] }
  | { type: 'track_created'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_updated'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_expired'; trackId: string; frames?: CameraFrameInfo[] }
  | { type: 'zone_violation'; violation: ZoneViolation }
  | { type: 'zones_updated'; zones: ZoneConfig[] }
  | { type: 'zone_metrics'; metrics: ZoneMetricsData }
  | { type: 'zones_reset' }

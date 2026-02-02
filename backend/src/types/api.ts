/**
 * API Types
 *
 * Types for REST API and WebSocket messages.
 */

import type { GlobalTrackJSON } from './track.js'

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

/**
 * Camera health status for monitoring
 */
export interface CameraHealthStatus {
  cameraId: string
  lastFrameNumber: number
  lastSeenMs: number        // Time since last detection
  clockOffsetMs: number     // Drift from reference
  frameDropRate: number     // Gaps in frame sequence (0-1)
  status: 'online' | 'stale' | 'offline'
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

/**
 * Track delta for incremental updates (only changed fields)
 */
export interface TrackDelta {
  trackId: string
  position?: { x: number; y: number }
  trail?: { x: number; y: number; timestamp: number }[]  // Append-only trail updates
  confidence?: number
  state?: string
  velocity?: { x: number; y: number }
  lastSeen?: number
  videoTiming?: {
    videoTimeMs?: number
    rtpTimestamp?: number
    cameraId?: string
  }
}

/**
 * WebSocket message types
 */
export type WebSocketMessage =
  | { type: 'snapshot'; tracks: GlobalTrackJSON[]; frames?: CameraFrameInfo[] }
  | { type: 'track_created'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_updated'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_delta'; delta: TrackDelta; frames?: CameraFrameInfo[] }
  | { type: 'track_expired'; trackId: string; frames?: CameraFrameInfo[] }
  | { type: 'frame_info'; frames: CameraFrameInfo[] }

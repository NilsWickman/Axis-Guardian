/**
 * Site Map Configuration Types
 *
 * Canonical type definitions for site map configuration.
 * Used by frontend, tracking-service, and any other services.
 */

import type { Position2D } from './geometry'

/**
 * Camera configuration as stored in JSON config files.
 * This is the canonical format for serialization.
 */
export interface SiteMapCameraConfig {
  /** Unique camera identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Camera model (optional) */
  model?: string
  /** RTSP stream URL */
  rtspUrl?: string
  /** WebRTC endpoint URL */
  webrtcUrl?: string
  /** Camera IP address */
  ipAddress?: string
  /** Position on the site map (meters) */
  position: Position2D
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down from horizontal) */
  elevation: number
  /** Camera mounting height in meters */
  height: number
  /** Horizontal field of view in degrees */
  fieldOfView: number
  /** Display color for visualization */
  color?: string
}

/**
 * Wall segment in a site map
 */
export interface SiteMapWall {
  id: string
  start: Position2D
  end: Position2D
  type?: 'external' | 'internal' | 'door'
}

/**
 * Site map dimensions
 */
export interface SiteMapDimensions {
  width: number
  height: number
  unit: 'meters' | 'feet'
}

/**
 * Complete site map configuration (JSON format)
 */
export interface SiteMapConfig {
  dimensions: SiteMapDimensions
  origin?: Position2D
  walls: SiteMapWall[]
  cameras: SiteMapCameraConfig[]
}

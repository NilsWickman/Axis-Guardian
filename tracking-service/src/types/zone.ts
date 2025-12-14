/**
 * Zone Types
 *
 * Types for restricted zones and violation detection.
 */

import type { Point2D } from './geometry.js'

// ============================================================================
// Zone Configuration
// ============================================================================

export type ZoneType = 'restricted' | 'entry' | 'exit' | 'monitored'
export type ZoneSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ZoneVertex {
  x: number
  y: number
}

export interface ZoneConfig {
  id: string
  siteConfigId: string
  name: string
  type: ZoneType
  vertices: ZoneVertex[]
  enabled: boolean
  severity: ZoneSeverity
  color: string
  cooldownMs: number
  createdAt?: Date
  updatedAt?: Date
}

// ============================================================================
// Zone Violations
// ============================================================================

export interface ZoneViolation {
  id: string
  zoneId: string
  zoneName: string
  zoneType: ZoneType
  trackId: string
  violationType: 'entry' | 'exit' | 'present'
  position: Point2D
  timestamp: number
  severity: ZoneSeverity
  cameraIds: string[]
}

// ============================================================================
// Zone Metrics
// ============================================================================

export interface ZoneMetricsData {
  zoneId: string
  currentCount: number
  totalEntered: number
  crossedCount: number
}

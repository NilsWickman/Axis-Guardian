/**
 * Zone Manager - Handles zone CRUD and violation detection
 *
 * Manages restricted zones and detects when tracks enter/exit them,
 * generating violations (alarms) as appropriate.
 */

import type {
  ZoneConfig,
  ZoneViolation,
  ZoneVertex,
  Point2D,
  ZoneMetricsData,
} from '../types.js'

interface TrackZoneState {
  wasInside: boolean
  lastViolationTime: number
}

interface ZoneMetrics {
  currentOccupants: Set<string> // trackIds currently inside
  totalEntered: number // cumulative count since reset
}

// Re-export for consumers
export type { ZoneMetricsData } from '../types.js'

/**
 * Point-in-polygon using ray casting algorithm
 */
function isPointInPolygon(point: Point2D, vertices: ZoneVertex[]): boolean {
  if (vertices.length < 3) return false

  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }

  return inside
}

export class ZoneManager {
  private zones: Map<string, ZoneConfig> = new Map()

  // Track state per zone per track: Map<trackId, Map<zoneId, state>>
  private trackZoneStates: Map<string, Map<string, TrackZoneState>> = new Map()

  // Zone metrics: Map<zoneId, metrics>
  private zoneMetrics: Map<string, ZoneMetrics> = new Map()

  // Event callback for violations
  onViolation?: (violation: ZoneViolation) => void

  // Event callback for metrics changes
  onMetricsChanged?: (zoneId: string, metrics: ZoneMetricsData) => void

  // Event callback for zone reset
  onZonesReset?: () => void

  /**
   * Load zones from database
   */
  loadZones(zones: ZoneConfig[]): void {
    this.zones.clear()
    this.zoneMetrics.clear()
    for (const zone of zones) {
      if (zone.enabled) {
        this.zones.set(zone.id, zone)
        this.initializeZoneMetrics(zone.id)
      }
    }
    console.log(`[ZoneManager] Loaded ${this.zones.size} active zones`)
  }

  /**
   * Initialize metrics for a zone
   */
  private initializeZoneMetrics(zoneId: string): void {
    if (!this.zoneMetrics.has(zoneId)) {
      this.zoneMetrics.set(zoneId, {
        currentOccupants: new Set(),
        totalEntered: 0,
      })
    }
  }

  /**
   * Add or update a zone
   */
  setZone(zone: ZoneConfig): void {
    if (zone.enabled) {
      this.zones.set(zone.id, zone)
      this.initializeZoneMetrics(zone.id)
      console.log(`[ZoneManager] Zone '${zone.name}' (${zone.id}) added/updated`)
    } else {
      this.zones.delete(zone.id)
      this.zoneMetrics.delete(zone.id)
      console.log(`[ZoneManager] Zone '${zone.name}' (${zone.id}) disabled/removed`)
    }
  }

  /**
   * Remove a zone
   */
  removeZone(zoneId: string): void {
    const zone = this.zones.get(zoneId)
    this.zones.delete(zoneId)
    this.zoneMetrics.delete(zoneId)
    // Clean up track states for this zone
    for (const trackStates of this.trackZoneStates.values()) {
      trackStates.delete(zoneId)
    }
    console.log(`[ZoneManager] Zone '${zone?.name ?? zoneId}' removed`)
  }

  /**
   * Check all zones for a track position
   * Returns violations detected
   */
  checkTrackPosition(
    trackId: string,
    position: Point2D,
    cameraIds: string[],
    timestamp: number = Date.now()
  ): ZoneViolation[] {
    const violations: ZoneViolation[] = []

    // Get or create track's zone states
    let trackStates = this.trackZoneStates.get(trackId)
    if (!trackStates) {
      trackStates = new Map()
      this.trackZoneStates.set(trackId, trackStates)
    }

    for (const zone of this.zones.values()) {
      const isInside = isPointInPolygon(position, zone.vertices)
      const previousState = trackStates.get(zone.id)
      const wasInside = previousState?.wasInside ?? false
      const lastViolationTime = previousState?.lastViolationTime ?? 0

      // Update state
      trackStates.set(zone.id, {
        wasInside: isInside,
        lastViolationTime: previousState?.lastViolationTime ?? 0,
      })

      // Update zone metrics
      const metrics = this.zoneMetrics.get(zone.id)
      if (metrics) {
        let metricsChanged = false

        if (isInside && !wasInside) {
          // Track entered the zone
          metrics.currentOccupants.add(trackId)
          metrics.totalEntered++
          metricsChanged = true
        } else if (!isInside && wasInside) {
          // Track exited the zone
          metrics.currentOccupants.delete(trackId)
          metricsChanged = true
        }

        if (metricsChanged) {
          this.emitMetricsChanged(zone.id, metrics)
        }
      }

      // Check for violations based on zone type
      let violation: ZoneViolation | null = null

      switch (zone.type) {
        case 'restricted':
          // Alarm when entering OR present inside (with cooldown)
          if (isInside && timestamp - lastViolationTime >= zone.cooldownMs) {
            const violationType = wasInside ? 'present' : 'entry'
            violation = this.createViolation(
              zone,
              trackId,
              position,
              violationType,
              cameraIds,
              timestamp
            )
            trackStates.set(zone.id, {
              wasInside: true,
              lastViolationTime: timestamp,
            })
          }
          break

        case 'entry':
          // Alarm only when entering (crossing into zone)
          if (
            isInside &&
            !wasInside &&
            timestamp - lastViolationTime >= zone.cooldownMs
          ) {
            violation = this.createViolation(
              zone,
              trackId,
              position,
              'entry',
              cameraIds,
              timestamp
            )
            trackStates.set(zone.id, {
              wasInside: true,
              lastViolationTime: timestamp,
            })
          }
          break

        case 'exit':
          // Alarm only when exiting (crossing out of zone)
          if (
            !isInside &&
            wasInside &&
            timestamp - lastViolationTime >= zone.cooldownMs
          ) {
            violation = this.createViolation(
              zone,
              trackId,
              position,
              'exit',
              cameraIds,
              timestamp
            )
            trackStates.set(zone.id, {
              wasInside: false,
              lastViolationTime: timestamp,
            })
          }
          break

        case 'monitored':
          // Log entry/exit but lower priority (monitored zones)
          if (isInside !== wasInside) {
            violation = this.createViolation(
              zone,
              trackId,
              position,
              isInside ? 'entry' : 'exit',
              cameraIds,
              timestamp
            )
            trackStates.set(zone.id, {
              wasInside: isInside,
              lastViolationTime: timestamp,
            })
          }
          break
      }

      if (violation) {
        violations.push(violation)
        this.onViolation?.(violation)
      }
    }

    return violations
  }

  /**
   * Clear track state (called when track expires)
   */
  clearTrackState(trackId: string): void {
    this.trackZoneStates.delete(trackId)

    // Remove track from zone occupants
    for (const [zoneId, metrics] of this.zoneMetrics.entries()) {
      if (metrics.currentOccupants.delete(trackId)) {
        this.emitMetricsChanged(zoneId, metrics)
      }
    }
  }

  /**
   * Reset all track states (called on camera/video restart)
   */
  resetAllStates(): void {
    this.trackZoneStates.clear()

    // Reset all zone metrics
    for (const [, metrics] of this.zoneMetrics.entries()) {
      metrics.currentOccupants.clear()
      metrics.totalEntered = 0
    }

    console.log('[ZoneManager] All track zone states and metrics reset')
    this.onZonesReset?.()
  }

  /**
   * Reset states for tracks associated with a specific camera
   */
  resetStatesForCamera(cameraId: string, trackIds: string[]): void {
    for (const trackId of trackIds) {
      this.trackZoneStates.delete(trackId)
    }
    console.log(
      `[ZoneManager] Reset zone states for ${trackIds.length} tracks from camera ${cameraId}`
    )
  }

  private createViolation(
    zone: ZoneConfig,
    trackId: string,
    position: Point2D,
    violationType: 'entry' | 'exit' | 'present',
    cameraIds: string[],
    timestamp: number
  ): ZoneViolation {
    const violation: ZoneViolation = {
      id: `violation-${zone.id}-${trackId}-${timestamp}`,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.type,
      trackId,
      violationType,
      position: { x: position.x, y: position.y },
      timestamp,
      severity: zone.severity,
      cameraIds,
    }

    console.log(
      `[ZoneManager] Violation: Track ${trackId} ${violationType} zone '${zone.name}' (${zone.type}) at (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`
    )

    return violation
  }

  /**
   * Get all loaded zones
   */
  getZones(): ZoneConfig[] {
    return Array.from(this.zones.values())
  }

  /**
   * Get a specific zone by ID
   */
  getZone(zoneId: string): ZoneConfig | undefined {
    return this.zones.get(zoneId)
  }

  /**
   * Check if a point is inside any zone
   */
  isPointInAnyZone(point: Point2D): { inZone: boolean; zones: ZoneConfig[] } {
    const containingZones: ZoneConfig[] = []
    for (const zone of this.zones.values()) {
      if (isPointInPolygon(point, zone.vertices)) {
        containingZones.push(zone)
      }
    }
    return {
      inZone: containingZones.length > 0,
      zones: containingZones,
    }
  }

  /**
   * Get metrics for a specific zone
   */
  getZoneMetrics(zoneId: string): ZoneMetricsData | undefined {
    const metrics = this.zoneMetrics.get(zoneId)
    if (!metrics) return undefined

    return {
      zoneId,
      currentCount: metrics.currentOccupants.size,
      totalEntered: metrics.totalEntered,
      crossedCount: metrics.totalEntered, // same as totalEntered for entry-only
    }
  }

  /**
   * Get metrics for all zones
   */
  getAllZoneMetrics(): ZoneMetricsData[] {
    const allMetrics: ZoneMetricsData[] = []
    for (const zoneId of this.zoneMetrics.keys()) {
      const metrics = this.getZoneMetrics(zoneId)
      if (metrics) {
        allMetrics.push(metrics)
      }
    }
    return allMetrics
  }

  /**
   * Emit metrics changed event
   */
  private emitMetricsChanged(zoneId: string, metrics: ZoneMetrics): void {
    const metricsData: ZoneMetricsData = {
      zoneId,
      currentCount: metrics.currentOccupants.size,
      totalEntered: metrics.totalEntered,
      crossedCount: metrics.totalEntered,
    }
    this.onMetricsChanged?.(zoneId, metricsData)
  }
}

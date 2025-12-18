/**
 * Trail Manager - Manages position history trails for tracks
 *
 * Extracted from TrackManager to provide focused responsibility for
 * trail position history management.
 */

import type { TrailPosition, Point2D } from '../types.js'
import { calculateDistance } from '../correlation/track-matcher.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

export interface TrailManagerConfig {
  /** Maximum number of trail positions to keep per track */
  maxTrailLength: number
  /** Minimum movement distance (meters) to add a new trail point */
  minMovementThreshold: number
}

const DEFAULT_CONFIG: TrailManagerConfig = {
  maxTrailLength: ALGORITHM_CONSTANTS.occlusion.maxOcclusionTrailLength,
  minMovementThreshold: ALGORITHM_CONSTANTS.trackLifecycle.minTrailMovementThreshold,
}

/**
 * TrailManager - Manages trail position history for all tracks
 *
 * Responsibilities:
 * - Maintaining historical trail positions for each track
 * - Enforcing maximum trail length
 * - Adding new trail points based on movement threshold
 */
export class TrailManager {
  private trails: Map<string, TrailPosition[]> = new Map()
  private config: TrailManagerConfig

  constructor(config: Partial<TrailManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get the trail for a specific track
   */
  getTrail(trackId: string): TrailPosition[] {
    return this.trails.get(trackId) ?? []
  }

  /**
   * Initialize a trail for a new track with an initial position
   */
  initializeTrail(trackId: string, position: Point2D, timestamp: number): TrailPosition[] {
    const trail: TrailPosition[] = [{ x: position.x, y: position.y, timestamp }]
    this.trails.set(trackId, trail)
    return trail
  }

  /**
   * Add a trail point if the position has moved enough from the last point
   * Returns true if a new point was added, false otherwise
   */
  addTrailPoint(trackId: string, position: Point2D, timestamp: number): boolean {
    let trail = this.trails.get(trackId)

    if (!trail) {
      // Initialize trail if it doesn't exist
      trail = [{ x: position.x, y: position.y, timestamp }]
      this.trails.set(trackId, trail)
      return true
    }

    // Check movement distance from most recent trail point
    const lastPos = trail[0]
    const movedDistance = lastPos
      ? calculateDistance(position, lastPos)
      : Infinity

    // Only add point if moved enough or trail is empty
    if (movedDistance > this.config.minMovementThreshold || trail.length === 0) {
      // Add to front (newest first)
      trail.unshift({ x: position.x, y: position.y, timestamp })

      // Enforce max length
      if (trail.length > this.config.maxTrailLength) {
        trail.length = this.config.maxTrailLength
      }

      return true
    }

    return false
  }

  /**
   * Update trail with a new position, enforcing max length
   * This is a convenience method that combines addTrailPoint and enforceMaxLength
   */
  updateTrail(trackId: string, position: Point2D, timestamp: number): TrailPosition[] {
    this.addTrailPoint(trackId, position, timestamp)
    return this.getTrail(trackId)
  }

  /**
   * Clear the trail for a specific track
   */
  clearTrail(trackId: string): void {
    this.trails.delete(trackId)
  }

  /**
   * Clear all trails
   */
  clearAllTrails(): void {
    this.trails.clear()
  }

  /**
   * Get the most recent trail position for a track
   */
  getLastPosition(trackId: string): TrailPosition | undefined {
    const trail = this.trails.get(trackId)
    return trail?.[0]
  }

  /**
   * Check if a track has an existing trail
   */
  hasTrail(trackId: string): boolean {
    const trail = this.trails.get(trackId)
    return trail !== undefined && trail.length > 0
  }

  /**
   * Get the number of trail points for a track
   */
  getTrailLength(trackId: string): number {
    return this.trails.get(trackId)?.length ?? 0
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TrailManagerConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): TrailManagerConfig {
    return { ...this.config }
  }
}

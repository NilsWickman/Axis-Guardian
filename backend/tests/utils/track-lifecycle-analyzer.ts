/**
 * Track Lifecycle Analyzer for Physics Validation Tests
 *
 * Analyzes track spawn/disappear events and validates them against
 * physics constraints (FOV visibility, door locations).
 */

import {
  type Point2D,
  type ValidationResult,
  validateSpawnLocation,
  validateDisappearanceLocation,
  type DoorZone,
  DOOR_ZONES,
} from '../../src/geometry/fov-geometry.js'

/**
 * Track position history entry
 */
export interface TrackPosition {
  frameNumber: number
  timestamp: number
  position: Point2D
  cameraId: string
  confidence: number
}

/**
 * Complete history of a track
 */
export interface TrackHistory {
  globalTrackId: string
  positions: TrackPosition[]
  firstSeen: TrackPosition
  lastSeen: TrackPosition
  cameraAssociations: Set<string>
  detectionCount: number
}

/**
 * Track lifecycle event
 */
export interface TrackEvent {
  trackId: string
  type: 'spawn' | 'disappear'
  frameNumber: number
  timestamp: number
  position: Point2D
  isFirstFrame: boolean
  isLastFrame: boolean
}

/**
 * Validation result with track context
 */
export interface TrackValidationResult extends ValidationResult {
  event: TrackEvent
}

/**
 * Physics validation summary
 */
export interface PhysicsValidationSummary {
  totalTracks: number
  validSpawns: number
  invalidSpawns: TrackValidationResult[]
  validDisappearances: number
  invalidDisappearances: TrackValidationResult[]
  endStateViolations: TrackValidationResult[]
  velocityViolations: VelocityViolation[]
}

/**
 * Velocity constraint violation
 */
export interface VelocityViolation {
  trackId: string
  frameNumber: number
  timestamp: number
  velocity: number // m/s
  from: Point2D
  to: Point2D
  maxAllowed: number
}

/**
 * Detection from a single frame
 */
export interface FrameDetection {
  cameraId: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
  confidence: number
  worldPosition?: Point2D
}

/**
 * Track Lifecycle Analyzer
 *
 * Collects track histories and validates spawn/disappear events
 */
export class TrackLifecycleAnalyzer {
  private trackHistories: Map<string, TrackHistory> = new Map()
  private firstFrameNumber: number | null = null
  private lastFrameNumber: number | null = null
  private maxVelocityMs: number = 5.0 // 5 m/s = ~18 km/h (fast walking/jogging)

  constructor(options?: { maxVelocityMs?: number }) {
    if (options?.maxVelocityMs !== undefined) {
      this.maxVelocityMs = options.maxVelocityMs
    }
  }

  /**
   * Record a track observation
   */
  recordObservation(
    globalTrackId: string,
    position: Point2D,
    frameNumber: number,
    timestamp: number,
    cameraId: string,
    confidence: number = 1.0
  ): void {
    // Track first/last frame
    if (this.firstFrameNumber === null || frameNumber < this.firstFrameNumber) {
      this.firstFrameNumber = frameNumber
    }
    if (this.lastFrameNumber === null || frameNumber > this.lastFrameNumber) {
      this.lastFrameNumber = frameNumber
    }

    const obs: TrackPosition = {
      frameNumber,
      timestamp,
      position,
      cameraId,
      confidence,
    }

    let history = this.trackHistories.get(globalTrackId)
    if (!history) {
      history = {
        globalTrackId,
        positions: [],
        firstSeen: obs,
        lastSeen: obs,
        cameraAssociations: new Set(),
        detectionCount: 0,
      }
      this.trackHistories.set(globalTrackId, history)
    }

    history.positions.push(obs)
    history.cameraAssociations.add(cameraId)
    history.detectionCount++

    // Update firstSeen/lastSeen
    if (frameNumber < history.firstSeen.frameNumber) {
      history.firstSeen = obs
    }
    if (frameNumber > history.lastSeen.frameNumber) {
      history.lastSeen = obs
    }
  }

  /**
   * Get all track histories
   */
  getTrackHistories(): Map<string, TrackHistory> {
    return this.trackHistories
  }

  /**
   * Get first frame number
   */
  getFirstFrameNumber(): number | null {
    return this.firstFrameNumber
  }

  /**
   * Get last frame number
   */
  getLastFrameNumber(): number | null {
    return this.lastFrameNumber
  }

  /**
   * Extract spawn events from all tracks
   */
  getSpawnEvents(): TrackEvent[] {
    const events: TrackEvent[] = []

    for (const history of this.trackHistories.values()) {
      events.push({
        trackId: history.globalTrackId,
        type: 'spawn',
        frameNumber: history.firstSeen.frameNumber,
        timestamp: history.firstSeen.timestamp,
        position: history.firstSeen.position,
        isFirstFrame: history.firstSeen.frameNumber === this.firstFrameNumber,
        isLastFrame: false,
      })
    }

    return events
  }

  /**
   * Extract disappear events from all tracks
   */
  getDisappearEvents(): TrackEvent[] {
    const events: TrackEvent[] = []

    for (const history of this.trackHistories.values()) {
      events.push({
        trackId: history.globalTrackId,
        type: 'disappear',
        frameNumber: history.lastSeen.frameNumber,
        timestamp: history.lastSeen.timestamp,
        position: history.lastSeen.position,
        isFirstFrame: false,
        isLastFrame: history.lastSeen.frameNumber === this.lastFrameNumber,
      })
    }

    return events
  }

  /**
   * Validate all spawn events
   */
  validateSpawns(
    fovPolygons: Point2D[][],
    doorZones: DoorZone[] = DOOR_ZONES,
    fovTolerance: number = 0.5
  ): TrackValidationResult[] {
    const events = this.getSpawnEvents()
    const results: TrackValidationResult[] = []

    for (const event of events) {
      const validation = validateSpawnLocation(
        event.position,
        event.isFirstFrame,
        fovPolygons,
        doorZones,
        fovTolerance
      )
      results.push({ ...validation, event })
    }

    return results
  }

  /**
   * Validate all disappear events
   */
  validateDisappearances(
    fovPolygons: Point2D[][],
    doorZones: DoorZone[] = DOOR_ZONES,
    fovTolerance: number = 0.5
  ): TrackValidationResult[] {
    const events = this.getDisappearEvents()
    const results: TrackValidationResult[] = []

    for (const event of events) {
      const validation = validateDisappearanceLocation(
        event.position,
        event.isLastFrame,
        fovPolygons,
        doorZones,
        fovTolerance
      )
      results.push({ ...validation, event })
    }

    return results
  }

  /**
   * Validate end state - no tracks should remain active inside FOV at end of video
   * (unless they exited through a door on the last frame)
   */
  validateEndState(
    fovPolygons: Point2D[][],
    doorZones: DoorZone[] = DOOR_ZONES,
    fovTolerance: number = 0.5
  ): TrackValidationResult[] {
    const violations: TrackValidationResult[] = []

    for (const history of this.trackHistories.values()) {
      // Check if track was seen on the last frame
      if (history.lastSeen.frameNumber === this.lastFrameNumber) {
        // Track is still active at end of video
        const validation = validateDisappearanceLocation(
          history.lastSeen.position,
          true,
          fovPolygons,
          doorZones,
          fovTolerance
        )

        // If the track's last position is inside FOV and not near a door, it's a violation
        if (!validation.valid) {
          violations.push({
            ...validation,
            reason: 'physics_violation',
            details: `Track ${history.globalTrackId} still active at (${history.lastSeen.position.x.toFixed(2)}, ${history.lastSeen.position.y.toFixed(2)}) at end of video`,
            event: {
              trackId: history.globalTrackId,
              type: 'disappear',
              frameNumber: history.lastSeen.frameNumber,
              timestamp: history.lastSeen.timestamp,
              position: history.lastSeen.position,
              isFirstFrame: false,
              isLastFrame: true,
            },
          })
        }
      }
    }

    return violations
  }

  /**
   * Validate velocity constraints
   * Ensures tracks don't move faster than physically possible
   */
  validateVelocityConstraints(): VelocityViolation[] {
    const violations: VelocityViolation[] = []

    for (const history of this.trackHistories.values()) {
      // Sort positions by timestamp
      const sortedPositions = [...history.positions].sort((a, b) => a.timestamp - b.timestamp)

      for (let i = 1; i < sortedPositions.length; i++) {
        const prev = sortedPositions[i - 1]
        const curr = sortedPositions[i]

        const timeDelta = curr.timestamp - prev.timestamp
        if (timeDelta <= 0) continue

        const dist = Math.sqrt(
          Math.pow(curr.position.x - prev.position.x, 2) + Math.pow(curr.position.y - prev.position.y, 2)
        )

        const velocity = dist / timeDelta // m/s

        if (velocity > this.maxVelocityMs) {
          violations.push({
            trackId: history.globalTrackId,
            frameNumber: curr.frameNumber,
            timestamp: curr.timestamp,
            velocity,
            from: prev.position,
            to: curr.position,
            maxAllowed: this.maxVelocityMs,
          })
        }
      }
    }

    return violations
  }

  /**
   * Run full physics validation and return summary
   */
  validateAll(
    fovPolygons: Point2D[][],
    doorZones: DoorZone[] = DOOR_ZONES,
    fovTolerance: number = 0.5
  ): PhysicsValidationSummary {
    const spawnResults = this.validateSpawns(fovPolygons, doorZones, fovTolerance)
    const disappearResults = this.validateDisappearances(fovPolygons, doorZones, fovTolerance)
    const endStateViolations = this.validateEndState(fovPolygons, doorZones, fovTolerance)
    const velocityViolations = this.validateVelocityConstraints()

    const validSpawns = spawnResults.filter((r) => r.valid).length
    const invalidSpawns = spawnResults.filter((r) => !r.valid)
    const validDisappearances = disappearResults.filter((r) => r.valid).length
    const invalidDisappearances = disappearResults.filter((r) => !r.valid)

    return {
      totalTracks: this.trackHistories.size,
      validSpawns,
      invalidSpawns,
      validDisappearances,
      invalidDisappearances,
      endStateViolations,
      velocityViolations,
    }
  }

  /**
   * Print validation summary to console
   */
  printSummary(summary: PhysicsValidationSummary): void {
    console.log('\nPhysics Validation Results:')
    console.log(`  Total tracks analyzed: ${summary.totalTracks}`)
    console.log(`  Valid spawns: ${summary.validSpawns}`)
    console.log(`  Invalid spawns: ${summary.invalidSpawns.length}`)

    for (const violation of summary.invalidSpawns) {
      console.log(
        `    - Track ${violation.event.trackId}: spawned at (${violation.event.position.x.toFixed(2)}, ${violation.event.position.y.toFixed(2)}) inside FOV at frame ${violation.event.frameNumber}`
      )
    }

    console.log(`\n  Valid disappearances: ${summary.validDisappearances}`)
    console.log(`  Invalid disappearances: ${summary.invalidDisappearances.length}`)

    for (const violation of summary.invalidDisappearances) {
      console.log(
        `    - Track ${violation.event.trackId}: disappeared at (${violation.event.position.x.toFixed(2)}, ${violation.event.position.y.toFixed(2)}) inside FOV at frame ${violation.event.frameNumber}`
      )
    }

    console.log(`\n  End state violations: ${summary.endStateViolations.length}`)

    for (const violation of summary.endStateViolations) {
      console.log(
        `    - Track ${violation.event.trackId}: still active at (${violation.event.position.x.toFixed(2)}, ${violation.event.position.y.toFixed(2)}) at end of video`
      )
    }

    console.log(`\n  Velocity violations: ${summary.velocityViolations.length}`)

    for (const violation of summary.velocityViolations.slice(0, 5)) {
      console.log(
        `    - Track ${violation.trackId}: moved at ${violation.velocity.toFixed(2)} m/s (max: ${violation.maxAllowed} m/s) at frame ${violation.frameNumber}`
      )
    }

    if (summary.velocityViolations.length > 5) {
      console.log(`    ... and ${summary.velocityViolations.length - 5} more`)
    }
  }

  /**
   * Clear all collected data
   */
  clear(): void {
    this.trackHistories.clear()
    this.firstFrameNumber = null
    this.lastFrameNumber = null
  }
}

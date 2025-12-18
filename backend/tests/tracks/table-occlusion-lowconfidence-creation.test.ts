import { describe, it, expect } from 'vitest'
import { TrackManager } from '../../src/tracks/track-manager.js'
import type { CameraDetection } from '../../src/types.js'

describe('table occlusion low-confidence creation', () => {
  it('allows creating a track from a table-occluded detection slightly below minCreationConfidence when it has a local trackId', () => {
    let now = 1000
    const tm = new TrackManager({
      clock: () => now,
      config: {
        minCreationConfidence: 0.7,
        minDetectionsToConfirm: 3,
      },
    })

    const det = (isTableOccluded: boolean, conf: number): CameraDetection => ({
      cameraId: 'camera1',
      trackId: 42,
      worldX: 5.0,
      worldY: 5.0,
      confidence: conf,
      timestamp: now,
      frameNumber: 1,
      isTableOccluded,
    })

    // Below minCreationConfidence but table-occluded -> should create
    tm.processBatchDetections([det(true, 0.60)])
    expect(tm.getAllTracks().length).toBe(1)

    // Reset and ensure non-occluded below threshold does not create
    const tm2 = new TrackManager({
      clock: () => now,
      config: {
        minCreationConfidence: 0.7,
        minDetectionsToConfirm: 3,
      },
    })
    tm2.processBatchDetections([det(false, 0.60)])
    expect(tm2.getAllTracks().length).toBe(0)
  })
})





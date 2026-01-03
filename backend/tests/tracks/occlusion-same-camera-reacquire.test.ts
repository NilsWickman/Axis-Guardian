import { describe, it, expect } from 'vitest'
import { TrackManager } from '../../src/tracks/track-manager.js'
import type { CameraDetection } from '../../src/types.js'
import type { CameraConfig, RoomBounds } from '../../src/geometry/fov-geometry.js'
import type { SiteMapObstacle } from '../../src/config/sitemap-loader.js'

describe('occlusion same-camera reacquire (local trackId changes)', () => {
  it('re-attaches a cluster to an occluded track even if the camera-local trackId changed', () => {
    let now = 1000
    const tm = new TrackManager({
      clock: () => now,
      idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
    })

    const roomBounds: RoomBounds = { width: 18, height: 12 }
    const cameras: CameraConfig[] = [
      { id: 'camera1', position: { x: 16.22, y: 11.7 }, azimuth: 197, fieldOfView: 66 },
      { id: 'camera2', position: { x: 0.9, y: 10.8 }, azimuth: 129.5, fieldOfView: 60 },
    ]
    const obstacles: SiteMapObstacle[] = [
      { id: 'pillar-1', type: 'circle', position: { x: 5.5, y: 3 }, radius: 0.25, blocksTracking: true, blocksView: true },
    ]
    tm.setSiteMapGeometry(cameras, obstacles, roomBounds)

    // Create a consistent embedding for all detections from same "person"
    const samePersonEmbedding = Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1) * 0.1)

    const det = (t: number, cam: string, localId: number, x: number, y: number, frame: number): CameraDetection => ({
      cameraId: cam,
      trackId: localId,
      worldX: x,
      worldY: y,
      confidence: 0.95,
      timestamp: t,
      frameNumber: frame,
      attributes: {
        embedding: samePersonEmbedding,
        embedding_quality: 0.5,
      },
    })

    // Create a track from camera2 with localId=10 and confirm it
    now = 1000
    tm.processBatchDetections([det(now, 'camera2', 10, 5.2, 3.0, 1)])
    now = 1100
    tm.processBatchDetections([det(now, 'camera2', 10, 5.3, 3.0, 2)])
    now = 1200
    const tr = tm.processBatchDetections([det(now, 'camera2', 10, 5.35, 3.0, 3)])[0]
    expect(tr.isConfirmed).toBe(true)
    const id = tr.globalTrackId

    // Force it into occluded/pillar state (simulate disappearance)
    const track = tm.getTrackById(id)!
    track.state = 'occluded'
    track.exitReason = 'pillar_occlusion'
    track.occludedSince = now
    track.lastSeen = now

    // Reappear on SAME camera but with new localId=77 near predicted position.
    now = 1900
    const out = tm.processBatchDetections([det(now, 'camera2', 77, 5.55, 3.0, 4)])
    expect(out.length).toBeGreaterThan(0)
    expect(out[0].globalTrackId).toBe(id)
  })
})





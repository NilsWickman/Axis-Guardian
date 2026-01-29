import { describe, it, expect } from 'vitest'
import { TrackManager } from '../../src/tracks/track-manager.js'
import type { CameraDetection } from '../../src/types.js'
import type { CameraConfig, RoomBounds } from '../../src/geometry/fov-geometry.js'
import type { SiteMapObstacle } from '../../src/config/sitemap-loader.js'

describe('pillar occlusion continuity', () => {
  it('keeps the same global track when a person disappears behind a pillar and reappears shortly after', () => {
    let now = 0
    const tm = new TrackManager({
      clock: () => now,
      // Make this test fast/deterministic
      config: {
        minDetectionsToConfirm: 3,
        missedFramesBeforeOcclusion: 10, // ~1s at 10fps fallback
      },
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

    const det = (t: number, x: number, y: number, frame: number): CameraDetection => ({
      cameraId: 'camera1',
      localTrackId: 1,
      worldX: x,
      worldY: y,
      confidence: 0.95,
      timestamp: t,
      frameNumber: frame,
    })

    // Create + confirm track (3 detections)
    now = 1000
    tm.processBatchDetections([det(now, 5.05, 3.00, 10)])
    now = 1100
    tm.processBatchDetections([det(now, 5.20, 3.00, 11)])
    now = 1200
    const confirmed = tm.processBatchDetections([det(now, 5.32, 3.00, 12)])[0]
    expect(confirmed).toBeTruthy()
    const id = confirmed.globalTrackId
    expect(confirmed.isConfirmed).toBe(true)

    // Simulate detection gap while behind pillar: no detections, run cleanup once
    now = 2600 // 1.4s gap -> should be occluded by time-based missed frame fallback
    tm.cleanupExpiredTracks()
    const mid = tm.getTrackById(id)
    expect(mid?.isActive).toBe(true)
    expect(mid?.state).toBe('occluded')

    // Reappear shortly after pillar: should match existing track (no respawn)
    now = 3000
    const after = tm.processBatchDetections([det(now, 5.85, 3.00, 13)])[0]
    expect(after.globalTrackId).toBe(id)
    expect(after.isActive).toBe(true)
  })

  it('moves unconfirmed tracks to occluded early for pillar occlusion (prevents start-of-video respawn)', () => {
    let now = 0
    const tm = new TrackManager({
      clock: () => now,
      config: {
        // Ensure this stays unconfirmed with a single detection
        minDetectionsToConfirm: 3,
        unconfirmedTrackExpiryMs: 3000,
      },
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

    // Single detection near pillar region (unconfirmed track)
    now = 1000
    const created = tm.processDetection('camera1', 1, 5.32, 3.00, 0.95)
    expect(created.isConfirmed).toBe(false)
    expect(created.state).toBe('unconfirmed')

    // Wait past early occlusion window but before unconfirmed expiry, then cleanup
    now = 2000
    tm.cleanupExpiredTracks()
    const t = tm.getTrackById(created.globalTrackId)
    expect(t?.isActive).toBe(true)
    // We expect pillar-driven early transition to occluded
    expect(t?.state).toBe('occluded')
    expect(t?.exitReason === 'pillar_occlusion' || t?.exitReason === 'partial_occlusion').toBe(true)
  })
})



/**
 * Tests for SynchronizedDetectionProcessor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SynchronizedDetectionProcessor } from './synchronized-detection-processor.js'
import type { DetectionMessage, GlobalTrack, CameraFrameInfo } from '../types.js'
import type { IDetectionProcessor } from '../detection/detection-processor.js'

function createMessage(cameraId: string, frameNumber: number): DetectionMessage {
  return {
    camera_id: cameraId,
    frame_number: frameNumber,
    timestamp: Date.now() / 1000,
    detection_count: 1,
    video_time_ms: frameNumber * 33,
    detections: [{
      class_name: 'person',
      confidence: 0.9,
      bbox: [0.1, 0.1, 0.2, 0.4],
      track_id: 1,
    }],
  }
}

describe('SynchronizedDetectionProcessor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('processMessageAwaitFlush resolves when a flush containing the message occurs', async () => {
    const multiCalls: DetectionMessage[][] = []

    const base: IDetectionProcessor = {
      processMessage: () => [],
      processMultiCameraMessages: (messages) => {
        multiCalls.push(messages)
        return [{ globalTrackId: `t-${messages.length}` }] as unknown as GlobalTrack[]
      },
            setObstacles: () => {},
      setRoomBounds: () => {},
      getCameraFrameInfo: (): CameraFrameInfo[] => [],
      getCameraHealthStatus: () => [],
      getLastProcessedFrame: () => 0,
      updateFrameInfo: () => {},
      resetFrameTracking: () => {},
      processInjection: () => null,
      processWorldPosition: () => ({ globalTrackId: 't' } as unknown as GlobalTrack),
    }

    const proc = new SynchronizedDetectionProcessor(base, { enabled: true, syncWindowMs: 100 })
    proc.registerCamera('camera1')
    proc.registerCamera('camera2')

    const p1 = proc.processMessageAwaitFlush(createMessage('camera1', 1), 1000)
    const p2 = proc.processMessageAwaitFlush(createMessage('camera2', 1), 1000)

    const r1 = await p1
    const r2 = await p2

    expect(r1.timedOut).toBe(false)
    expect(r2.timedOut).toBe(false)
    expect(r1.tracks.length).toBe(1)
    expect(r1.tracks[0].globalTrackId).toBe('t-2')
    expect(r2.tracks[0].globalTrackId).toBe('t-2')
    expect(multiCalls.length).toBe(1)
    expect(multiCalls[0].length).toBe(2)

    proc.destroy()
  })

  it('processMessageAwaitFlush can return timedOut=true if caller timeout elapses before flush', async () => {
    const base: IDetectionProcessor = {
      processMessage: () => [],
      processMultiCameraMessages: () => [{ globalTrackId: 't' }] as unknown as GlobalTrack[],
            setObstacles: () => {},
      setRoomBounds: () => {},
      getCameraFrameInfo: (): CameraFrameInfo[] => [],
      getCameraHealthStatus: () => [],
      getLastProcessedFrame: () => 0,
      updateFrameInfo: () => {},
      resetFrameTracking: () => {},
      processInjection: () => null,
      processWorldPosition: () => ({ globalTrackId: 't' } as unknown as GlobalTrack),
    }

    const proc = new SynchronizedDetectionProcessor(base, { enabled: true, syncWindowMs: 100 })
    proc.registerCamera('camera1')
    proc.registerCamera('camera2')

    const p = proc.processMessageAwaitFlush(createMessage('camera1', 1), 1)
    vi.advanceTimersByTime(2)
    const r = await p

    expect(r.timedOut).toBe(true)
    expect(Array.isArray(r.tracks)).toBe(true)

    proc.destroy()
  })
})



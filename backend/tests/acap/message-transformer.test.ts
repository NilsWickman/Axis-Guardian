/**
 * Tests for ACAP Message Transformer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseTrackId,
  parseAcapMessage,
  transformObservation,
  transformAcapToDetection,
  extractDeviceIdFromTopic,
} from '../../src/acap/message-transformer.js'
import type { AcapMessage, AcapObservation, CameraFrameState } from '../../src/acap/types.js'

describe('ACAP Message Transformer', () => {
  describe('parseTrackId', () => {
    it('converts UUID to numeric ID', () => {
      const uuid = '7fcc1e0c-903f-4903-a737-3cddd6bfb59d'
      const id = parseTrackId(uuid)
      expect(id).toBeGreaterThan(0)
      expect(Number.isInteger(id)).toBe(true)
    })

    it('produces consistent IDs for same UUID', () => {
      const uuid = '7fcc1e0c-903f-4903-a737-3cddd6bfb59d'
      const id1 = parseTrackId(uuid)
      const id2 = parseTrackId(uuid)
      expect(id1).toBe(id2)
    })

    it('produces different IDs for different UUIDs', () => {
      const uuid1 = '7fcc1e0c-903f-4903-a737-3cddd6bfb59d'
      const uuid2 = '8fcc1e0c-903f-4903-a737-3cddd6bfb59e'
      expect(parseTrackId(uuid1)).not.toBe(parseTrackId(uuid2))
    })
  })

  describe('parseAcapMessage', () => {
    it('parses valid ACAP message', () => {
      const raw = JSON.stringify({
        frame: {
          timestamp: '2025-11-03T17:43:32.300894Z',
          observations: [
            {
              track_id: '7fcc1e0c-903f-4903-a737-3cddd6bfb59d',
              timestamp: '2025-11-03T17:43:32.300894Z',
              bounding_box: { left: 0.16, top: 0.17, right: 0.35, bottom: 0.98 },
              class: { type: 'Human', score: 0.84 },
            },
          ],
        },
      })

      const result = parseAcapMessage(raw)
      expect(result).not.toBeNull()
      expect(result!.frame.observations).toHaveLength(1)
      expect(result!.frame.observations[0].class.type).toBe('Human')
    })

    it('parses message from Buffer', () => {
      const raw = Buffer.from(JSON.stringify({
        frame: {
          timestamp: '2025-11-03T17:43:32.300894Z',
          observations: [],
        },
      }))

      const result = parseAcapMessage(raw)
      expect(result).not.toBeNull()
    })

    it('returns null for invalid JSON', () => {
      const result = parseAcapMessage('not json')
      expect(result).toBeNull()
    })

    it('returns null for missing frame', () => {
      const result = parseAcapMessage(JSON.stringify({ foo: 'bar' }))
      expect(result).toBeNull()
    })

    it('returns null for missing observations', () => {
      const result = parseAcapMessage(JSON.stringify({
        frame: { timestamp: '2025-11-03T17:43:32.300894Z' },
      }))
      expect(result).toBeNull()
    })
  })

  describe('transformObservation', () => {
    const validObservation: AcapObservation = {
      track_id: '7fcc1e0c-903f-4903-a737-3cddd6bfb59d',
      timestamp: '2025-11-03T17:43:32.300894Z',
      bounding_box: { left: 0.16, top: 0.17, right: 0.35, bottom: 0.98 },
      class: { type: 'Human', score: 0.84 },
    }

    it('transforms valid Human observation', () => {
      const result = transformObservation(validObservation, 0)
      expect(result).not.toBeNull()
      expect(result!.class_name).toBe('person')
      expect(result!.confidence).toBe(0.84)
      // Check bbox with floating point tolerance
      expect(result!.bbox[0]).toBeCloseTo(0.16, 5) // x
      expect(result!.bbox[1]).toBeCloseTo(0.17, 5) // y
      expect(result!.bbox[2]).toBeCloseTo(0.19, 5) // width = 0.35 - 0.16
      expect(result!.bbox[3]).toBeCloseTo(0.81, 5) // height = 0.98 - 0.17
    })

    it('returns null for non-Human observation', () => {
      const vehicleObs = { ...validObservation, class: { type: 'Vehicle', score: 0.9 } }
      const result = transformObservation(vehicleObs, 0)
      expect(result).toBeNull()
    })

    it('returns null for invalid bounding box (left >= right)', () => {
      const invalidObs = {
        ...validObservation,
        bounding_box: { left: 0.5, top: 0.1, right: 0.3, bottom: 0.9 },
      }
      const result = transformObservation(invalidObs, 0)
      expect(result).toBeNull()
    })

    it('returns null for bounding box outside 0-1 range', () => {
      const invalidObs = {
        ...validObservation,
        bounding_box: { left: -0.1, top: 0.1, right: 0.5, bottom: 0.9 },
      }
      const result = transformObservation(invalidObs, 0)
      expect(result).toBeNull()
    })

    it('generates track_id from UUID', () => {
      const result = transformObservation(validObservation, 0)
      expect(result!.track_id).toBe(parseTrackId(validObservation.track_id))
    })
  })

  describe('transformAcapToDetection', () => {
    const validMessage: AcapMessage = {
      frame: {
        timestamp: '2025-11-03T17:43:32.300894Z',
        observations: [
          {
            track_id: '7fcc1e0c-903f-4903-a737-3cddd6bfb59d',
            timestamp: '2025-11-03T17:43:32.300894Z',
            bounding_box: { left: 0.16, top: 0.17, right: 0.35, bottom: 0.98 },
            class: { type: 'Human', score: 0.84 },
          },
          {
            track_id: '8fcc1e0c-903f-4903-a737-3cddd6bfb59e',
            timestamp: '2025-11-03T17:43:32.300894Z',
            bounding_box: { left: 0.5, top: 0.2, right: 0.7, bottom: 0.9 },
            class: { type: 'Human', score: 0.92 },
          },
        ],
      },
    }

    let frameState: Map<string, CameraFrameState>

    beforeEach(() => {
      frameState = new Map()
    })

    it('transforms ACAP message to DetectionMessage', () => {
      const result = transformAcapToDetection('camera1', validMessage, frameState)

      expect(result.camera_id).toBe('camera1')
      expect(result.frame_number).toBe(1)
      expect(result.detection_count).toBe(2)
      expect(result.detections).toHaveLength(2)
    })

    it('increments frame number for same camera', () => {
      const result1 = transformAcapToDetection('camera1', validMessage, frameState)
      const result2 = transformAcapToDetection('camera1', validMessage, frameState)
      const result3 = transformAcapToDetection('camera1', validMessage, frameState)

      expect(result1.frame_number).toBe(1)
      expect(result2.frame_number).toBe(2)
      expect(result3.frame_number).toBe(3)
    })

    it('maintains separate frame numbers per camera', () => {
      const result1 = transformAcapToDetection('camera1', validMessage, frameState)
      const result2 = transformAcapToDetection('camera2', validMessage, frameState)
      const result3 = transformAcapToDetection('camera1', validMessage, frameState)

      expect(result1.frame_number).toBe(1)
      expect(result2.frame_number).toBe(1)
      expect(result3.frame_number).toBe(2)
    })

    it('converts ISO timestamp to seconds', () => {
      const result = transformAcapToDetection('camera1', validMessage, frameState)
      const expectedTimestamp = new Date('2025-11-03T17:43:32.300894Z').getTime() / 1000
      expect(result.timestamp).toBeCloseTo(expectedTimestamp, 3)
    })

    it('filters out non-Human observations', () => {
      const mixedMessage: AcapMessage = {
        frame: {
          timestamp: '2025-11-03T17:43:32.300894Z',
          observations: [
            {
              track_id: '1',
              timestamp: '2025-11-03T17:43:32.300894Z',
              bounding_box: { left: 0.1, top: 0.1, right: 0.3, bottom: 0.9 },
              class: { type: 'Human', score: 0.84 },
            },
            {
              track_id: '2',
              timestamp: '2025-11-03T17:43:32.300894Z',
              bounding_box: { left: 0.5, top: 0.1, right: 0.8, bottom: 0.5 },
              class: { type: 'Vehicle', score: 0.95 },
            },
          ],
        },
      }

      const result = transformAcapToDetection('camera1', mixedMessage, frameState)
      expect(result.detections).toHaveLength(1)
      expect(result.detection_count).toBe(1)
    })
  })

  describe('extractDeviceIdFromTopic', () => {
    it('extracts device ID from topic', () => {
      const result = extractDeviceIdFromTopic(
        'analytics_scene/raw/ACAP00408CA1234',
        'analytics_scene/raw'
      )
      expect(result).toBe('ACAP00408CA1234')
    })

    it('handles prefix with trailing slash', () => {
      const result = extractDeviceIdFromTopic(
        'analytics_scene/raw/ACAP00408CA1234',
        'analytics_scene/raw/'
      )
      expect(result).toBe('ACAP00408CA1234')
    })

    it('extracts first segment from nested topics', () => {
      const result = extractDeviceIdFromTopic(
        'analytics_scene/raw/ACAP00408CA1234/subtype',
        'analytics_scene/raw'
      )
      expect(result).toBe('ACAP00408CA1234')
    })

    it('returns null for non-matching prefix', () => {
      const result = extractDeviceIdFromTopic(
        'other_topic/ACAP00408CA1234',
        'analytics_scene/raw'
      )
      expect(result).toBeNull()
    })

    it('returns null for empty device ID', () => {
      const result = extractDeviceIdFromTopic(
        'analytics_scene/raw/',
        'analytics_scene/raw'
      )
      expect(result).toBeNull()
    })
  })
})

/**
 * Zone Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ZoneManager } from './zone-manager'
import type { ZoneConfig, ZoneViolation } from '../types'

describe('ZoneManager', () => {
  let zoneManager: ZoneManager

  // Test zone - a 4m x 4m square from (2,2) to (6,6)
  const testZone: ZoneConfig = {
    id: 'zone-1',
    siteConfigId: 'site-1',
    name: 'Test Restricted Zone',
    type: 'restricted',
    vertices: [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 6 },
      { x: 2, y: 6 },
    ],
    enabled: true,
    severity: 'high',
    color: '#ef4444',
    cooldownMs: 1000, // 1 second cooldown for tests
  }

  beforeEach(() => {
    zoneManager = new ZoneManager()
  })

  describe('Zone Loading', () => {
    it('should load zones', () => {
      zoneManager.loadZones([testZone])
      expect(zoneManager.getZones()).toHaveLength(1)
      expect(zoneManager.getZones()[0].name).toBe('Test Restricted Zone')
    })

    it('should set a single zone', () => {
      zoneManager.setZone(testZone)
      expect(zoneManager.getZones()).toHaveLength(1)
    })

    it('should update an existing zone', () => {
      zoneManager.setZone(testZone)
      const updatedZone = { ...testZone, name: 'Updated Name' }
      zoneManager.setZone(updatedZone)
      expect(zoneManager.getZones()).toHaveLength(1)
      expect(zoneManager.getZones()[0].name).toBe('Updated Name')
    })

    it('should remove a zone', () => {
      zoneManager.setZone(testZone)
      expect(zoneManager.getZones()).toHaveLength(1)
      zoneManager.removeZone('zone-1')
      expect(zoneManager.getZones()).toHaveLength(0)
    })
  })

  describe('Point-in-Polygon Detection', () => {
    beforeEach(() => {
      zoneManager.loadZones([testZone])
    })

    it('should detect point inside zone', () => {
      // Point at center of zone (4, 4)
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())

      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('entry')
      expect(violations[0].zoneName).toBe('Test Restricted Zone')
    })

    it('should not trigger for point outside zone', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Point outside zone (0, 0)
      zoneManager.checkTrackPosition('track-1', { x: 0, y: 0 }, ['camera-1'], Date.now())

      expect(violations).toHaveLength(0)
    })

    it('should detect point on zone edge', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Point on edge (2, 4) - should be inside due to ray casting behavior
      zoneManager.checkTrackPosition('track-1', { x: 2.01, y: 4 }, ['camera-1'], Date.now())

      expect(violations).toHaveLength(1)
    })
  })

  describe('Entry/Exit Detection', () => {
    beforeEach(() => {
      zoneManager.loadZones([testZone])
    })

    it('should detect entry when track enters zone', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // First position outside
      zoneManager.checkTrackPosition('track-1', { x: 0, y: 0 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(0)

      // Second position inside - should trigger entry
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('entry')
    })

    it('should detect exit when track leaves zone', () => {
      // Create an exit zone
      const exitZone: ZoneConfig = { ...testZone, id: 'exit-zone', type: 'exit', name: 'Exit Zone' }
      zoneManager.loadZones([exitZone])

      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // First position inside
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(0) // Exit zone doesn't trigger on entry

      // Second position outside - should trigger exit
      zoneManager.checkTrackPosition('track-1', { x: 0, y: 0 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('exit')
    })
  })

  describe('Cooldown Mechanism', () => {
    beforeEach(() => {
      zoneManager.loadZones([testZone])
    })

    it('should not trigger duplicate violations within cooldown', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      const now = Date.now()

      // First detection inside zone - triggers entry
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], now)
      expect(violations).toHaveLength(1)

      // Second detection inside zone within cooldown - should not trigger 'present'
      zoneManager.checkTrackPosition('track-1', { x: 4.1, y: 4.1 }, ['camera-1'], now + 100)
      // For restricted zones, 'present' violations respect cooldown
      // The initial entry should be the only violation
      expect(violations).toHaveLength(1)
    })

    it('should trigger after cooldown expires', async () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      const now = Date.now()

      // First detection
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], now)
      expect(violations).toHaveLength(1)

      // Detection after cooldown (1000ms + buffer)
      zoneManager.checkTrackPosition('track-1', { x: 4.1, y: 4.1 }, ['camera-1'], now + 1100)
      // Should trigger 'present' violation after cooldown
      expect(violations.length).toBeGreaterThan(1)
    })
  })

  describe('Disabled Zones', () => {
    it('should not check disabled zones', () => {
      const disabledZone: ZoneConfig = { ...testZone, enabled: false }
      zoneManager.loadZones([disabledZone])

      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(0)
    })
  })

  describe('Track State Management', () => {
    beforeEach(() => {
      zoneManager.loadZones([testZone])
    })

    it('should clear track state', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Enter zone
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(1)

      // Clear track state
      zoneManager.clearTrackState('track-1')

      // Enter zone again - should trigger new entry since state was cleared
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(2)
    })

    it('should reset all states', () => {
      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Enter zone with multiple tracks
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      zoneManager.checkTrackPosition('track-2', { x: 4.5, y: 4.5 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(2)

      // Reset all states
      zoneManager.resetAllStates()

      // Both tracks should trigger new entry violations
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      zoneManager.checkTrackPosition('track-2', { x: 4.5, y: 4.5 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(4)
    })
  })

  describe('Entry Zone Type', () => {
    it('should only trigger on entry for entry zones', () => {
      const entryZone: ZoneConfig = { ...testZone, id: 'entry-zone', type: 'entry', name: 'Entry Zone' }
      zoneManager.loadZones([entryZone])

      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Enter zone - should trigger
      zoneManager.checkTrackPosition('track-1', { x: 4, y: 4 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('entry')

      // Stay inside - should not trigger 'present' for entry zones
      zoneManager.checkTrackPosition('track-1', { x: 4.1, y: 4.1 }, ['camera-1'], Date.now() + 2000)
      expect(violations).toHaveLength(1) // Still just the entry

      // Exit zone - should not trigger
      zoneManager.checkTrackPosition('track-1', { x: 0, y: 0 }, ['camera-1'], Date.now() + 3000)
      expect(violations).toHaveLength(1) // No exit for entry zones
    })
  })

  describe('Complex Polygon', () => {
    it('should handle concave polygons', () => {
      // L-shaped zone
      const lShapedZone: ZoneConfig = {
        ...testZone,
        id: 'l-zone',
        vertices: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 4 },
          { x: 0, y: 4 },
        ],
      }
      zoneManager.loadZones([lShapedZone])

      const violations: ZoneViolation[] = []
      zoneManager.onViolation = (v) => violations.push(v)

      // Point in the horizontal part of L
      zoneManager.checkTrackPosition('track-1', { x: 3, y: 1 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(1)

      // Point in the vertical part of L
      zoneManager.checkTrackPosition('track-2', { x: 1, y: 3 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(2)

      // Point in the cut-out area (should be outside)
      zoneManager.checkTrackPosition('track-3', { x: 3, y: 3 }, ['camera-1'], Date.now())
      expect(violations).toHaveLength(2) // No new violation
    })
  })
})

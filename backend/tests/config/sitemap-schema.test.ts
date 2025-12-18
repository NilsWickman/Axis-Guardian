/**
 * Tests for Sitemap Schema Validation
 *
 * These tests validate that the sitemap.schema.json correctly enforces
 * obstacle type-specific requirements.
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load the schema
const schemaPath = resolve(__dirname, '../../../shared/config/sitemap.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))

// Create validator
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

// Helper to create a minimal valid sitemap
function createMinimalSitemap(obstacles: unknown[] = []) {
  return {
    dimensions: { width: 18, height: 12, unit: 'meters' },
    walls: [
      { id: 'wall-1', start: { x: 0, y: 0 }, end: { x: 18, y: 0 } },
    ],
    cameras: [
      {
        id: 'camera1',
        name: 'Test Camera',
        position: { x: 9, y: 6 },
        azimuth: 0,
        height: 2.5,
        fieldOfView: 80,
      },
    ],
    obstacles,
  }
}

describe('Sitemap Schema - Obstacle Validation', () => {
  describe('circle obstacles', () => {
    it('validates a complete circle obstacle', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          radius: 0.25,
          label: 'Support Pillar',
          category: 'structural',
          height: 3.0,
          blocksTracking: true,
          blocksView: true,
          color: '#e2e8f0',
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('validates a minimal circle obstacle', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          radius: 0.5,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('rejects circle without radius', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          // missing radius
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
      expect(validate.errors).toBeDefined()
    })

    it('rejects negative radius', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          radius: -1,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })
  })

  describe('rectangle obstacles', () => {
    it('validates a complete rectangle obstacle', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 9, y: 6 },
          dimensions: { width: 3.0, height: 1.2 },
          rotation: 45,
          label: 'Conference Table',
          category: 'furniture',
          height: 0.75,
          blocksTracking: false,
          blocksView: false,
          color: 'stone-600',
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('validates a minimal rectangle obstacle', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 9, y: 6 },
          dimensions: { width: 2.0, height: 1.0 },
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('rejects rectangle without dimensions', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 9, y: 6 },
          // missing dimensions
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects rectangle with incomplete dimensions', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 9, y: 6 },
          dimensions: { width: 2.0 }, // missing height
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })
  })

  describe('polygon obstacles', () => {
    it('validates a complete polygon obstacle', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'L-desk',
          type: 'polygon',
          position: { x: 5, y: 5 },
          vertices: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 0, y: 2 },
          ],
          label: 'L-shaped Desk',
          category: 'furniture',
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('validates a minimal polygon obstacle (triangle)', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'triangle-1',
          type: 'polygon',
          position: { x: 5, y: 5 },
          vertices: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 1, y: 2 },
          ],
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('rejects polygon without vertices', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'polygon-1',
          type: 'polygon',
          position: { x: 5, y: 5 },
          // missing vertices
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects polygon with less than 3 vertices', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'polygon-1',
          type: 'polygon',
          position: { x: 5, y: 5 },
          vertices: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })
  })

  describe('common obstacle properties', () => {
    it('rejects obstacle without id', () => {
      const sitemap = createMinimalSitemap([
        {
          type: 'circle',
          position: { x: 5, y: 5 },
          radius: 1,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects obstacle without type', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'obstacle-1',
          position: { x: 5, y: 5 },
          radius: 1,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects obstacle without position', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'obstacle-1',
          type: 'circle',
          radius: 1,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects invalid obstacle type', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'obstacle-1',
          type: 'invalid',
          position: { x: 5, y: 5 },
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects invalid category', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'obstacle-1',
          type: 'circle',
          position: { x: 5, y: 5 },
          radius: 1,
          category: 'invalid',
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('validates all valid categories', () => {
      const categories = ['furniture', 'structural', 'equipment']

      for (const category of categories) {
        const sitemap = createMinimalSitemap([
          {
            id: 'obstacle-1',
            type: 'circle',
            position: { x: 5, y: 5 },
            radius: 1,
            category,
          },
        ])

        const valid = validate(sitemap)
        expect(valid).toBe(true)
      }
    })

    it('validates rotation within bounds', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 5, y: 5 },
          dimensions: { width: 2, height: 1 },
          rotation: 359,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('rejects negative rotation', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 5, y: 5 },
          dimensions: { width: 2, height: 1 },
          rotation: -45,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })

    it('rejects rotation over 360', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 5, y: 5 },
          dimensions: { width: 2, height: 1 },
          rotation: 361,
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(false)
    })
  })

  describe('multiple obstacles', () => {
    it('validates sitemap with multiple obstacles of different types', () => {
      const sitemap = createMinimalSitemap([
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          radius: 0.25,
          category: 'structural',
        },
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 9, y: 6 },
          dimensions: { width: 3.0, height: 1.2 },
          category: 'furniture',
        },
        {
          id: 'L-desk',
          type: 'polygon',
          position: { x: 2, y: 2 },
          vertices: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 0, y: 2 },
          ],
          category: 'equipment',
        },
      ])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('validates sitemap with empty obstacles array', () => {
      const sitemap = createMinimalSitemap([])

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })

    it('validates sitemap without obstacles property', () => {
      const sitemap = {
        dimensions: { width: 18, height: 12, unit: 'meters' },
        walls: [
          { id: 'wall-1', start: { x: 0, y: 0 }, end: { x: 18, y: 0 } },
        ],
        cameras: [
          {
            id: 'camera1',
            name: 'Test Camera',
            position: { x: 9, y: 6 },
            azimuth: 0,
            height: 2.5,
            fieldOfView: 80,
          },
        ],
        // No obstacles property
      }

      const valid = validate(sitemap)
      expect(valid).toBe(true)
    })
  })
})

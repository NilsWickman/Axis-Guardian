/**
 * Ground Truth Data Loader
 *
 * Loads, validates, and provides indexed access to ground truth annotations.
 */

import { readFileSync, existsSync } from 'fs'
import { gunzipSync } from 'zlib'
import type {
  GroundTruthDataset,
  GroundTruthAnnotation,
  GroundTruthPerson,
  IndexedGroundTruth,
} from '../types/ground-truth.js'

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation result for ground truth data
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate ground truth dataset structure and values
 */
export function validateGroundTruth(
  data: GroundTruthDataset,
  sitemapBounds?: { width: number; height: number }
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!data.version) {
    errors.push('Missing version field')
  }
  if (!data.annotations || !Array.isArray(data.annotations)) {
    errors.push('Missing or invalid annotations array')
  }
  if (!data.persons || !Array.isArray(data.persons)) {
    errors.push('Missing or invalid persons array')
  }
  if (!data.cameras || !Array.isArray(data.cameras)) {
    errors.push('Missing or invalid cameras array')
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  // Validate annotations
  const personIds = new Set(data.persons.map((p) => p.id))
  const cameraIds = new Set(data.cameras)

  for (let i = 0; i < data.annotations.length; i++) {
    const ann = data.annotations[i]

    if (!ann.id) {
      errors.push(`Annotation ${i}: missing id`)
    }

    if (!ann.cameraId) {
      errors.push(`Annotation ${i}: missing cameraId`)
    } else if (!cameraIds.has(ann.cameraId)) {
      warnings.push(`Annotation ${i}: cameraId '${ann.cameraId}' not in cameras list`)
    }

    if (typeof ann.timestamp !== 'number' || ann.timestamp < 0) {
      errors.push(`Annotation ${i}: invalid timestamp`)
    } else if (data.videoDuration && ann.timestamp > data.videoDuration) {
      warnings.push(`Annotation ${i}: timestamp ${ann.timestamp} exceeds video duration ${data.videoDuration}`)
    }

    if (typeof ann.personId !== 'number') {
      errors.push(`Annotation ${i}: missing personId`)
    } else if (!personIds.has(ann.personId)) {
      warnings.push(`Annotation ${i}: personId ${ann.personId} not in persons list`)
    }

    // Validate bbox (normalized 0-1)
    if (!ann.bbox || !Array.isArray(ann.bbox) || ann.bbox.length !== 4) {
      errors.push(`Annotation ${i}: invalid bbox format`)
    } else {
      const [x, y, w, h] = ann.bbox
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        warnings.push(`Annotation ${i}: bbox position outside 0-1 range`)
      }
      if (w <= 0 || w > 1 || h <= 0 || h > 1) {
        warnings.push(`Annotation ${i}: bbox size outside valid range`)
      }
    }

    // Validate world position if present
    if (ann.worldPosition) {
      const { x, y } = ann.worldPosition
      if (typeof x !== 'number' || typeof y !== 'number') {
        errors.push(`Annotation ${i}: invalid worldPosition format`)
      } else if (sitemapBounds) {
        if (x < 0 || x > sitemapBounds.width || y < 0 || y > sitemapBounds.height) {
          warnings.push(
            `Annotation ${i}: worldPosition (${x.toFixed(1)}, ${y.toFixed(1)}) ` +
              `outside sitemap bounds (${sitemapBounds.width}x${sitemapBounds.height})`
          )
        }
      }
    }
  }

  // Validate persons
  for (let i = 0; i < data.persons.length; i++) {
    const person = data.persons[i]
    if (typeof person.id !== 'number') {
      errors.push(`Person ${i}: missing id`)
    }
    if (!person.label) {
      warnings.push(`Person ${i}: missing label`)
    }
    if (!person.color) {
      warnings.push(`Person ${i}: missing color`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// Loading
// ============================================================================

/**
 * Load ground truth from JSON file
 * Supports both .json and .json.gz files
 */
export function loadGroundTruth(filePath: string): GroundTruthDataset {
  if (!existsSync(filePath)) {
    throw new Error(`Ground truth file not found: ${filePath}`)
  }

  let content: string

  if (filePath.endsWith('.gz')) {
    const compressed = readFileSync(filePath)
    const decompressed = gunzipSync(compressed)
    content = decompressed.toString('utf-8')
  } else {
    content = readFileSync(filePath, 'utf-8')
  }

  try {
    const data = JSON.parse(content) as GroundTruthDataset
    return data
  } catch (e) {
    throw new Error(`Failed to parse ground truth JSON: ${e}`)
  }
}

/**
 * Load and validate ground truth file
 */
export function loadAndValidateGroundTruth(
  filePath: string,
  sitemapBounds?: { width: number; height: number }
): { data: GroundTruthDataset; validation: ValidationResult } {
  const data = loadGroundTruth(filePath)
  const validation = validateGroundTruth(data, sitemapBounds)
  return { data, validation }
}

// ============================================================================
// Indexing
// ============================================================================

/**
 * Build indexed lookup structures for efficient evaluation
 */
export function indexGroundTruth(data: GroundTruthDataset): IndexedGroundTruth {
  const byTimestamp = new Map<number, GroundTruthAnnotation[]>()
  const byCamera = new Map<string, GroundTruthAnnotation[]>()
  const byPerson = new Map<number, GroundTruthAnnotation[]>()
  const persons = new Map<number, GroundTruthPerson>()

  // Index persons
  for (const person of data.persons) {
    persons.set(person.id, person)
  }

  // Index annotations
  for (const ann of data.annotations) {
    // By timestamp
    if (!byTimestamp.has(ann.timestamp)) {
      byTimestamp.set(ann.timestamp, [])
    }
    byTimestamp.get(ann.timestamp)!.push(ann)

    // By camera
    if (!byCamera.has(ann.cameraId)) {
      byCamera.set(ann.cameraId, [])
    }
    byCamera.get(ann.cameraId)!.push(ann)

    // By person
    if (!byPerson.has(ann.personId)) {
      byPerson.set(ann.personId, [])
    }
    byPerson.get(ann.personId)!.push(ann)
  }

  // Get sorted keyframe timestamps
  const keyframes = Array.from(byTimestamp.keys()).sort((a, b) => a - b)

  return {
    annotations: data.annotations,
    byTimestamp,
    byCamera,
    byPerson,
    persons,
    keyframes,
    meta: {
      version: data.version,
      videoDuration: data.videoDuration,
      keyframeInterval: data.keyframeIntervalSeconds,
      cameraIds: data.cameras,
      personCount: data.persons.length,
      annotationCount: data.annotations.length,
    },
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get annotations for a specific keyframe timestamp
 */
export function getAnnotationsAtKeyframe(
  index: IndexedGroundTruth,
  timestampSec: number
): GroundTruthAnnotation[] {
  return index.byTimestamp.get(timestampSec) ?? []
}

/**
 * Get annotations for a camera at a specific time
 */
export function getCameraAnnotationsAtTime(
  index: IndexedGroundTruth,
  cameraId: string,
  timestampSec: number
): GroundTruthAnnotation[] {
  const atTime = index.byTimestamp.get(timestampSec) ?? []
  return atTime.filter((ann) => ann.cameraId === cameraId)
}

/**
 * Get all annotations for a specific camera
 */
export function getCameraAnnotations(
  index: IndexedGroundTruth,
  cameraId: string
): GroundTruthAnnotation[] {
  return index.byCamera.get(cameraId) ?? []
}

/**
 * Get all annotations for a specific person
 */
export function getPersonAnnotations(
  index: IndexedGroundTruth,
  personId: number
): GroundTruthAnnotation[] {
  return index.byPerson.get(personId) ?? []
}

/**
 * Get annotations with world positions only (for calibration)
 */
export function getAnnotationsWithWorldPosition(
  index: IndexedGroundTruth
): GroundTruthAnnotation[] {
  return index.annotations.filter((ann) => ann.worldPosition !== undefined)
}

/**
 * Get annotations with world positions for a specific camera
 */
export function getCameraAnnotationsWithWorldPosition(
  index: IndexedGroundTruth,
  cameraId: string
): GroundTruthAnnotation[] {
  const cameraAnns = index.byCamera.get(cameraId) ?? []
  return cameraAnns.filter((ann) => ann.worldPosition !== undefined)
}

/**
 * Get person label by ID
 */
export function getPersonLabel(index: IndexedGroundTruth, personId: number): string {
  const person = index.persons.get(personId)
  return person?.label ?? `Person ${personId}`
}

/**
 * Print summary of ground truth dataset
 */
export function printGroundTruthSummary(index: IndexedGroundTruth): void {
  console.log('\n=== Ground Truth Dataset Summary ===')
  console.log(`Version: ${index.meta.version}`)
  console.log(`Video Duration: ${index.meta.videoDuration.toFixed(1)}s`)
  console.log(`Keyframe Interval: ${index.meta.keyframeInterval}s`)
  console.log(`Cameras: ${index.meta.cameraIds.join(', ')}`)
  console.log(`Persons: ${index.meta.personCount}`)
  console.log(`Total Annotations: ${index.meta.annotationCount}`)
  console.log(`Keyframes: ${index.keyframes.length}`)

  // Per-camera breakdown
  console.log('\nAnnotations per camera:')
  for (const cameraId of index.meta.cameraIds) {
    const count = index.byCamera.get(cameraId)?.length ?? 0
    const withWorld = getCameraAnnotationsWithWorldPosition(index, cameraId).length
    console.log(`  ${cameraId}: ${count} total, ${withWorld} with world position`)
  }

  // Per-person breakdown
  console.log('\nAnnotations per person:')
  for (const [personId, person] of index.persons) {
    if (personId === 0) continue // Skip invalid marker
    const count = index.byPerson.get(personId)?.length ?? 0
    if (count > 0) {
      console.log(`  ${person.label}: ${count}`)
    }
  }
}

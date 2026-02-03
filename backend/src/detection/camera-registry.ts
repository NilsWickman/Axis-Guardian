/**
 * Camera Registry - Manages camera configurations for projection
 *
 * Supports loading cameras from:
 * - Database (SQLite via Drizzle ORM)
 * - Sitemap JSON config
 * - Manual registration
 *
 * Calibration data can be updated via:
 * - setCalibration() for runtime updates from calibration tools
 * - Loading from JSON file via loadCalibrationFromFile()
 */

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration, WorldTransform } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'
import { generateCalibrationFromSitemap, validateSitemapCamera } from '../calibration/sitemap-calibration.js'

/**
 * Feature flag: Set to true to skip polynomial world transform and use
 * direct K/R/T projection in sitemap coordinates.
 *
 * Once the new calibration tooling has been run and K/R/T matrices are
 * properly calibrated for sitemap coordinates, set this to true.
 */
export const USE_DIRECT_KRT_PROJECTION = true

/**
 * Camera Calibration Data
 *
 * IMPORTANT: Calibration needs to be derived from ground truth annotations.
 * Use the frontend annotation tool to create annotations, then run:
 *   python3 scripts/direct-image-to-sitemap.py
 *
 * Current sitemap: 32x30m
 * Camera positions from sitemap-rectangular-room.json
 */
/**
 * Direct polynomial calibration - maps normalized image coords directly to sitemap
 *
 * PLACEHOLDER: These coefficients need to be derived from new ground truth annotations
 * for the current sitemap (32x30m). Use the annotation tool to create annotations,
 * then run: python3 scripts/direct-image-to-sitemap.py
 *
 * Input: Normalized image coordinates (u, v) where:
 *   u = bbox_center_x / image_width (0-1)
 *   v = bbox_bottom / image_height (0-1)
 *
 * Output: Sitemap coordinates (x, y) in meters
 */
// TODO: Generate new coefficients from annotations for the new 32x30m sitemap
// Camera positions: camera1 (23,4), camera2 (8,3.8), camera3 (29.5,26), camera4 (16.5,15)

const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  // camera1 - position (23, 4), azimuth 340°
  // NEEDS NEW CALIBRATION from annotations for 32x30m sitemap
  camera1: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    T: [23, 4, 3],  // Camera position from sitemap
    center: [960, 540],
    scale: 1,
    // directPolynomial: TODO - derive from new annotations
  },
  // camera2 - position (8, 3.8), azimuth 52°
  // NEEDS NEW CALIBRATION from annotations for 32x30m sitemap
  camera2: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    T: [8, 3.8, 3],  // Camera position from sitemap
    center: [960, 540],
    scale: 1,
    // directPolynomial: TODO - derive from new annotations
  },
  // camera3 - position (29.5, 26), azimuth 225°
  // NEEDS NEW CALIBRATION from annotations for 32x30m sitemap
  camera3: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    T: [29.5, 26, 3],  // Camera position from sitemap
    center: [960, 540],
    scale: 1,
    // directPolynomial: TODO - derive from new annotations
  },
  // camera4 - position (16.5, 15), azimuth 29°
  // NEEDS NEW CALIBRATION from annotations for 32x30m sitemap
  camera4: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    T: [16.5, 15, 3],  // Camera position from sitemap
    center: [960, 540],
    scale: 1,
    // directPolynomial: TODO - derive from new annotations
  },
}

/**
 * Camera bias corrections for fine-tuning per-camera projection accuracy
 *
 * These offsets are applied after projection to compensate for camera-specific
 * systematic errors not captured by the shared world transform.
 *
 * Currently set to zero since the world transform was optimized using all cameras.
 * May need re-calibration if per-camera accuracy differs significantly.
 */
export const CAMERA_BIAS_CORRECTIONS: Record<string, { x: number; y: number }> = {
  camera1: { x: 0, y: 0 },
  camera2: { x: 0, y: 0 },
  camera3: { x: 0, y: 0 },
  camera4: { x: 0, y: 0 },
}

/**
 * Camera reliability weights for multi-camera position merging
 *
 * These weights are applied when merging positions from multiple cameras.
 * Higher weight = more influence on the merged position.
 *
 * Based on analysis:
 * - Camera1: 73.2% pass rate on individual projections
 * - Camera2: 62% pass rate on individual projections
 *
 * Weights are normalized so average is ~1.0
 */
export const CAMERA_RELIABILITY_WEIGHTS: Record<string, number> = {
  camera1: 1.15,  // More reliable
  camera2: 0.85,  // Less reliable
  camera3: 1.0,   // Neutral until calibrated
  camera4: 1.0,   // Neutral until calibrated
}


/**
 * Map camera emulator IDs to internal camera IDs
 * camera-HC3 -> camera1, camera-HC4 -> camera2, etc.
 */
const CAMERA_ID_MAP: Record<string, string> = {
  'camera-HC3': 'camera1',
  'camera-HC4': 'camera2',
  'camera-IP2': 'camera3',
  'camera-IP5': 'camera4',
  // Direct mappings
  'camera1': 'camera1',
  'camera2': 'camera2',
  'camera3': 'camera3',
  'camera4': 'camera4',
}

export class CameraRegistry {
  private cameras: Map<string, CameraParams> = new Map()
  /** Reverse lookup: ACAP device ID -> internal camera ID */
  private acapDeviceIdMap: Map<string, string> = new Map()

  /**
   * Add or update a camera configuration
   */
  setCamera(cameraId: string, config: CameraConfig): void {
    this.cameras.set(cameraId, {
      position: { x: config.position.x, y: config.position.y, z: config.position.z },
      azimuth: config.azimuth,
      elevation: config.elevation,
      fov: config.fov,
    })
  }

  /**
   * Register a camera with CameraParams directly
   */
  registerCamera(cameraId: string, params: CameraParams): void {
    this.cameras.set(cameraId, params)
  }

  /**
   * Get camera parameters by ID
   */
  getCamera(cameraId: string): CameraParams | undefined {
    // Try direct lookup first
    let camera = this.cameras.get(cameraId)
    if (camera) return camera

    // Try mapped ID
    const mappedId = CAMERA_ID_MAP[cameraId]
    if (mappedId) {
      camera = this.cameras.get(mappedId)
    }

    return camera
  }

  /** Runtime calibration overrides (from calibration tools or file) */
  private calibrationOverrides: Map<string, CameraCalibration> = new Map()

  /**
   * Get K/R/T calibration data for a camera
   *
   * Returns calibration override if set, otherwise falls back to hardcoded calibrations.
   * If USE_DIRECT_KRT_PROJECTION is true, returns calibration without worldTransform.
   */
  getCalibration(cameraId: string): CameraCalibration | undefined {
    const normalizedId = this.normalizeCameraId(cameraId)

    // Check for runtime override first
    const override = this.calibrationOverrides.get(normalizedId)
    if (override) {
      return USE_DIRECT_KRT_PROJECTION ? { ...override, worldTransform: undefined } : override
    }

    // Fall back to hardcoded calibrations
    const hardcoded = CAMERA_CALIBRATIONS[normalizedId]
    if (!hardcoded) return undefined

    return USE_DIRECT_KRT_PROJECTION ? { ...hardcoded, worldTransform: undefined } : hardcoded
  }

  /**
   * Check if a camera has K/R/T calibration data
   */
  hasCalibration(cameraId: string): boolean {
    const normalizedId = this.normalizeCameraId(cameraId)
    return this.calibrationOverrides.has(normalizedId) || normalizedId in CAMERA_CALIBRATIONS
  }

  /**
   * Check if a camera has polynomial calibration (most accurate)
   */
  hasPolynomialCalibration(cameraId: string): boolean {
    const calibration = this.getCalibration(cameraId)
    return !!calibration?.directPolynomial
  }

  /**
   * Get calibration status for all registered cameras
   *
   * Returns an object with:
   * - cameraStatuses: per-camera calibration method and warnings
   * - allHavePolynomial: true if all cameras have polynomial calibration
   * - warnings: list of warning messages
   */
  getCalibrationStatus(): {
    cameraStatuses: Record<string, { method: 'polynomial' | 'krt-ray' | 'krt-formula' | 'none'; hasPolynomial: boolean }>
    allHavePolynomial: boolean
    warnings: string[]
  } {
    const warnings: string[] = []
    const cameraStatuses: Record<string, { method: 'polynomial' | 'krt-ray' | 'krt-formula' | 'none'; hasPolynomial: boolean }> = {}

    for (const cameraId of this.getCameraIds()) {
      const calibration = this.getCalibration(cameraId)
      let method: 'polynomial' | 'krt-ray' | 'krt-formula' | 'none' = 'none'
      let hasPolynomial = false

      if (calibration) {
        if (calibration.directPolynomial) {
          method = 'polynomial'
          hasPolynomial = true
        } else if (calibration.useRayProjection) {
          method = 'krt-ray'
          warnings.push(`[Calibration] ${cameraId}: Using ray-based projection (less accurate than polynomial)`)
        } else {
          method = 'krt-formula'
          warnings.push(`[Calibration] ${cameraId}: Using K/R/T formula projection (may be inaccurate)`)
        }
      } else {
        warnings.push(`[Calibration] ${cameraId}: No calibration data found!`)
      }

      cameraStatuses[cameraId] = { method, hasPolynomial }
    }

    const allHavePolynomial = Object.values(cameraStatuses).every(s => s.hasPolynomial)

    return { cameraStatuses, allHavePolynomial, warnings }
  }

  /**
   * Set calibration data for a camera at runtime
   *
   * Used by calibration tools to apply optimized parameters without code changes.
   */
  setCalibration(cameraId: string, calibration: CameraCalibration): void {
    const normalizedId = this.normalizeCameraId(cameraId)
    this.calibrationOverrides.set(normalizedId, calibration)
  }

  /**
   * Load calibration data from a JSON file (output from calibrate-full)
   *
   * @param filepath - Path to calibration JSON file
   */
  async loadCalibrationFromFile(filepath: string): Promise<void> {
    const fs = await import('fs/promises')
    const content = await fs.readFile(filepath, 'utf-8')
    const data = JSON.parse(content)

    // Handle polynomial calibration format (from fit-polynomial CLI)
    // Format: { cameras: { camera1: { directPolynomial: {...} }, ... } }
    if (data.cameras && !Array.isArray(data.cameras) && typeof data.cameras === 'object') {
      let count = 0
      for (const [cameraId, camData] of Object.entries(data.cameras)) {
        const cam = camData as { directPolynomial?: { degree: number; coeffsX: number[]; coeffsY: number[] } }
        if (cam.directPolynomial) {
          // Validate degree is 3, 4, or 5
          const degree = cam.directPolynomial.degree
          if (degree !== 3 && degree !== 4 && degree !== 5) {
            console.warn(`[CameraRegistry] Invalid polynomial degree ${degree} for ${cameraId}, skipping`)
            continue
          }
          // Get existing calibration or create minimal one
          let existing = this.getCalibration(cameraId)
          if (!existing) {
            // Create placeholder K/R/T (polynomial will be used instead)
            existing = {
              K: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
              R: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
              T: [0, 0, 0],
              center: [960, 540],
              scale: 1,
            }
          }
          // Add direct polynomial with validated degree type
          const calibration: CameraCalibration = {
            ...existing,
            directPolynomial: {
              degree: degree as 3 | 4 | 5,
              coeffsX: cam.directPolynomial.coeffsX,
              coeffsY: cam.directPolynomial.coeffsY,
            },
          }
          this.setCalibration(cameraId, calibration)
          count++
          console.log(`[CameraRegistry] Loaded polynomial calibration for ${cameraId} (degree ${cam.directPolynomial.degree})`)
        }
      }
      if (count > 0) {
        console.log(`📷 Loaded polynomial calibration for ${count} camera(s) from ${filepath}`)
      }
      return
    }

    // Handle legacy array format (from calibrate CLI)
    if (data.cameras && Array.isArray(data.cameras)) {
      for (const cam of data.cameras) {
        // Convert distortion array [k1, k2, p1, p2, k3] to DistortionCoeffs object
        let distortion = undefined
        if (Array.isArray(cam.distortion) && cam.distortion.length >= 5) {
          distortion = {
            k1: cam.distortion[0],
            k2: cam.distortion[1],
            p1: cam.distortion[2],
            p2: cam.distortion[3],
            k3: cam.distortion[4],
          }
        } else if (cam.distortion && typeof cam.distortion === 'object') {
          distortion = cam.distortion
        }

        // Convert worldTransform.polynomial if present
        let worldTransform: WorldTransform | undefined = undefined
        if (cam.worldTransform?.polynomial) {
          // Polynomial overrides rotation/translation, but we need placeholder values
          worldTransform = {
            rotation: cam.worldTransform.rotation ?? [[1, 0], [0, 1]],
            translation: cam.worldTransform.translation ?? [0, 0],
            polynomial: cam.worldTransform.polynomial,
          }
        }

        const calibration: CameraCalibration = {
          K: cam.K,
          R: cam.R,
          T: cam.T,
          center: cam.center,
          scale: cam.scale ?? 1,
          distortion,
          worldTransform,
        }
        this.setCalibration(cam.cameraId, calibration)
      }
      console.log(`📷 Loaded calibration for ${data.cameras.length} camera(s) from ${filepath}`)
    }
  }

  /**
   * Clear runtime calibration overrides
   */
  clearCalibrationOverrides(): void {
    this.calibrationOverrides.clear()
  }

  /**
   * Get bias correction for a camera (from cross-camera evaluation)
   * Returns offset to add to projected coordinates
   */
  getBiasCorrection(cameraId: string): { x: number; y: number } {
    const normalizedId = this.normalizeCameraId(cameraId)
    return CAMERA_BIAS_CORRECTIONS[normalizedId] ?? { x: 0, y: 0 }
  }

  /**
   * Normalize camera ID from emulator format to internal format
   */
  normalizeCameraId(rawId: string): string {
    return CAMERA_ID_MAP[rawId] ?? rawId
  }

  /**
   * Get internal camera ID by ACAP device ID
   * Used for mapping live camera MQTT topics to internal cameras
   */
  getCameraByAcapDeviceId(acapDeviceId: string): string | null {
    return this.acapDeviceIdMap.get(acapDeviceId) ?? null
  }

  /**
   * Register an ACAP device ID mapping for a camera
   */
  setAcapDeviceId(cameraId: string, acapDeviceId: string): void {
    this.acapDeviceIdMap.set(acapDeviceId, cameraId)
  }

  /**
   * Get all camera IDs
   */
  getCameraIds(): string[] {
    return Array.from(this.cameras.keys())
  }

  /**
   * Get all cameras as array
   */
  getAllCameras(): Array<{ cameraId: string; params: CameraParams }> {
    return Array.from(this.cameras.entries()).map(([cameraId, params]) => ({
      cameraId,
      params,
    }))
  }

  /**
   * Load cameras from sitemap config array
   *
   * This also auto-generates K/R/T calibration matrices from the sitemap
   * geometry (position, azimuth, elevation, FOV, height).
   */
  loadFromSiteMapConfig(configs: SiteMapCameraConfig[]): void {
    this.cameras.clear()
    this.acapDeviceIdMap.clear()
    this.calibrationOverrides.clear()  // Clear any previous calibrations

    for (const config of configs) {
      // Store camera params for projection
      this.cameras.set(config.id, siteMapConfigToCamera(config))

      // Auto-generate K/R/T calibration from sitemap geometry
      const validation = validateSitemapCamera(config)
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => console.warn(`[CameraRegistry] ${w}`))
      }
      if (validation.errors.length > 0) {
        validation.errors.forEach(e => console.error(`[CameraRegistry] ${e}`))
      }

      if (validation.valid) {
        const calibration = generateCalibrationFromSitemap(config)
        this.calibrationOverrides.set(config.id, calibration)
        console.log(`[CameraRegistry] Generated K/R/T calibration for ${config.id} from sitemap geometry`)
      }

      // Register ACAP device ID mapping if specified
      if (config.acapDeviceId) {
        this.acapDeviceIdMap.set(config.acapDeviceId, config.id)
        console.log(`[CameraRegistry] Mapped ACAP device ${config.acapDeviceId} -> ${config.id}`)
      }
    }
  }

  /**
   * Clear all cameras
   */
  clear(): void {
    this.cameras.clear()
    this.acapDeviceIdMap.clear()
  }

  /**
   * Load cameras from database
   * Requires db module to be initialized with seeded data
   */
  async loadFromDatabase(): Promise<void> {
    // Dynamic import to avoid circular dependency and allow optional db usage
    const { getCamerasForSite, isDatabaseSeeded } = await import('../db/repositories.js')

    if (!isDatabaseSeeded()) {
      console.warn('⚠️  Database not seeded, skipping database camera load')
      return
    }

    const dbCameras = getCamerasForSite('default')
    this.cameras.clear()

    for (const [cameraId, params] of dbCameras) {
      this.cameras.set(cameraId, params)
    }

    console.log(`📷 Loaded ${this.cameras.size} camera(s) from database`)
  }
}

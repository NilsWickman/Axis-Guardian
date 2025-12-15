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

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'

/**
 * Feature flag: Set to true to skip polynomial world transform and use
 * direct K/R/T projection in sitemap coordinates.
 *
 * Once the new calibration tooling has been run and K/R/T matrices are
 * properly calibrated for sitemap coordinates, set this to true.
 */
export const USE_DIRECT_KRT_PROJECTION = false

/**
 * Per-camera world coordinate transformations from K/R/T dataset coords to sitemap coords
 *
 * These transforms were derived using quadratic least squares regression on 211 ground truth
 * annotations. Each camera has its own optimal transform because the raw K/R/T projection
 * coordinate system varies between cameras due to different rotation matrices.
 *
 * Quadratic model: result = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y
 * This captures non-linear distortions that affine transforms cannot model.
 *
 * Performance: 47.9% within 0.5m, 0.64m average error (vs 23.7% with affine)
 */
const CAMERA1_WORLD_TRANSFORM = {
  // Keep affine as fallback
  rotation: [
    [0.617269, 1.102075],
    [0.344626, -0.320704],
  ],
  translation: [-4.145655, 7.232865],
  scale: 1.0,
  // Cubic polynomial transform (Degree 3, IRLS Huber)
  // Reduced from degree 5 to minimize overfitting (CV: 56.3% vs 62.5% train-only at deg 5)
  // Model: c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y + c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2
  polynomial: {
    degree: 3 as const,
    coeffsX: [22.32593204, 4.63729893, -4.44547204, 0.10955637, 0.38193721, -0.48243390,
              -0.00323602, -0.00863815, -0.00458418, 0.01411668],
    coeffsY: [33.73112634, -0.82079720, -5.29428069, -0.03439330, 0.30184404, 0.35386261,
              -0.00095459, -0.00613755, 0.00896840, -0.01668283],
  },
}

const CAMERA2_WORLD_TRANSFORM = {
  // Keep affine as fallback
  rotation: [
    [0.801481, 0.932076],
    [0.960596, -0.669338],
  ],
  translation: [-1.599807, 11.586605],
  scale: 1.0,
  // Linear (affine) polynomial transform (Degree 1, IRLS Huber)
  // Reduced from degree 5 to minimize overfitting (CV: 38.8% vs severe overfit at deg 5)
  // Camera2's K/R/T matrices are placeholder data, so higher-degree polynomials don't help
  // Model: c0 + c1*x + c2*y
  polynomial: {
    degree: 1 as const,
    coeffsX: [-1.47934501, 0.80544563, 0.93488186],
    coeffsY: [11.47235862, 0.96358997, -0.66733292],
  },
}

/**
 * K/R/T Calibration data from the Auditorium dataset (cam_param.mat)
 *
 * These matrices were extracted from the MATLAB calibration file and provide
 * accurate ground-plane projection using the formula from the dataset README:
 *
 *   A = K * R
 *   A = [A(:, 1:2), [cx - x; cy - y; -1]]
 *   KRT = K * R * T
 *   p = A \ KRT  (solve linear system)
 *
 * The worldTransform converts from dataset coordinates to sitemap coordinates.
 */
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  // HC3 (camera1) - mounted at position (16.22, 11.7) in sitemap
  camera1: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [0.26415998, 0.96365108, -0.0399512],
      [0.01284627, -0.04493433, -0.99890734],
      [-0.96439332, 0.26335812, -0.02424917],
    ],
    T: [8.31972445, 13.44595571, 1.59303293],
    center: [960, 540],
    scale: 1,
    worldTransform: CAMERA1_WORLD_TRANSFORM,
  },
  // HC4 (camera2) - mounted at position (0.9, 11.5) in sitemap
  // Note: Focal length optimized from 2350 to 2300 via calibration sweep
  // (77.0% pass rate vs 75.7% baseline, cross-validated with no overfitting)
  camera2: {
    K: [
      [2300, 0, 0],
      [0, 2300, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, -0.08715574, -0.9961947],
      [0, 0.9961947, -0.08715574],
    ],
    T: [0, 0, 1.5],
    center: [960, 540],
    scale: 1,
    worldTransform: CAMERA2_WORLD_TRANSFORM,
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

    if (data.cameras && Array.isArray(data.cameras)) {
      for (const cam of data.cameras) {
        const calibration: CameraCalibration = {
          K: cam.K,
          R: cam.R,
          T: cam.T,
          center: cam.center,
          scale: cam.scale ?? 1,
          distortion: cam.distortion,
          // No worldTransform - new calibrations are in sitemap coords
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
   */
  loadFromSiteMapConfig(configs: SiteMapCameraConfig[]): void {
    this.cameras.clear()
    this.acapDeviceIdMap.clear()
    for (const config of configs) {
      this.cameras.set(config.id, siteMapConfigToCamera(config))
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

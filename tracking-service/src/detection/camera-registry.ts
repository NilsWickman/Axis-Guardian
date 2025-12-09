/**
 * Camera Registry - Manages camera configurations for projection
 *
 * Supports loading cameras from:
 * - Database (SQLite via Drizzle ORM)
 * - Sitemap JSON config
 * - Manual registration
 */

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'

/**
 * World coordinate transformation from K/R/T dataset coords to sitemap coords
 *
 * The transformation involves two steps:
 * 1. K/R/T -> scene_metadata: similarity transform (rotation + scale)
 * 2. scene_metadata -> sitemap: Y reflection (y' = 12 - y)
 *
 * Dataset coordinate system (from cam_param.mat T vectors):
 *   - HC4 at origin (0, 0)
 *   - HC3 at (8.32, 13.45)
 *
 * scene_metadata coordinate system:
 *   - HC4 at (0.9, 0.5)
 *   - HC3 at (16.22, 0.3)
 *
 * Sitemap coordinate system:
 *   - HC4 at (0.9, 11.5)
 *   - HC3 at (16.22, 11.7)
 *
 * Combined transform (includes Y reflection):
 *   x_sitemap = 0.499053*x + 0.830586*y + 0.9
 *   y_sitemap = 0.830586*x - 0.499053*y + 11.5
 */
const WORLD_TRANSFORM = {
  // This is NOT a standard rotation matrix due to the Y reflection
  // Matrix: [[a, -b], [-b, -a]] where a=0.499053, b=-0.830586
  rotation: [
    [0.499053, 0.830586],
    [0.830586, -0.499053],
  ],
  translation: [0.9, 11.5],
  scale: 1.0,
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
    worldTransform: WORLD_TRANSFORM,
  },
  // HC4 (camera2) - mounted at position (0.9, 11.5) in sitemap
  camera2: {
    K: [
      [2350, 0, 0],
      [0, 2350, 0],
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
    worldTransform: WORLD_TRANSFORM,
  },
}

/**
 * Camera bias corrections from cross-camera correlation evaluation (Dev2)
 *
 * These offsets compensate for systematic projection errors identified through
 * ground truth analysis. Applied after projection to align positions across cameras.
 *
 * Measured biases:
 * - camera1 (HC3): X: -0.083m, Y: -0.050m (minimal, near-zero correction)
 * - camera2 (HC4): X: +0.438m, Y: -0.125m (significant X bias)
 *
 * Reference: docs/CORRELATION_EVALUATION_REPORT.md
 */
export const CAMERA_BIAS_CORRECTIONS: Record<string, { x: number; y: number }> = {
  camera1: { x: +0.083, y: +0.050 },   // Compensate for -0.083/-0.050 bias
  camera2: { x: -0.438, y: +0.125 },   // Compensate for +0.438/-0.125 bias
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

  /**
   * Get K/R/T calibration data for a camera
   */
  getCalibration(cameraId: string): CameraCalibration | undefined {
    const normalizedId = this.normalizeCameraId(cameraId)
    return CAMERA_CALIBRATIONS[normalizedId]
  }

  /**
   * Check if a camera has K/R/T calibration data
   */
  hasCalibration(cameraId: string): boolean {
    const normalizedId = this.normalizeCameraId(cameraId)
    return normalizedId in CAMERA_CALIBRATIONS
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

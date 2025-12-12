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
  // Quintic polynomial transform (Degree 5, IRLS Huber, 75.7% accuracy, 0.430m avg error)
  // Model: c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y + c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2
  //        + c10*x^4 + c11*y^4 + c12*x^3*y + c13*x*y^3 + c14*x^2*y^2
  //        + c15*x^5 + c16*y^5 + c17*x^4*y + c18*x*y^4 + c19*x^3*y^2 + c20*x^2*y^3
  polynomial: {
    degree: 5 as const,
    coeffsX: [-1.20243549, -28.00488036, -0.36408432, -4.71330850, 0.28368388, 5.81942539,
              -0.91267100, -0.02624124, 0.88787438, -0.33492363,
              -0.00852128, 0.00119572, 0.10935611, 0.00223355, -0.05785497,
              0.00010409, -0.00002171, 0.00051016, 0.00018249, -0.00321650, 0.00128864],
    coeffsY: [2.65705442, 3.81103014, 5.74501228, -8.68036206, -0.58467140, -1.41401991,
              0.67455166, -0.02118521, 1.30047040, 0.18874523,
              0.12810622, 0.00378255, -0.10317153, -0.00898779, -0.06162696,
              -0.00005059, -0.00010018, -0.00810052, 0.00012031, 0.00378997, 0.00093719],
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
  // Quintic polynomial transform (Degree 5, IRLS Huber, 75.7% accuracy, 0.430m avg error)
  // Model: c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y + c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2
  //        + c10*x^4 + c11*y^4 + c12*x^3*y + c13*x*y^3 + c14*x^2*y^2
  //        + c15*x^5 + c16*y^5 + c17*x^4*y + c18*x*y^4 + c19*x^3*y^2 + c20*x^2*y^3
  polynomial: {
    degree: 5 as const,
    coeffsX: [-6.46764509, 8.27721697, 2.86585540, 1.65488188, -0.07816160, -4.58076200,
              1.80007308, -0.04032460, -1.00892032, 0.92070060,
              0.20256077, 0.00457054, -0.39938978, -0.07079538, 0.13548954,
              0.01230032, -0.00013329, -0.01942319, 0.00183923, 0.01931707, -0.00510512],
    coeffsY: [22.54797299, -8.20754098, -4.47828721, -2.61250573, 0.34391899, 4.86664091,
              -1.52790720, 0.01482421, 1.35442868, -0.94624435,
              -0.17986191, -0.00324616, 0.34420878, 0.07458430, -0.17450885,
              -0.00782268, 0.00010886, 0.01730067, -0.00203099, -0.01745626, 0.00655016],
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

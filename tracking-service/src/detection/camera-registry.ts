/**
 * Camera Registry - Manages camera configurations for projection
 */

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'

/**
 * K/R/T Calibration data storage
 *
 * NOTE: K/R/T calibration is now disabled by default to use sitemap JSON config.
 * The hardcoded calibrations below are from the Auditorium dataset (cam_param.mat)
 * and are kept for reference only. They do not match the current sitemap config.
 *
 * To use these calibrations, uncomment the entries below.
 */
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  // All hardcoded calibrations disabled - using sitemap JSON config instead
  // which uses the ground-plane projection with elevation/azimuth parameters.
  //
  // 'camera1': {  // HC3 - from cam_param.mat (ground-truth calibration)
  //   K: [
  //     [1480, 0, 960],
  //     [0, 1480, 540],
  //     [0, 0, 1],
  //   ],
  //   R: [
  //     [0.26415998, 0.96365108, -0.0399512],
  //     [0.01284627, -0.04493433, -0.99890734],
  //     [-0.96439332, 0.26335812, -0.02424917],
  //   ],
  //   T: [8.319724452629636, 13.445955713668864, 1.5930329257377853],
  //   center: [960, 540],
  //   scale: 1,
  // },
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
   * Normalize camera ID from emulator format to internal format
   */
  normalizeCameraId(rawId: string): string {
    return CAMERA_ID_MAP[rawId] ?? rawId
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
    for (const config of configs) {
      this.cameras.set(config.id, siteMapConfigToCamera(config))
    }
  }

  /**
   * Clear all cameras
   */
  clear(): void {
    this.cameras.clear()
  }
}

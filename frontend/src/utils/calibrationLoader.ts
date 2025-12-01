/**
 * Camera calibration loader for Auditorium dataset
 *
 * Parses scene_metadata.xml to extract camera positions and orientations
 */

import type { CameraCalibration } from '../types/calibration'
export type { CameraCalibration }

// Camera ID mapping (XML view IDs to frontend camera IDs)
const VIEW_ID_MAP: Record<string, string> = {
  'view-HC3': 'camera1',
  'view-HC4': 'camera2',
  'view-IP2': 'camera3',
  'view-IP5': 'camera4',
}

/**
 * Load camera calibration from Auditorium scene_metadata.xml
 */
export async function loadAuditoriumCalibration(): Promise<CameraCalibration[]> {
  try {
    console.log('[CalibrationLoader] Loading Auditorium calibration from XML...')

    // Fetch XML file
    const response = await fetch('/shared/cameras/Auditorium/scene_metadata.xml')
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`)
    }

    const xmlText = await response.text()

    // Parse XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      throw new Error(`XML parsing error: ${parseError.textContent}`)
    }

    // Extract metadata
    const metadata = xmlDoc.querySelector('Metadata')
    if (!metadata) {
      throw new Error('No Metadata element found in XML')
    }

    const dataset = metadata.getAttribute('dataset') || 'unknown'
    const scene = metadata.getAttribute('scene') || 'unknown'

    console.log('[CalibrationLoader] Parsing scene:', dataset, scene)

    // Parse camera views
    const cameras: CameraCalibration[] = []

    // Iterate through all view elements (view-HC3, view-HC4, etc.)
    for (const viewId of Object.keys(VIEW_ID_MAP)) {
      const viewElement = xmlDoc.querySelector(viewId)
      if (!viewElement) {
        console.warn(`[CalibrationLoader] View ${viewId} not found in XML, skipping`)
        continue
      }

      // Extract sensor position
      const positionElement = viewElement.querySelector('SensorPosition > CartesianMetricPoint')
      if (!positionElement) {
        console.warn(`[CalibrationLoader] No position data for ${viewId}, skipping`)
        continue
      }

      const xElement = positionElement.querySelector('x')
      const yElement = positionElement.querySelector('y')
      const zElement = positionElement.querySelector('z')

      if (!xElement || !yElement || !zElement) {
        console.warn(`[CalibrationLoader] Incomplete position data for ${viewId}, skipping`)
        continue
      }

      const x = parseFloat(xElement.textContent || '0')
      const y = parseFloat(yElement.textContent || '0')
      const z = parseFloat(zElement.textContent || '0')

      // Extract sensor orientation
      const orientationElement = viewElement.querySelector('SensorOrientation')
      if (!orientationElement) {
        console.warn(`[CalibrationLoader] No orientation data for ${viewId}, skipping`)
        continue
      }

      const azimuthElement = orientationElement.querySelector('Azimuth')
      const elevationElement = orientationElement.querySelector('Elevation')

      if (!azimuthElement || !elevationElement) {
        console.warn(`[CalibrationLoader] Incomplete orientation data for ${viewId}, skipping`)
        continue
      }

      const azimuth = parseFloat(azimuthElement.textContent || '0')
      const elevation = parseFloat(elevationElement.textContent || '0')

      // Create calibration entry
      const calibration: CameraCalibration = {
        cameraId: VIEW_ID_MAP[viewId],
        viewId,
        position: { x, y, z },
        azimuth,
        elevation,
      }

      cameras.push(calibration)

      console.log(`[CalibrationLoader] Loaded ${viewId} -> ${calibration.cameraId}:`, {
        position: `(${x.toFixed(2)}m, ${y.toFixed(2)}m, ${z.toFixed(2)}m)`,
        azimuth: `${azimuth}°`,
        elevation: `${elevation}°`
      })
    }

    if (cameras.length === 0) {
      throw new Error('No cameras loaded from XML')
    }

    console.log(`[CalibrationLoader] Successfully loaded ${cameras.length} cameras`)

    return cameras
  } catch (error) {
    console.error('[CalibrationLoader] Error loading calibration:', error)
    throw error
  }
}

/**
 * Helper function to check if calibration data is available
 */
export async function isCalibrationAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/shared/cameras/Auditorium/scene_metadata.xml', {
      method: 'HEAD'
    })
    return response.ok
  } catch {
    return false
  }
}

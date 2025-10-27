import { ref, computed } from 'vue'
import type { CameraPlacement } from '../stores/siteMaps'
import {
  extractValue,
  createMeterUnit,
  createDegreeUnit,
  pixelsToMeters,
  metersToPixels
} from '../utils/siteMapConversion'

export interface CameraConfig {
  x: number // meters
  y: number // meters
  rotation: number // degrees
  angle: number // degrees
  height: number // meters
  fov: number // degrees
  viewDistance: number // meters
  autoCalculateDistance: boolean
  color: string
  notes: string
}

const DEFAULT_CONFIG: CameraConfig = {
  x: 4,
  y: 3,
  rotation: 0,
  angle: 35,
  height: 2.4,
  fov: 90,
  viewDistance: 20, // meters
  autoCalculateDistance: true,
  color: 'blue-500',
  notes: ''
}

export function useCameraPlacement() {
  const selectedCameraId = ref<string>('')
  const cameraConfig = ref<CameraConfig>({ ...DEFAULT_CONFIG })
  const isUpdating = ref(false)
  const selectedPlacedCamera = ref<CameraPlacement | null>(null)

  // Calculate viewing distance based on height and angle (in meters)
  const calculatedDistance = computed(() => {
    const height = cameraConfig.value.height
    const angle = cameraConfig.value.angle

    if (height <= 0) return 20
    if (angle <= 0) return 100
    if (angle >= 90) return 5

    const angleRad = angle * (Math.PI / 180)
    const distanceMeters = height / Math.tan(angleRad)

    return Math.max(5, Math.min(200, distanceMeters))
  })

  const effectiveViewDistance = computed(() => {
    if (cameraConfig.value.autoCalculateDistance) {
      return calculatedDistance.value
    }
    return cameraConfig.value.viewDistance
  })

  const resetConfig = () => {
    cameraConfig.value = { ...DEFAULT_CONFIG }
    selectedCameraId.value = ''
    isUpdating.value = false
    selectedPlacedCamera.value = null
  }

  const loadPlacedCamera = (camera: CameraPlacement) => {
    selectedCameraId.value = camera.cameraId
    selectedPlacedCamera.value = camera
    isUpdating.value = true

    // Extract values from unit objects
    cameraConfig.value = {
      x: extractValue(camera.position.x),
      y: extractValue(camera.position.y),
      rotation: extractValue(camera.rotation),
      angle: extractValue(camera.angle),
      height: extractValue(camera.height),
      fov: extractValue(camera.fov),
      viewDistance: extractValue(camera.viewDistance),
      autoCalculateDistance: camera.autoCalculateDistance,
      color: camera.color,
      notes: camera.notes || ''
    }
  }

  const createPlacement = (cameraId?: string): CameraPlacement => {
    return {
      cameraId: cameraId || selectedCameraId.value,
      position: {
        x: createMeterUnit(cameraConfig.value.x),
        y: createMeterUnit(cameraConfig.value.y)
      },
      rotation: createDegreeUnit(cameraConfig.value.rotation),
      angle: createDegreeUnit(cameraConfig.value.angle),
      height: createMeterUnit(cameraConfig.value.height),
      fov: createDegreeUnit(cameraConfig.value.fov),
      viewDistance: createMeterUnit(effectiveViewDistance.value),
      autoCalculateDistance: cameraConfig.value.autoCalculateDistance,
      color: cameraConfig.value.color,
      notes: cameraConfig.value.notes
    }
  }

  const updatePosition = (x: number, y: number) => {
    cameraConfig.value.x = x
    cameraConfig.value.y = y
  }

  const validateConfig = () => {
    const errors: Record<string, string> = {}

    if (cameraConfig.value.rotation < 0 || cameraConfig.value.rotation > 360) {
      errors.rotation = 'Rotation must be between 0-360°'
    }

    if (cameraConfig.value.angle < 0 || cameraConfig.value.angle > 90) {
      errors.angle = 'Angle must be between 0-90°'
    }

    if (cameraConfig.value.height < 0 || cameraConfig.value.height > 50) {
      errors.height = 'Height must be between 0-50m'
    }

    if (cameraConfig.value.fov < 30 || cameraConfig.value.fov > 180) {
      errors.fov = 'FOV must be between 30-180°'
    }

    if (!cameraConfig.value.autoCalculateDistance) {
      if (cameraConfig.value.viewDistance < 5 || cameraConfig.value.viewDistance > 200) {
        errors.viewDistance = 'View distance must be between 5-200m'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  return {
    selectedCameraId,
    cameraConfig,
    isUpdating,
    selectedPlacedCamera,
    calculatedDistance,
    effectiveViewDistance,
    resetConfig,
    loadPlacedCamera,
    createPlacement,
    updatePosition,
    validateConfig
  }
}

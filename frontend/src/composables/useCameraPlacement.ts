import { ref, computed } from 'vue'
import type { CameraPlacement } from '../stores/siteMaps'

export interface CameraConfig {
  x: number
  y: number
  rotation: number
  angle: number
  height: number
  fov: number
  viewDistance: number
  autoCalculateDistance: boolean
  color: string
  notes: string
}

const DEFAULT_CONFIG: CameraConfig = {
  x: 400,
  y: 300,
  rotation: 0,
  angle: 45,
  height: 3.0,
  fov: 90,
  viewDistance: 200,
  autoCalculateDistance: true,
  color: '#4ecca3',
  notes: ''
}

export function useCameraPlacement(pixelsPerMeter: number = 50) {
  const selectedCameraId = ref<string>('')
  const cameraConfig = ref<CameraConfig>({ ...DEFAULT_CONFIG })
  const isUpdating = ref(false)
  const selectedPlacedCamera = ref<CameraPlacement | null>(null)

  // Calculate viewing distance based on height and angle
  const calculatedDistance = computed(() => {
    const height = cameraConfig.value.height
    const angle = cameraConfig.value.angle

    if (height <= 0) return 200
    if (angle <= 0) return 500
    if (angle >= 90) return 50

    const angleRad = angle * (Math.PI / 180)
    const distanceMeters = height / Math.tan(angleRad)
    const distancePixels = distanceMeters * pixelsPerMeter

    return Math.max(50, Math.min(500, distancePixels))
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

    cameraConfig.value = {
      x: camera.x,
      y: camera.y,
      rotation: camera.rotation,
      angle: camera.angle,
      height: camera.height,
      fov: camera.fov,
      viewDistance: camera.viewDistance,
      autoCalculateDistance: camera.autoCalculateDistance,
      color: camera.color,
      notes: camera.notes || ''
    }
  }

  const createPlacement = (cameraId?: string): CameraPlacement => {
    return {
      cameraId: cameraId || selectedCameraId.value,
      x: cameraConfig.value.x,
      y: cameraConfig.value.y,
      rotation: cameraConfig.value.rotation,
      angle: cameraConfig.value.angle,
      height: cameraConfig.value.height,
      fov: cameraConfig.value.fov,
      viewDistance: effectiveViewDistance.value,
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
      if (cameraConfig.value.viewDistance < 50 || cameraConfig.value.viewDistance > 500) {
        errors.viewDistance = 'View distance must be between 50-500px'
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

import { ref } from 'vue'
import type { CameraPlacement } from '../stores/siteMaps'

export function useCameraSelection() {
  const selectedCameraIds = ref<Set<string>>(new Set())
  const copiedCameraConfig = ref<Partial<CameraPlacement> | null>(null)

  const toggleSelection = (cameraId: string, multiSelect: boolean = false) => {
    if (!multiSelect) {
      // Single select - clear others
      selectedCameraIds.value.clear()
      selectedCameraIds.value.add(cameraId)
    } else {
      // Multi-select with Shift/Ctrl
      if (selectedCameraIds.value.has(cameraId)) {
        selectedCameraIds.value.delete(cameraId)
      } else {
        selectedCameraIds.value.add(cameraId)
      }
    }
  }

  const selectCamera = (cameraId: string) => {
    selectedCameraIds.value.clear()
    selectedCameraIds.value.add(cameraId)
  }

  const deselectCamera = (cameraId: string) => {
    selectedCameraIds.value.delete(cameraId)
  }

  const clearSelection = () => {
    selectedCameraIds.value.clear()
  }

  const selectAll = (cameraIds: string[]) => {
    selectedCameraIds.value = new Set(cameraIds)
  }

  const isSelected = (cameraId: string): boolean => {
    return selectedCameraIds.value.has(cameraId)
  }

  const hasSelection = (): boolean => {
    return selectedCameraIds.value.size > 0
  }

  const getSelectedCount = (): number => {
    return selectedCameraIds.value.size
  }

  const getSelectedIds = (): string[] => {
    return Array.from(selectedCameraIds.value)
  }

  const copyCameraConfig = (camera: CameraPlacement) => {
    // Copy all properties except cameraId and position
    copiedCameraConfig.value = {
      rotation: camera.rotation,
      angle: camera.angle,
      height: camera.height,
      fov: camera.fov,
      viewDistance: camera.viewDistance,
      autoCalculateDistance: camera.autoCalculateDistance,
      color: camera.color,
      notes: camera.notes
    }
  }

  const pasteCameraConfig = (targetCamera: CameraPlacement): CameraPlacement => {
    if (!copiedCameraConfig.value) return targetCamera

    return {
      ...targetCamera,
      ...copiedCameraConfig.value
    }
  }

  const hasCopiedConfig = (): boolean => {
    return copiedCameraConfig.value !== null
  }

  return {
    selectedCameraIds,
    copiedCameraConfig,
    toggleSelection,
    selectCamera,
    deselectCamera,
    clearSelection,
    selectAll,
    isSelected,
    hasSelection,
    getSelectedCount,
    getSelectedIds,
    copyCameraConfig,
    pasteCameraConfig,
    hasCopiedConfig
  }
}

/**
 * Site Map Generation Store
 * Manages automatic site map generation from camera depth estimation
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCameraStore } from './cameras'
import {
  siteMapClient,
  type GenerationRequest,
  type GenerationResponse,
  type GeneratedSiteMap,
  type CameraData,
} from '../api/siteMapClient'

export const useSiteMapGenerationStore = defineStore('siteMapGeneration', () => {
  // State
  const isGenerating = ref(false)
  const generationId = ref<string | null>(null)
  const progress = ref<GenerationResponse | null>(null)
  const error = ref<string | null>(null)
  const lastGeneratedMap = ref<GeneratedSiteMap | null>(null)
  const serviceAvailable = ref<boolean | null>(null)

  // Getters
  const currentStatus = computed(() => progress.value?.status || 'idle')
  const progressPercentage = computed(() => {
    if (!progress.value) return 0
    const { cameras_processed, total_cameras } = progress.value as any
    if (total_cameras === 0) return 0
    return Math.round((cameras_processed / total_cameras) * 100)
  })

  const progressMessage = computed(() => {
    if (!progress.value) return ''
    return (progress.value as any).message || ''
  })

  const canGenerate = computed(() => {
    return !isGenerating.value && serviceAvailable.value !== false
  })

  // Actions
  async function checkServiceAvailability(): Promise<boolean> {
    try {
      await siteMapClient.healthCheck()
      serviceAvailable.value = true
      return true
    } catch (err) {
      console.warn('Site map generation service not available:', err)
      serviceAvailable.value = false
      return false
    }
  }

  async function generateFromCameras(
    cameraIds: string[],
    captureMethod: 'vapix' | 'rtsp' = 'vapix'
  ): Promise<GeneratedSiteMap | null> {
    if (!canGenerate.value) {
      throw new Error('Cannot start generation: service unavailable or already generating')
    }

    // Get camera data
    const cameraStore = useCameraStore()
    const camerasData: CameraData[] = []

    for (const cameraId of cameraIds) {
      const camera = cameraStore.getCameraByIdFromStore(cameraId)
      if (!camera) {
        console.warn(`Camera ${cameraId} not found, skipping`)
        continue
      }

      camerasData.push({
        id: camera.id,
        position: camera.position,
        capabilities: {
          resolution: camera.capabilities.resolution,
          fps: camera.capabilities.fps,
        },
        ipAddress: camera.ipAddress,
        rtspUrl: camera.rtspUrl,
      })
    }

    if (camerasData.length === 0) {
      throw new Error('No valid cameras found for generation')
    }

    try {
      isGenerating.value = true
      error.value = null
      progress.value = null
      lastGeneratedMap.value = null

      // Start generation
      const request: GenerationRequest = {
        camera_ids: cameraIds,
        cameras_data: camerasData,
        capture_method: captureMethod,
      }

      const response = await siteMapClient.startGeneration(request)
      generationId.value = response.generation_id

      // Poll for completion
      const siteMap = await siteMapClient.pollGenerationStatus(
        response.generation_id,
        (progressUpdate) => {
          progress.value = progressUpdate
        },
        1000 // Poll every second
      )

      lastGeneratedMap.value = siteMap
      return siteMap
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  async function generateFromAllOnlineCameras(): Promise<GeneratedSiteMap | null> {
    const cameraStore = useCameraStore()
    const onlineCameraIds = cameraStore.onlineCameras.map((c) => c.id)

    if (onlineCameraIds.length === 0) {
      throw new Error('No online cameras available')
    }

    return generateFromCameras(onlineCameraIds)
  }

  function resetGeneration() {
    isGenerating.value = false
    generationId.value = null
    progress.value = null
    error.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    isGenerating,
    generationId,
    progress,
    error,
    lastGeneratedMap,
    serviceAvailable,

    // Getters
    currentStatus,
    progressPercentage,
    progressMessage,
    canGenerate,

    // Actions
    checkServiceAvailability,
    generateFromCameras,
    generateFromAllOnlineCameras,
    resetGeneration,
    clearError,
  }
})

/**
 * Composable for Structure from Motion site map generation
 */

import { ref, computed } from 'vue'
import { siteMapClient } from '@/api/siteMapClient'
import type {
  SfMSettings,
  EnhancedSiteMap,
  CameraSnapshot,
  SfMGenerationRequest,
  GenerationProgress
} from '@/types/sitemap'

export function useSfMGeneration() {
  const isGenerating = ref(false)
  const generationId = ref<string | null>(null)
  const progress = ref(0)
  const currentStep = ref<string>('')
  const generatedMap = ref<EnhancedSiteMap | null>(null)
  const error = ref<string | null>(null)
  const serviceAvailable = ref<boolean | null>(null)

  const canGenerate = computed(() => {
    return !isGenerating.value && serviceAvailable.value !== false
  })

  /**
   * Check if the SfM generation service is available
   */
  async function checkServiceAvailability(): Promise<boolean> {
    try {
      await siteMapClient.healthCheck()
      serviceAvailable.value = true
      return true
    } catch (err) {
      console.warn('SfM generation service not available:', err)
      serviceAvailable.value = false
      return false
    }
  }

  /**
   * Capture snapshots from cameras using VAPIX API
   */
  async function captureSnapshots(
    cameras: Array<{ id: string; ipAddress?: string; position: { z: number } }>
  ): Promise<CameraSnapshot[]> {
    currentStep.value = 'Capturing camera snapshots...'

    const snapshots: CameraSnapshot[] = []

    for (const camera of cameras) {
      try {
        // In production, use VAPIX API to capture snapshot
        // For now, create mock snapshot
        const snapshot: CameraSnapshot = {
          id: camera.id,
          imageUrl: `/api/cameras/${camera.id}/snapshot`,
          height: camera.position.z,
          metadata: {
            timestamp: new Date().toISOString(),
            resolution: '1920x1080',
            ipAddress: camera.ipAddress
          }
        }

        snapshots.push(snapshot)
      } catch (err) {
        console.error(`Failed to capture snapshot from ${camera.id}:`, err)
        throw new Error(`Failed to capture snapshot from ${camera.id}`)
      }
    }

    return snapshots
  }

  /**
   * Generate site map from selected cameras using SfM
   */
  async function generateFromCameras(
    cameras: Array<{
      id: string
      ipAddress?: string
      position: { x: number; y: number; z: number; azimuth: number; elevation: number }
      capabilities: { resolution: string; fps: number }
    }>,
    settings: SfMSettings
  ): Promise<EnhancedSiteMap> {
    if (!canGenerate.value) {
      throw new Error('Cannot start generation: service unavailable or already generating')
    }

    isGenerating.value = true
    error.value = null
    progress.value = 0
    currentStep.value = 'Initializing...'
    generatedMap.value = null

    try {
      // Step 1: Capture snapshots
      const snapshots = await captureSnapshots(cameras)
      progress.value = 20

      // Step 2: Start SfM generation
      currentStep.value = 'Starting SfM reconstruction...'

      const request: SfMGenerationRequest = {
        cameras: snapshots,
        settings
      }

      const response = await siteMapClient.startGeneration({
        camera_ids: cameras.map(c => c.id),
        cameras_data: cameras.map(c => ({
          id: c.id,
          position: c.position,
          capabilities: c.capabilities,
          ipAddress: c.ipAddress
        }))
      })

      generationId.value = response.generation_id
      progress.value = 30

      // Step 3: Poll for completion
      const result = await pollForCompletion(response.generation_id, (progressUpdate) => {
        progress.value = 30 + (progressUpdate.progress * 0.7) // Scale to 30-100%
        currentStep.value = progressUpdate.message || progressUpdate.current_step || 'Processing...'
      })

      generatedMap.value = result
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generate from all online cameras
   */
  async function generateFromAllOnlineCameras(
    onlineCameras: Array<{
      id: string
      ipAddress?: string
      position: { x: number; y: number; z: number; azimuth: number; elevation: number }
      capabilities: { resolution: string; fps: number }
    }>,
    settings: SfMSettings
  ): Promise<EnhancedSiteMap> {
    if (onlineCameras.length === 0) {
      throw new Error('No online cameras available')
    }

    return generateFromCameras(onlineCameras, settings)
  }

  /**
   * Poll for generation completion
   */
  async function pollForCompletion(
    genId: string,
    onProgress?: (progress: GenerationProgress) => void,
    pollInterval: number = 1000
  ): Promise<EnhancedSiteMap> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await siteMapClient.getGenerationStatus(genId)

          // Update progress
          if (onProgress && response.status === 'processing') {
            const progressData: GenerationProgress = {
              generation_id: genId,
              status: response.status as any,
              progress: response.progress || 0,
              current_step: response.message || '',
              cameras_processed: 0,
              total_cameras: 0,
              message: response.message || ''
            }
            onProgress(progressData)
          }

          // Check status
          if (response.status === 'completed' && response.site_map_data) {
            resolve(response.site_map_data as EnhancedSiteMap)
          } else if (response.status === 'failed') {
            reject(new Error(response.error || 'Generation failed'))
          } else {
            // Continue polling
            setTimeout(poll, pollInterval)
          }
        } catch (err) {
          reject(err)
        }
      }

      // Start polling
      poll()
    })
  }

  /**
   * Reset generation state
   */
  function resetGeneration() {
    isGenerating.value = false
    generationId.value = null
    progress.value = 0
    currentStep.value = ''
    error.value = null
    generatedMap.value = null
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null
  }

  /**
   * Load point cloud for 3D visualization
   */
  async function loadPointCloud(siteMapId: string): Promise<ArrayBuffer> {
    try {
      return await siteMapClient.loadPointCloud(siteMapId)
    } catch (err) {
      console.error('Failed to load point cloud:', err)
      throw new Error('Failed to load 3D point cloud data')
    }
  }

  return {
    // State
    isGenerating,
    generationId,
    progress,
    currentStep,
    generatedMap,
    error,
    serviceAvailable,

    // Computed
    canGenerate,

    // Methods
    checkServiceAvailability,
    generateFromCameras,
    generateFromAllOnlineCameras,
    captureSnapshots,
    loadPointCloud,
    resetGeneration,
    clearError
  }
}

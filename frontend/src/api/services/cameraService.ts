/**
 * Camera API Service
 * Handles all camera-related API calls with mock mode support
 *
 * NOTE: In mock mode, camera data comes from the JSON config file
 *       (/public/sitemap-rectangular-room.json) which is the single source of truth.
 */

import { httpClient, type HttpClient } from '../client/httpClient'
import type { Camera, PTZCommand, StreamRequest, StreamResponse } from '@/types/generated'
import { loadSiteMapConfig, type SiteMapConfigCamera } from '@/utils/siteMapConfigLoader'

// In-memory cache for mock mode operations
let mockCamerasCache: Camera[] | null = null

/**
 * Transform config camera to Camera type (for mock mode)
 */
function transformConfigToCamera(configCamera: SiteMapConfigCamera): Camera {
  return {
    id: configCamera.id,
    name: configCamera.name,
    rtspUrl: configCamera.rtspUrl,
    status: 'online',
    model: configCamera.model,
    ipAddress: configCamera.ipAddress,
    position: {
      x: configCamera.position.x,
      y: configCamera.position.y,
      z: configCamera.height,
      azimuth: configCamera.azimuth
    }
  }
}

/**
 * Load cameras from config (for mock mode)
 */
async function loadMockCameras(): Promise<Camera[]> {
  if (mockCamerasCache) {
    return mockCamerasCache
  }
  const config = await loadSiteMapConfig()
  mockCamerasCache = config.cameras.map(transformConfigToCamera)
  return mockCamerasCache
}

export class CameraService {
  constructor(private client: HttpClient = httpClient) {}

  /**
   * Get all cameras
   */
  async getCameras(): Promise<Camera[]> {
    if (this.client.isMockMode()) {
      // Simulate network delay
      await this.delay(300)
      const cameras = await loadMockCameras()
      return [...cameras]
    }

    return this.client.get<Camera[]>('/cameras')
  }

  /**
   * Get camera by ID
   */
  async getCamera(id: string): Promise<Camera> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const cameras = await loadMockCameras()
      const camera = cameras.find(c => c.id === id)
      if (!camera) {
        throw new Error(`Camera not found: ${id}`)
      }
      return { ...camera }
    }

    return this.client.get<Camera>(`/cameras/${id}`)
  }

  /**
   * Get cameras by status
   */
  async getCamerasByStatus(status: Camera['status']): Promise<Camera[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const cameras = await loadMockCameras()
      return cameras.filter(c => c.status === status)
    }

    return this.client.get<Camera[]>('/cameras', {
      params: { status },
    })
  }

  /**
   * Update camera configuration
   */
  async updateCamera(id: string, data: Partial<Camera>): Promise<Camera> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      const cameras = await loadMockCameras()
      const camera = cameras.find(c => c.id === id)
      if (!camera) {
        throw new Error(`Camera not found: ${id}`)
      }
      const updated = { ...camera, ...data }
      // In mock mode, update the cache
      const index = cameras.findIndex((c) => c.id === id)
      if (index !== -1 && mockCamerasCache) {
        Object.assign(mockCamerasCache[index], data)
      }
      return updated
    }

    return this.client.patch<Camera>(`/cameras/${id}`, data)
  }

  /**
   * Delete camera
   */
  async deleteCamera(id: string): Promise<void> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      if (mockCamerasCache) {
        const index = mockCamerasCache.findIndex((c) => c.id === id)
        if (index !== -1) {
          mockCamerasCache.splice(index, 1)
        }
      }
      return
    }

    return this.client.delete(`/cameras/${id}`)
  }

  /**
   * Create new camera
   */
  async createCamera(data: Omit<Camera, 'id'>): Promise<Camera> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      const cameras = await loadMockCameras()
      const newCamera: Camera = {
        ...data,
        id: `camera${cameras.length + 1}`,
      }
      if (mockCamerasCache) {
        mockCamerasCache.push(newCamera)
      }
      return newCamera
    }

    return this.client.post<Camera>('/cameras', data)
  }

  /**
   * Send PTZ command
   */
  async sendPTZCommand(cameraId: string, command: PTZCommand): Promise<void> {
    if (this.client.isMockMode()) {
      await this.delay(100)
      return
    }

    return this.client.post(`/cameras/${cameraId}/ptz`, command)
  }

  /**
   * Request stream
   */
  async requestStream(cameraId: string, request: StreamRequest): Promise<StreamResponse> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return {
        streamId: `stream-${cameraId}-${Date.now()}`,
        url: `rtsp://localhost:8554/${cameraId}`,
        protocol: request.protocol,
        sessionId: `session-${Date.now()}`,
      }
    }

    return this.client.post<StreamResponse>(`/cameras/${cameraId}/stream`, request)
  }

  /**
   * Get camera health status
   */
  async getCameraHealth(cameraId: string): Promise<{ status: string; lastSeen: string }> {
    if (this.client.isMockMode()) {
      await this.delay(100)
      return {
        status: 'healthy',
        lastSeen: new Date().toISOString(),
      }
    }

    return this.client.get(`/cameras/${cameraId}/health`)
  }

  /**
   * Helper: Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const cameraService = new CameraService()

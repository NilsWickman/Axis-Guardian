/**
 * Camera API Service
 * Handles all camera-related API calls with mock mode support
 */

import { httpClient, type HttpClient } from '../client/httpClient'
import type { Camera, PTZCommand, StreamRequest, StreamResponse } from '@/types/generated'
import { mockCameras, getCameraById, getCamerasByStatus } from '@/mocks/data'

export class CameraService {
  constructor(private client: HttpClient = httpClient) {}

  /**
   * Get all cameras
   */
  async getCameras(): Promise<Camera[]> {
    if (this.client.isMockMode()) {
      // Simulate network delay
      await this.delay(300)
      return [...mockCameras]
    }

    return this.client.get<Camera[]>('/cameras')
  }

  /**
   * Get camera by ID
   */
  async getCamera(id: string): Promise<Camera> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const camera = getCameraById(id)
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
      return getCamerasByStatus(status)
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
      const camera = getCameraById(id)
      if (!camera) {
        throw new Error(`Camera not found: ${id}`)
      }
      const updated = { ...camera, ...data }
      // In mock mode, update the mock data directly
      const index = mockCameras.findIndex((c) => c.id === id)
      if (index !== -1) {
        Object.assign(mockCameras[index], data)
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
      const index = mockCameras.findIndex((c) => c.id === id)
      if (index !== -1) {
        mockCameras.splice(index, 1)
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
      const newCamera: Camera = {
        ...data,
        id: `camera${mockCameras.length + 1}`,
      }
      mockCameras.push(newCamera)
      return newCamera
    }

    return this.client.post<Camera>('/cameras', data)
  }

  /**
   * Send PTZ command
   */
  async sendPTZCommand(cameraId: string, command: PTZCommand): Promise<void> {
    if (this.client.is()) {
      await this.delay(100)
      console.log(`Mock PTZ command for ${cameraId}:`, command)
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

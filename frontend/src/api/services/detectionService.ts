/**
 * Detection API Service
 * Handles all detection-related API calls with mock mode support
 */

import { httpClient, type HttpClient } from '../client/httpClient'
import type { Detection, Track } from '@/types/generated'
import { mockDetections, mockTracks, getDetectionsByCameraId } from '@/mocks/data'

export interface DetectionFilters {
  cameraId?: string
  type?: Detection['type']
  minConfidence?: number
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface DetectionStats {
  total: number
  byType: Record<string, number>
  byCamera: Record<string, number>
  avgConfidence: number
}

export class DetectionService {
  constructor(private client: HttpClient = httpClient) {}

  /**
   * Get all detections with optional filters
   */
  async getDetections(filters?: DetectionFilters): Promise<Detection[]> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      let result = [...mockDetections]

      // Apply filters
      if (filters?.cameraId) {
        result = result.filter((d) => d.cameraId === filters.cameraId)
      }
      if (filters?.type) {
        result = result.filter((d) => d.type === filters.type)
      }
      if (filters?.minConfidence !== undefined) {
        result = result.filter((d) => d.confidence >= filters.minConfidence!)
      }
      if (filters?.startDate) {
        const start = new Date(filters.startDate).getTime()
        result = result.filter((d) => new Date(d.timestamp).getTime() >= start)
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate).getTime()
        result = result.filter((d) => new Date(d.timestamp).getTime() <= end)
      }

      // Apply pagination
      if (filters?.offset !== undefined) {
        result = result.slice(filters.offset)
      }
      if (filters?.limit !== undefined) {
        result = result.slice(0, filters.limit)
      }

      return result
    }

    return this.client.get<Detection[]>('/detections', {
      params: filters as any,
    })
  }

  /**
   * Get detection by ID
   */
  async getDetection(id: string): Promise<Detection> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const detection = mockDetections.find((d) => d.id === id)
      if (!detection) {
        throw new Error(`Detection not found: ${id}`)
      }
      return { ...detection }
    }

    return this.client.get<Detection>(`/detections/${id}`)
  }

  /**
   * Get detections for a specific camera
   */
  async getDetectionsByCamera(cameraId: string, filters?: Omit<DetectionFilters, 'cameraId'>): Promise<Detection[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return getDetectionsByCameraId(cameraId)
    }

    return this.getDetections({ ...filters, cameraId })
  }

  /**
   * Get detection statistics
   */
  async getDetectionStats(filters?: Pick<DetectionFilters, 'startDate' | 'endDate' | 'cameraId'>): Promise<DetectionStats> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      let detections = [...mockDetections]

      if (filters?.cameraId) {
        detections = detections.filter((d) => d.cameraId === filters.cameraId)
      }
      if (filters?.startDate) {
        const start = new Date(filters.startDate).getTime()
        detections = detections.filter((d) => new Date(d.timestamp).getTime() >= start)
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate).getTime()
        detections = detections.filter((d) => new Date(d.timestamp).getTime() <= end)
      }

      const byType: Record<string, number> = {}
      const byCamera: Record<string, number> = {}
      let totalConfidence = 0

      detections.forEach((d) => {
        byType[d.type] = (byType[d.type] || 0) + 1
        byCamera[d.cameraId] = (byCamera[d.cameraId] || 0) + 1
        totalConfidence += d.confidence
      })

      return {
        total: detections.length,
        byType,
        byCamera,
        avgConfidence: detections.length > 0 ? totalConfidence / detections.length : 0,
      }
    }

    return this.client.get('/detections/stats', {
      params: filters as any,
    })
  }

  /**
   * Get tracks (tracked objects across multiple detections)
   */
  async getTracks(filters?: { cameraId?: string; active?: boolean }): Promise<Track[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      let result = [...mockTracks]

      if (filters?.cameraId) {
        result = result.filter((t) =>
          t.detections.some((d) => d.cameraId === filters.cameraId)
        )
      }

      return result
    }

    return this.client.get<Track[]>('/tracks', {
      params: filters as any,
    })
  }

  /**
   * Get track by ID
   */
  async getTrack(trackId: string): Promise<Track> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const track = mockTracks.find((t) => t.trackId === trackId)
      if (!track) {
        throw new Error(`Track not found: ${trackId}`)
      }
      return { ...track }
    }

    return this.client.get<Track>(`/tracks/${trackId}`)
  }

  /**
   * Helper: Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const detectionService = new DetectionService()

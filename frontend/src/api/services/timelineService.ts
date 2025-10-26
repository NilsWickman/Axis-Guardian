/**
 * Timeline API Service
 * Handles timeline, events, and recording-related API calls with mock mode support
 */

import { httpClient, type HttpClient } from '../client/httpClient'
import type {
  TimelineEvent,
  RecordingSegment,
  TimelineBookmark,
  EventCluster,
  EventFilter,
  RecordingStats,
  VideoClip,
  EventAnalytics,
} from '@/types/timeline'

export interface TimelineFilters {
  cameraIds?: string[]
  startTime?: number
  endTime?: number
  eventTypes?: string[]
  minDuration?: number
}

export class TimelineService {
  constructor(private client: HttpClient = httpClient) {}

  /**
   * Get timeline events
   */
  async getEvents(filters?: EventFilter): Promise<TimelineEvent[]> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      // Return mock timeline events
      return this.generateMockEvents(filters)
    }

    return this.client.get<TimelineEvent[]>('/timeline/events', {
      params: filters as any,
    })
  }

  /**
   * Get event clusters (grouped events)
   */
  async getEventClusters(filters?: TimelineFilters): Promise<EventCluster[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return []
    }

    return this.client.get<EventCluster[]>('/timeline/clusters', {
      params: filters as any,
    })
  }

  /**
   * Get recording segments for a camera
   */
  async getRecordingSegments(cameraId: string, startTime: number, endTime: number): Promise<RecordingSegment[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return this.generateMockRecordingSegments(cameraId, startTime, endTime)
    }

    return this.client.get<RecordingSegment[]>(`/timeline/recordings/${cameraId}`, {
      params: { startTime, endTime },
    })
  }

  /**
   * Get recording statistics
   */
  async getRecordingStats(cameraId: string, startTime?: number, endTime?: number): Promise<RecordingStats> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return {
        cameraId,
        totalDuration: 86400, // 24 hours in seconds
        recordedDuration: 82800, // 23 hours recorded
        gapCount: 5,
        averageGapDuration: 720, // 12 minutes
        storageUsed: 5368709120, // 5 GB
        oldestRecording: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        newestRecording: Date.now(),
      }
    }

    return this.client.get<RecordingStats>(`/timeline/stats/${cameraId}`, {
      params: { startTime, endTime },
    })
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(filters?: TimelineFilters): Promise<EventAnalytics> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      return {
        totalEvents: 1250,
        eventsByType: {
          motion: 850,
          alarm: 250,
          detection: 150,
        },
        eventsByCamera: {
          camera1: 400,
          camera2: 350,
          camera3: 300,
          camera4: 200,
        },
        eventsByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 100),
        })),
        peakHour: 14,
        averageEventsPerDay: 52,
      }
    }

    return this.client.get<EventAnalytics>('/timeline/analytics', {
      params: filters as any,
    })
  }

  /**
   * Get bookmarks
   */
  async getBookmarks(cameraId?: string): Promise<TimelineBookmark[]> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return []
    }

    return this.client.get<TimelineBookmark[]>('/timeline/bookmarks', {
      params: cameraId ? { cameraId } : undefined,
    })
  }

  /**
   * Create bookmark
   */
  async createBookmark(bookmark: Omit<TimelineBookmark, 'id' | 'createdAt'>): Promise<TimelineBookmark> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return {
        ...bookmark,
        id: `bookmark-${Date.now()}`,
        createdAt: Date.now(),
      }
    }

    return this.client.post<TimelineBookmark>('/timeline/bookmarks', bookmark)
  }

  /**
   * Delete bookmark
   */
  async deleteBookmark(id: string): Promise<void> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      return
    }

    return this.client.delete(`/timeline/bookmarks/${id}`)
  }

  /**
   * Get video clip
   */
  async getVideoClip(clipId: string): Promise<VideoClip> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      return {
        id: clipId,
        cameraId: 'camera1',
        startTime: Date.now() - 600000, // 10 minutes ago
        endTime: Date.now(),
        duration: 600,
        url: `http://localhost:8000/clips/${clipId}.mp4`,
        thumbnailUrl: `http://localhost:8000/clips/${clipId}_thumb.jpg`,
        format: 'mp4',
        resolution: '1920x1080',
        fps: 30,
        size: 104857600, // 100 MB
        status: 'ready',
      }
    }

    return this.client.get<VideoClip>(`/timeline/clips/${clipId}`)
  }

  /**
   * Create video clip from time range
   */
  async createVideoClip(cameraId: string, startTime: number, endTime: number, name?: string): Promise<VideoClip> {
    if (this.client.isMockMode()) {
      await this.delay(500)
      return {
        id: `clip-${Date.now()}`,
        cameraId,
        startTime,
        endTime,
        duration: (endTime - startTime) / 1000,
        url: '',
        thumbnailUrl: '',
        format: 'mp4',
        resolution: '1920x1080',
        fps: 30,
        size: 0,
        status: 'processing',
        name,
      }
    }

    return this.client.post<VideoClip>('/timeline/clips', {
      cameraId,
      startTime,
      endTime,
      name,
    })
  }

  /**
   * Helper: Generate mock timeline events
   */
  private generateMockEvents(filters?: EventFilter): TimelineEvent[] {
    const now = Date.now()
    const events: TimelineEvent[] = []

    // Generate 20 mock events
    for (let i = 0; i < 20; i++) {
      const timestamp = now - i * 300000 // Every 5 minutes
      events.push({
        id: `event-${i}`,
        timestamp,
        type: i % 3 === 0 ? 'alarm' : i % 3 === 1 ? 'motion' : 'detection',
        cameraId: `camera${(i % 4) + 1}`,
        duration: Math.floor(Math.random() * 60) + 10, // 10-70 seconds
        thumbnailUrl: `http://localhost:8000/thumbnails/event-${i}.jpg`,
        description: `Event ${i}`,
        metadata: {},
      })
    }

    return events
  }

  /**
   * Helper: Generate mock recording segments
   */
  private generateMockRecordingSegments(cameraId: string, startTime: number, endTime: number): RecordingSegment[] {
    const segments: RecordingSegment[] = []
    const duration = endTime - startTime
    const segmentDuration = 3600000 // 1 hour

    let currentStart = startTime
    while (currentStart < endTime) {
      const segmentEnd = Math.min(currentStart + segmentDuration, endTime)

      // Add some gaps randomly
      if (Math.random() > 0.1) {
        segments.push({
          id: `segment-${segments.length}`,
          cameraId,
          startTime: currentStart,
          endTime: segmentEnd,
          duration: segmentEnd - currentStart,
          url: `http://localhost:8000/recordings/${cameraId}/${currentStart}.mp4`,
          size: 1073741824, // 1 GB
          format: 'mp4',
          resolution: '1920x1080',
          fps: 30,
        })
      }

      currentStart = segmentEnd
    }

    return segments
  }

  /**
   * Helper: Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const timelineService = new TimelineService()

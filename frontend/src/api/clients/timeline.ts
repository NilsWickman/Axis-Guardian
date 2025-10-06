import type {
  TimelineEvent,
  TimelineBookmark,
  ExportConfig,
  DetectionZone,
  VideoClip,
} from '@/types/timeline'

/**
 * Timeline API Client - Stub implementations
 */

const baseUrl = 'http://localhost:8000'

// Stub implementations for timeline API calls
export const acknowledgeEvent = async (eventId: string, userId: string, notes?: string): Promise<void> => {
  console.log('Acknowledging event:', eventId, userId, notes)
  // Stub - no actual API call
}

export const createBookmark = async (bookmark: Omit<TimelineBookmark, 'id'>): Promise<TimelineBookmark> => {
  console.log('Creating bookmark:', bookmark)
  return {
    id: `bookmark-${Date.now()}`,
    ...bookmark,
  }
}

export const deleteBookmark = async (bookmarkId: string): Promise<void> => {
  console.log('Deleting bookmark:', bookmarkId)
  // Stub - no actual API call
}

export const createExport = async (config: Omit<ExportConfig, 'id'>): Promise<ExportConfig> => {
  console.log('Creating export:', config)
  return {
    id: `export-${Date.now()}`,
    ...config,
    status: 'pending',
    progress: 0,
  }
}

export const getExportStatus = async (exportId: string): Promise<ExportConfig> => {
  console.log('Getting export status:', exportId)
  return {
    id: exportId,
    cameraIds: [],
    startTime: Date.now(),
    endTime: Date.now(),
    format: 'mp4',
    resolution: '1080p',
    status: 'completed',
    progress: 100,
  }
}

export const downloadExport = async (exportId: string): Promise<Blob> => {
  console.log('Downloading export:', exportId)
  // Return empty blob as stub
  return new Blob([''], { type: 'video/mp4' })
}

export const createVideoClip = async (clip: Omit<VideoClip, 'id'>): Promise<VideoClip> => {
  console.log('Creating video clip:', clip)
  return {
    id: `clip-${Date.now()}`,
    ...clip,
  }
}

export const deleteVideoClip = async (clipId: string): Promise<void> => {
  console.log('Deleting video clip:', clipId)
  // Stub - no actual API call
}

export const createDetectionZone = async (zone: Omit<DetectionZone, 'id'>): Promise<DetectionZone> => {
  console.log('Creating detection zone:', zone)
  return {
    id: `zone-${Date.now()}`,
    ...zone,
  }
}

export const updateDetectionZone = async (zoneId: string, updates: Partial<DetectionZone>): Promise<void> => {
  console.log('Updating detection zone:', zoneId, updates)
  // Stub - no actual API call
}

export const deleteDetectionZone = async (zoneId: string): Promise<void> => {
  console.log('Deleting detection zone:', zoneId)
  // Stub - no actual API call
}

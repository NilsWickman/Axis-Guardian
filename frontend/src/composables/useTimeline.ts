import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import * as timelineApi from '@/api/clients/timeline'
import type {
  TimelineEvent,
  EventFilter,
  TimelineBookmark,
  ExportConfig,
  DetectionZone,
  VideoClip,
  PlaybackSpeed,
  TimelineGranularity,
} from '@/types/timeline'

export const useTimeline = () => {
  const store = useTimelineStore()
  const error = ref<string | null>(null)

  // ===== Timeline Range Presets =====
  const presets = {
    lastHour: () => ({
      start: Date.now() - 3600000,
      end: Date.now(),
    }),
    last6Hours: () => ({
      start: Date.now() - 21600000,
      end: Date.now(),
    }),
    last12Hours: () => ({
      start: Date.now() - 43200000,
      end: Date.now(),
    }),
    last24Hours: () => ({
      start: Date.now() - 86400000,
      end: Date.now(),
    }),
    today: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      return { start, end: Date.now() }
    },
    yesterday: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      return { start, end }
    },
    thisWeek: () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime()
      return { start, end: Date.now() }
    },
    lastWeek: () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 7).getTime()
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime()
      return { start, end }
    },
  }

  // ===== Recording Segments =====
  const loadRecordingSegments = async (cameraId: string, startTime?: number, endTime?: number) => {
    try {
      error.value = null
      const range = startTime && endTime ? { start: startTime, end: endTime } : store.timelineRange
      await store.fetchRecordingSegments(cameraId, range.start, range.end)
    } catch (err: any) {
      error.value = err.message || 'Failed to load recording segments'
      throw err
    }
  }

  // ===== Events =====
  const loadEvents = async (startTime?: number, endTime?: number, filter?: EventFilter) => {
    try {
      error.value = null
      const range = startTime && endTime ? { start: startTime, end: endTime } : store.timelineRange
      await store.fetchEvents(range.start, range.end, filter)
    } catch (err: any) {
      error.value = err.message || 'Failed to load events'
      throw err
    }
  }

  const acknowledgeEvent = async (eventId: string, userId: string, notes?: string) => {
    try {
      error.value = null
      await timelineApi.acknowledgeEvent(eventId, userId, notes)
      store.acknowledgeEvent(eventId, userId)
    } catch (err: any) {
      error.value = err.message || 'Failed to acknowledge event'
      throw err
    }
  }

  const filterEvents = (filter: EventFilter) => {
    store.setEventFilter(filter)
  }

  // ===== Bookmarks =====
  const addBookmark = async (
    name: string,
    timestamp: number,
    cameraIds: string[],
    description?: string,
    userId?: string
  ) => {
    try {
      error.value = null
      const bookmark: Omit<TimelineBookmark, 'id'> = {
        name,
        description,
        timestamp,
        cameraIds,
        createdBy: userId || 'current-user',
        createdAt: Date.now(),
      }
      const created = await timelineApi.createBookmark(bookmark)
      store.addBookmark(created)
      return created
    } catch (err: any) {
      error.value = err.message || 'Failed to add bookmark'
      throw err
    }
  }

  const removeBookmark = async (bookmarkId: string) => {
    try {
      error.value = null
      await timelineApi.deleteBookmark(bookmarkId)
      store.removeBookmark(bookmarkId)
    } catch (err: any) {
      error.value = err.message || 'Failed to remove bookmark'
      throw err
    }
  }

  // ===== Playback Control =====
  const play = () => store.play()
  const pause = () => store.pause()
  const togglePlayPause = () => {
    if (store.playbackState.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const setSpeed = (speed: PlaybackSpeed) => store.setPlaybackSpeed(speed)
  const seekTo = (timestamp: number) => store.seekTo(timestamp)
  const seekRelative = (milliseconds: number) => {
    const newTime = store.playbackState.currentTime + milliseconds
    const clamped = Math.max(store.timelineRange.start, Math.min(store.timelineRange.end, newTime))
    store.seekTo(clamped)
  }

  const skipToNextEvent = () => {
    const currentTime = store.playbackState.currentTime
    const nextEvent = store.eventsInRange.find(e => e.timestamp > currentTime)
    if (nextEvent) {
      seekTo(nextEvent.timestamp)
    }
  }

  const skipToPreviousEvent = () => {
    const currentTime = store.playbackState.currentTime
    const previousEvents = store.eventsInRange.filter(e => e.timestamp < currentTime)
    if (previousEvents.length > 0) {
      seekTo(previousEvents[previousEvents.length - 1].timestamp)
    }
  }

  const goToLive = () => {
    seekTo(Date.now())
    play()
  }

  const toggleMute = () => store.toggleMute()
  const setVolume = (volume: number) => store.setVolume(volume)

  // ===== Export =====
  const createExport = async (config: Omit<ExportConfig, 'id'>) => {
    try {
      error.value = null
      const created = await timelineApi.createExport(config)
      store.createExportConfig(created)
      return created
    } catch (err: any) {
      error.value = err.message || 'Failed to create export'
      throw err
    }
  }

  const getExportStatus = async (exportId: string) => {
    try {
      error.value = null
      return await timelineApi.getExportStatus(exportId)
    } catch (err: any) {
      error.value = err.message || 'Failed to get export status'
      throw err
    }
  }

  const downloadExport = async (exportId: string) => {
    try {
      error.value = null
      const blob = await timelineApi.downloadExport(exportId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${exportId}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      error.value = err.message || 'Failed to download export'
      throw err
    }
  }

  // ===== Statistics & Analytics =====
  const loadRecordingStats = async (cameraId: string) => {
    try {
      error.value = null
      await store.fetchRecordingStats(cameraId)
    } catch (err: any) {
      error.value = err.message || 'Failed to load recording stats'
      throw err
    }
  }

  const loadEventAnalytics = async (startTime?: number, endTime?: number) => {
    try {
      error.value = null
      const range = startTime && endTime ? { start: startTime, end: endTime } : store.timelineRange
      await store.fetchEventAnalytics(range.start, range.end)
    } catch (err: any) {
      error.value = err.message || 'Failed to load event analytics'
      throw err
    }
  }

  // ===== Video Clips =====
  const createClip = async (
    name: string,
    startTime: number,
    endTime: number,
    cameraIds: string[],
    userId?: string,
    description?: string
  ) => {
    try {
      error.value = null
      const clip: Omit<VideoClip, 'id'> = {
        name,
        description,
        startTime,
        endTime,
        duration: endTime - startTime,
        cameraIds,
        createdBy: userId || 'current-user',
        createdAt: Date.now(),
      }
      const created = await timelineApi.createVideoClip(clip)
      store.createVideoClip(created)
      return created
    } catch (err: any) {
      error.value = err.message || 'Failed to create video clip'
      throw err
    }
  }

  const deleteClip = async (clipId: string) => {
    try {
      error.value = null
      await timelineApi.deleteVideoClip(clipId)
      store.deleteVideoClip(clipId)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete video clip'
      throw err
    }
  }

  // ===== Detection Zones =====
  const addZone = async (zone: Omit<DetectionZone, 'id'>) => {
    try {
      error.value = null
      const created = await timelineApi.createDetectionZone(zone)
      store.addDetectionZone(created)
      return created
    } catch (err: any) {
      error.value = err.message || 'Failed to add detection zone'
      throw err
    }
  }

  const updateZone = async (zoneId: string, updates: Partial<DetectionZone>) => {
    try {
      error.value = null
      await timelineApi.updateDetectionZone(zoneId, updates)
      store.updateDetectionZone(zoneId, updates)
    } catch (err: any) {
      error.value = err.message || 'Failed to update detection zone'
      throw err
    }
  }

  const removeZone = async (zoneId: string) => {
    try {
      error.value = null
      await timelineApi.deleteDetectionZone(zoneId)
      store.removeDetectionZone(zoneId)
    } catch (err: any) {
      error.value = err.message || 'Failed to remove detection zone'
      throw err
    }
  }

  // ===== Timeline View =====
  const setTimelineRange = (start: number, end: number) => {
    store.setTimelineRange(start, end)
  }

  const setPreset = (presetName: keyof typeof presets) => {
    const range = presets[presetName]()
    setTimelineRange(range.start, range.end)
  }

  const setCustomRange = (start: Date, end: Date) => {
    setTimelineRange(start.getTime(), end.getTime())
  }

  const zoom = (factor: number) => {
    const currentDuration = store.timelineRange.end - store.timelineRange.start
    const newDuration = currentDuration / factor
    const center = store.playbackState.currentTime
    const newStart = center - newDuration / 2
    const newEnd = center + newDuration / 2
    setTimelineRange(newStart, newEnd)
  }

  const setGranularity = (granularity: TimelineGranularity) => {
    store.updateViewConfig({ granularity })
  }

  // ===== Utility Functions =====
  const formatTimestamp = (timestamp: number, format: 'short' | 'long' | 'time-only' = 'short') => {
    const date = new Date(timestamp)

    switch (format) {
      case 'short':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      case 'long':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      case 'time-only':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      default:
        return date.toLocaleString()
    }
  }

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  // ===== Computed Properties =====
  const isLive = computed(() => {
    const now = Date.now()
    return Math.abs(store.playbackState.currentTime - now) < 30000 // Within 30 seconds
  })

  const timelineProgress = computed(() => {
    const duration = store.timelineRange.end - store.timelineRange.start
    const elapsed = store.playbackState.currentTime - store.timelineRange.start
    return (elapsed / duration) * 100
  })

  return {
    // State
    error,
    store,

    // Computed
    isLive,
    timelineProgress,

    // Recording Segments
    loadRecordingSegments,

    // Events
    loadEvents,
    acknowledgeEvent,
    filterEvents,
    skipToNextEvent,
    skipToPreviousEvent,

    // Bookmarks
    addBookmark,
    removeBookmark,

    // Playback
    play,
    pause,
    togglePlayPause,
    setSpeed,
    seekTo,
    seekRelative,
    goToLive,
    toggleMute,
    setVolume,

    // Export
    createExport,
    getExportStatus,
    downloadExport,

    // Stats & Analytics
    loadRecordingStats,
    loadEventAnalytics,

    // Video Clips
    createClip,
    deleteClip,

    // Detection Zones
    addZone,
    updateZone,
    removeZone,

    // Timeline View
    setTimelineRange,
    setPreset,
    setCustomRange,
    zoom,
    setGranularity,
    presets,

    // Utilities
    formatTimestamp,
    formatDuration,
    formatFileSize,
  }
}

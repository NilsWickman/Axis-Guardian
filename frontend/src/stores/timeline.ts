import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RecordingSegment,
  TimelineEvent,
  EventCluster,
  TimelineBookmark,
  EventFilter,
  TimelineViewConfig,
  PlaybackState,
  ExportConfig,
  RecordingStats,
  DetectionZone,
  EventAnalytics,
  VideoClip,
  NetworkQuality,
  StorageInfo,
  TimelineEventType,
  PlaybackSpeed,
  TimelineGranularity,
} from '@/types/timeline'

export const useTimelineStore = defineStore('timeline', () => {
  // Recording Segments
  const recordingSegments = ref<Record<string, RecordingSegment[]>>({}) // keyed by cameraId
  const loadingSegments = ref(false)

  // Events
  const events = ref<TimelineEvent[]>([])
  const eventClusters = ref<EventCluster[]>([])
  const loadingEvents = ref(false)

  // Bookmarks
  const bookmarks = ref<TimelineBookmark[]>([])

  // View Configuration
  const viewConfig = ref<TimelineViewConfig>({
    id: 'default',
    name: 'Default View',
    granularity: 'hour',
    showEvents: true,
    showRecordingGaps: true,
    showBookmarks: true,
    perCameraTimeline: false,
    syncCameras: true,
    eventFilter: {},
    selectedCameras: [],
    zoomLevel: 50,
    theme: 'detailed',
  })

  // Playback State
  const playbackState = ref<PlaybackState>({
    isPlaying: false,
    currentTime: Date.now(),
    speed: 1,
    isMuted: false,
    volume: 100,
    loop: false,
    motionOnlyMode: false,
    syncedCameras: [],
  })

  // Export Configurations
  const exportConfigs = ref<ExportConfig[]>([])
  const activeExport = ref<ExportConfig | null>(null)

  // Statistics
  const recordingStats = ref<Record<string, RecordingStats>>({})

  // Detection Zones
  const detectionZones = ref<Record<string, DetectionZone[]>>({}) // keyed by cameraId

  // Analytics
  const eventAnalytics = ref<EventAnalytics | null>(null)

  // Video Clips
  const videoClips = ref<VideoClip[]>([])

  // Network Quality
  const networkQualities = ref<Record<string, NetworkQuality[]>>({}) // keyed by cameraId

  // Storage Info
  const storageInfo = ref<StorageInfo[]>([])

  // Timeline Range
  const timelineRange = ref({
    start: Date.now() - 3600000, // 1 hour ago
    end: Date.now(),
  })

  // Event Filter
  const eventFilter = ref<EventFilter>({})

  // ===== Computed Properties =====

  const filteredEvents = computed(() => {
    let filtered = events.value

    if (eventFilter.value.types && eventFilter.value.types.length > 0) {
      filtered = filtered.filter(e => eventFilter.value.types?.includes(e.type))
    }

    if (eventFilter.value.cameraIds && eventFilter.value.cameraIds.length > 0) {
      filtered = filtered.filter(e => eventFilter.value.cameraIds?.includes(e.cameraId))
    }

    if (eventFilter.value.zones && eventFilter.value.zones.length > 0) {
      filtered = filtered.filter(e => e.zone && eventFilter.value.zones?.includes(e.zone))
    }

    if (eventFilter.value.severities && eventFilter.value.severities.length > 0) {
      filtered = filtered.filter(e => e.severity && eventFilter.value.severities?.includes(e.severity))
    }

    if (eventFilter.value.minConfidence !== undefined) {
      filtered = filtered.filter(e => (e.confidence ?? 1) >= (eventFilter.value.minConfidence ?? 0))
    }

    if (eventFilter.value.dateRange) {
      filtered = filtered.filter(
        e =>
          e.timestamp >= (eventFilter.value.dateRange?.start ?? 0) &&
          e.timestamp <= (eventFilter.value.dateRange?.end ?? Infinity)
      )
    }

    if (eventFilter.value.acknowledged !== undefined) {
      filtered = filtered.filter(e => !!e.acknowledged === eventFilter.value.acknowledged)
    }

    return filtered
  })

  const eventsInRange = computed(() => {
    return filteredEvents.value.filter(
      e => e.timestamp >= timelineRange.value.start && e.timestamp <= timelineRange.value.end
    )
  })

  const totalRecordingDuration = computed(() => {
    return Object.values(recordingSegments.value)
      .flat()
      .reduce((sum, seg) => sum + seg.duration, 0)
  })

  const totalStorageUsed = computed(() => {
    return Object.values(recordingSegments.value)
      .flat()
      .reduce((sum, seg) => sum + seg.fileSize, 0)
  })

  const recordingGaps = computed(() => {
    const gaps: Array<{ cameraId: string; start: number; end: number; duration: number }> = []

    Object.entries(recordingSegments.value).forEach(([cameraId, segments]) => {
      const sorted = [...segments].sort((a, b) => a.startTime - b.startTime)

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]
        const next = sorted[i + 1]
        const gapDuration = next.startTime - current.endTime

        if (gapDuration > 1000) {
          // Gap larger than 1 second
          gaps.push({
            cameraId,
            start: current.endTime,
            end: next.startTime,
            duration: gapDuration,
          })
        }
      }
    })

    return gaps
  })

  // ===== Actions =====

  // Recording Segments
  const fetchRecordingSegments = async (cameraId: string, startTime: number, endTime: number) => {
    loadingSegments.value = true
    try {
      // TODO: Implement API call
      // const segments = await api.getRecordingSegments(cameraId, startTime, endTime)
      // recordingSegments.value[cameraId] = segments

      // Mock data for now
      recordingSegments.value[cameraId] = generateMockSegments(cameraId, startTime, endTime)
    } catch (error) {
      console.error('Failed to fetch recording segments:', error)
      throw error
    } finally {
      loadingSegments.value = false
    }
  }

  const addRecordingSegment = (segment: RecordingSegment) => {
    if (!recordingSegments.value[segment.cameraId]) {
      recordingSegments.value[segment.cameraId] = []
    }
    recordingSegments.value[segment.cameraId].push(segment)
  }

  // Events
  const fetchEvents = async (startTime: number, endTime: number, filter?: EventFilter) => {
    loadingEvents.value = true
    try {
      // TODO: Implement API call
      // const fetchedEvents = await api.getEvents(startTime, endTime, filter)
      // events.value = fetchedEvents

      // Mock data for now
      events.value = generateMockEvents(startTime, endTime)

      // Auto-cluster events
      clusterEvents()
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    } finally {
      loadingEvents.value = false
    }
  }

  const addEvent = (event: TimelineEvent) => {
    events.value.push(event)
    clusterEvents()
  }

  const acknowledgeEvent = (eventId: string, userId: string) => {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      event.acknowledged = true
      event.acknowledgedBy = userId
      event.acknowledgedAt = Date.now()
    }
  }

  const clusterEvents = () => {
    const clusters: EventCluster[] = []
    const sorted = [...events.value].sort((a, b) => a.timestamp - b.timestamp)
    const clusterThreshold = 60000 // 1 minute

    let currentCluster: TimelineEvent[] = []
    let lastTimestamp = 0

    sorted.forEach(event => {
      if (currentCluster.length === 0 || event.timestamp - lastTimestamp <= clusterThreshold) {
        currentCluster.push(event)
        lastTimestamp = event.timestamp
      } else {
        if (currentCluster.length > 1) {
          clusters.push(createCluster(currentCluster))
        }
        currentCluster = [event]
        lastTimestamp = event.timestamp
      }
    })

    if (currentCluster.length > 1) {
      clusters.push(createCluster(currentCluster))
    }

    eventClusters.value = clusters
  }

  const createCluster = (events: TimelineEvent[]): EventCluster => {
    const typeCount: Record<TimelineEventType, number> = {} as any
    events.forEach(e => {
      typeCount[e.type] = (typeCount[e.type] || 0) + 1
    })
    const dominantType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0][0] as TimelineEventType

    return {
      id: `cluster-${events[0].id}`,
      events,
      startTime: events[0].timestamp,
      endTime: events[events.length - 1].timestamp,
      dominantType,
      cameraId: events[0].cameraId,
      count: events.length,
    }
  }

  // Bookmarks
  const addBookmark = (bookmark: TimelineBookmark) => {
    bookmarks.value.push(bookmark)
  }

  const removeBookmark = (bookmarkId: string) => {
    const index = bookmarks.value.findIndex(b => b.id === bookmarkId)
    if (index !== -1) {
      bookmarks.value.splice(index, 1)
    }
  }

  const updateBookmark = (bookmarkId: string, updates: Partial<TimelineBookmark>) => {
    const bookmark = bookmarks.value.find(b => b.id === bookmarkId)
    if (bookmark) {
      Object.assign(bookmark, updates)
    }
  }

  // View Configuration
  const updateViewConfig = (updates: Partial<TimelineViewConfig>) => {
    viewConfig.value = { ...viewConfig.value, ...updates }
  }

  const saveViewConfig = (config: TimelineViewConfig) => {
    // TODO: Persist to backend
    viewConfig.value = config
  }

  // Playback
  const play = () => {
    playbackState.value.isPlaying = true
  }

  const pause = () => {
    playbackState.value.isPlaying = false
  }

  const setPlaybackSpeed = (speed: PlaybackSpeed) => {
    playbackState.value.speed = speed
  }

  const seekTo = (timestamp: number) => {
    playbackState.value.currentTime = timestamp
  }

  const toggleMute = () => {
    playbackState.value.isMuted = !playbackState.value.isMuted
  }

  const setVolume = (volume: number) => {
    playbackState.value.volume = Math.max(0, Math.min(100, volume))
  }

  // Export
  const createExportConfig = (config: ExportConfig) => {
    exportConfigs.value.push(config)
    activeExport.value = config
  }

  const startExport = async (configId: string) => {
    const config = exportConfigs.value.find(c => c.id === configId)
    if (!config) return

    // TODO: Implement export API call
    console.log('Starting export:', config)
  }

  // Statistics
  const fetchRecordingStats = async (cameraId: string) => {
    try {
      // TODO: Implement API call
      // const stats = await api.getRecordingStats(cameraId)
      // recordingStats.value[cameraId] = stats

      // Mock data for now
      recordingStats.value[cameraId] = generateMockStats(cameraId)
    } catch (error) {
      console.error('Failed to fetch recording stats:', error)
      throw error
    }
  }

  // Analytics
  const fetchEventAnalytics = async (startTime: number, endTime: number) => {
    try {
      // TODO: Implement API call
      // eventAnalytics.value = await api.getEventAnalytics(startTime, endTime)

      // Mock data for now
      eventAnalytics.value = generateMockAnalytics(startTime, endTime)
    } catch (error) {
      console.error('Failed to fetch event analytics:', error)
      throw error
    }
  }

  // Video Clips
  const createVideoClip = (clip: VideoClip) => {
    videoClips.value.push(clip)
  }

  const deleteVideoClip = (clipId: string) => {
    const index = videoClips.value.findIndex(c => c.id === clipId)
    if (index !== -1) {
      videoClips.value.splice(index, 1)
    }
  }

  // Detection Zones
  const addDetectionZone = (zone: DetectionZone) => {
    if (!detectionZones.value[zone.cameraId]) {
      detectionZones.value[zone.cameraId] = []
    }
    detectionZones.value[zone.cameraId].push(zone)
  }

  const updateDetectionZone = (zoneId: string, updates: Partial<DetectionZone>) => {
    Object.values(detectionZones.value).forEach(zones => {
      const zone = zones.find(z => z.id === zoneId)
      if (zone) {
        Object.assign(zone, updates)
      }
    })
  }

  const removeDetectionZone = (zoneId: string) => {
    Object.entries(detectionZones.value).forEach(([cameraId, zones]) => {
      const index = zones.findIndex(z => z.id === zoneId)
      if (index !== -1) {
        detectionZones.value[cameraId].splice(index, 1)
      }
    })
  }

  // Timeline Range
  const setTimelineRange = (start: number, end: number) => {
    timelineRange.value = { start, end }
  }

  const setEventFilter = (filter: EventFilter) => {
    eventFilter.value = filter
  }

  // ===== Mock Data Generators =====

  const generateMockSegments = (cameraId: string, startTime: number, endTime: number): RecordingSegment[] => {
    const segments: RecordingSegment[] = []
    let current = startTime
    let segmentId = 1

    while (current < endTime) {
      const duration = Math.random() * 600000 + 300000 // 5-15 minutes
      const end = Math.min(current + duration, endTime)

      segments.push({
        id: `seg-${cameraId}-${segmentId++}`,
        cameraId,
        startTime: current,
        endTime: end,
        duration: end - current,
        quality: ['low', 'medium', 'high', 'ultra'][Math.floor(Math.random() * 4)] as any,
        bitrate: Math.random() * 4000 + 1000,
        fileSize: Math.random() * 100000000 + 50000000,
        filePath: `/recordings/${cameraId}/${current}.mp4`,
        fps: 30,
        resolution: '1920x1080',
        hasAudio: Math.random() > 0.5,
        isCorrupted: Math.random() > 0.95,
        storageLocation: 'local',
      })

      current = end + (Math.random() * 60000) // Add random gap
    }

    return segments
  }

  const generateMockEvents = (startTime: number, endTime: number): TimelineEvent[] => {
    const events: TimelineEvent[] = []
    const eventTypes: TimelineEventType[] = ['motion', 'person', 'vehicle', 'sound', 'alarm']
    const cameraIds = ['cam-01', 'cam-02', 'cam-03', 'cam-04']

    const count = Math.floor((endTime - startTime) / 300000) // Event every 5 minutes on average

    for (let i = 0; i < count; i++) {
      events.push({
        id: `event-${i}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        cameraId: cameraIds[Math.floor(Math.random() * cameraIds.length)],
        timestamp: startTime + Math.random() * (endTime - startTime),
        confidence: Math.random(),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        acknowledged: Math.random() > 0.7,
      })
    }

    return events.sort((a, b) => a.timestamp - b.timestamp)
  }

  const generateMockStats = (cameraId: string): RecordingStats => {
    return {
      cameraId,
      totalRecordingTime: Math.random() * 86400000,
      totalFileSize: Math.random() * 10000000000,
      averageBitrate: Math.random() * 3000 + 1000,
      gapCount: Math.floor(Math.random() * 10),
      totalGapTime: Math.random() * 3600000,
      qualityDistribution: {
        low: Math.random() * 20,
        medium: Math.random() * 30,
        high: Math.random() * 40,
        ultra: Math.random() * 10,
      },
      lastRecordingTime: Date.now(),
      storageHealth: ['good', 'warning', 'critical'][Math.floor(Math.random() * 3)] as any,
    }
  }

  const generateMockAnalytics = (startTime: number, endTime: number): EventAnalytics => {
    return {
      period: { start: startTime, end: endTime },
      totalEvents: Math.floor(Math.random() * 1000),
      eventsByType: {
        motion: Math.floor(Math.random() * 400),
        person: Math.floor(Math.random() * 200),
        vehicle: Math.floor(Math.random() * 150),
        sound: Math.floor(Math.random() * 100),
        alarm: Math.floor(Math.random() * 50),
        zone_breach: Math.floor(Math.random() * 80),
        camera_offline: Math.floor(Math.random() * 10),
        camera_online: Math.floor(Math.random() * 10),
        recording_started: Math.floor(Math.random() * 5),
        recording_stopped: Math.floor(Math.random() * 5),
        custom: Math.floor(Math.random() * 20),
      },
      eventsByCameraId: {
        'cam-01': Math.floor(Math.random() * 300),
        'cam-02': Math.floor(Math.random() * 250),
        'cam-03': Math.floor(Math.random() * 200),
        'cam-04': Math.floor(Math.random() * 150),
      },
      eventsByHour: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)),
      eventsByDayOfWeek: Array.from({ length: 7 }, () => Math.floor(Math.random() * 150)),
      peakHour: Math.floor(Math.random() * 24),
      peakDay: Math.floor(Math.random() * 7),
      averageEventsPerDay: Math.random() * 100 + 50,
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
    }
  }

  return {
    // State
    recordingSegments,
    loadingSegments,
    events,
    eventClusters,
    loadingEvents,
    bookmarks,
    viewConfig,
    playbackState,
    exportConfigs,
    activeExport,
    recordingStats,
    detectionZones,
    eventAnalytics,
    videoClips,
    networkQualities,
    storageInfo,
    timelineRange,
    eventFilter,

    // Computed
    filteredEvents,
    eventsInRange,
    totalRecordingDuration,
    totalStorageUsed,
    recordingGaps,

    // Actions
    fetchRecordingSegments,
    addRecordingSegment,
    fetchEvents,
    addEvent,
    acknowledgeEvent,
    clusterEvents,
    addBookmark,
    removeBookmark,
    updateBookmark,
    updateViewConfig,
    saveViewConfig,
    play,
    pause,
    setPlaybackSpeed,
    seekTo,
    toggleMute,
    setVolume,
    createExportConfig,
    startExport,
    fetchRecordingStats,
    fetchEventAnalytics,
    createVideoClip,
    deleteVideoClip,
    addDetectionZone,
    updateDetectionZone,
    removeDetectionZone,
    setTimelineRange,
    setEventFilter,
  }
})

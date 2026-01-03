/**
 * Composable for synchronizing multiple video elements
 */

import { ref, type Ref, onUnmounted } from 'vue'

interface VideoRef {
  cameraId: string
  element: Ref<HTMLVideoElement | null>
}

export function useMultiCameraVideoSync(videoRefs: VideoRef[]) {
  const masterTimestamp = ref(0) // Current time in seconds
  const isPlaying = ref(false)
  const isSeeking = ref(false)
  const duration = ref(0)
  const isReady = ref(false)

  // Track which videos are loaded
  const loadedVideos = ref<Set<string>>(new Set())

  /**
   * Wait for video to be seeked
   */
  function waitForSeeked(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        video.removeEventListener('seeked', handler)
        resolve()
      }
      video.addEventListener('seeked', handler)
    })
  }

  /**
   * Seek all videos to a specific timestamp
   */
  async function seekTo(timestamp: number): Promise<void> {
    if (isSeeking.value) return

    isSeeking.value = true

    // Pause all videos first
    for (const { element } of videoRefs) {
      const video = element.value
      if (video) {
        video.pause()
      }
    }
    isPlaying.value = false

    // Clamp timestamp to valid range
    const clampedTime = Math.max(0, Math.min(timestamp, duration.value))
    masterTimestamp.value = clampedTime

    // Seek all videos in parallel
    const seekPromises = videoRefs.map(async ({ element }) => {
      const video = element.value
      if (!video || video.readyState < 1) return

      video.currentTime = clampedTime
      await waitForSeeked(video)
    })

    await Promise.all(seekPromises)
    isSeeking.value = false
  }

  /**
   * Play all videos
   */
  function play(): void {
    for (const { element } of videoRefs) {
      const video = element.value
      if (video) {
        video.play().catch(() => {
          // Ignore autoplay errors
        })
      }
    }
    isPlaying.value = true
  }

  /**
   * Pause all videos
   */
  function pause(): void {
    for (const { element } of videoRefs) {
      const video = element.value
      if (video) {
        video.pause()
      }
    }
    isPlaying.value = false
  }

  /**
   * Toggle play/pause
   */
  function togglePlayPause(): void {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  /**
   * Handle time update from master video (first video)
   */
  function onMasterTimeUpdate(currentTime: number): void {
    if (!isSeeking.value) {
      masterTimestamp.value = currentTime
    }
  }

  /**
   * Handle video ended event
   */
  function onVideoEnded(): void {
    isPlaying.value = false
    // Seek back to start
    seekTo(0)
  }

  /**
   * Handle metadata loaded - update duration
   */
  function onMetadataLoaded(cameraId: string, videoDuration: number): void {
    loadedVideos.value.add(cameraId)

    // Use minimum duration across all videos
    if (duration.value === 0) {
      duration.value = videoDuration
    } else {
      duration.value = Math.min(duration.value, videoDuration)
    }

    // Check if all videos are loaded
    if (loadedVideos.value.size === videoRefs.length) {
      isReady.value = true
    }
  }

  /**
   * Skip forward/backward by seconds
   */
  async function skip(seconds: number): Promise<void> {
    const newTime = masterTimestamp.value + seconds
    await seekTo(newTime)
  }

  /**
   * Jump to keyframe (based on interval)
   */
  async function jumpToKeyframe(
    direction: 'next' | 'prev',
    intervalSeconds: number
  ): Promise<void> {
    const currentKeyframe = Math.floor(masterTimestamp.value / intervalSeconds)
    const newKeyframe = direction === 'next' ? currentKeyframe + 1 : currentKeyframe - 1
    const newTime = Math.max(0, newKeyframe * intervalSeconds)
    await seekTo(newTime)
  }

  /**
   * Jump to specific keyframe index
   */
  async function jumpToKeyframeIndex(index: number, intervalSeconds: number): Promise<void> {
    const newTime = index * intervalSeconds
    await seekTo(newTime)
  }

  /**
   * Reset state
   */
  function reset(): void {
    masterTimestamp.value = 0
    isPlaying.value = false
    isSeeking.value = false
    duration.value = 0
    isReady.value = false
    loadedVideos.value.clear()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    pause()
  })

  return {
    // State
    masterTimestamp,
    isPlaying,
    isSeeking,
    duration,
    isReady,

    // Methods
    seekTo,
    play,
    pause,
    togglePlayPause,
    onMasterTimeUpdate,
    onVideoEnded,
    onMetadataLoaded,
    skip,
    jumpToKeyframe,
    jumpToKeyframeIndex,
    reset,
  }
}

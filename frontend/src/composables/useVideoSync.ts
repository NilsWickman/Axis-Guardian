/**
 * Composable for monitoring video synchronization and providing feedback
 * to the detection service for adaptive timestamp adjustment.
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'
import type Hls from 'hls.js'

// Use Paho MQTT from CDN
declare const Paho: any

interface SyncFeedback {
  camera_id: string
  video_playback_time_s: number  // Current video position in seconds
  video_pts_ms: number            // Video PTS if available
  wall_clock_time: number         // Browser timestamp (seconds since epoch)
  hls_latency_ms: number          // Calculated HLS buffer latency
  loop_count: number              // Video loop counter (if tracked)
  suggested_offset_ms: number     // Recommended DETECTION_DELAY_MS
  measurement_quality: 'good' | 'fair' | 'poor'
}

interface SyncMetrics {
  hls_latency_ms: number
  suggested_offset_ms: number
  measurement_count: number
  last_update: number
  quality: 'good' | 'fair' | 'poor'
}

export function useVideoSync() {
  // MQTT client for publishing sync feedback
  let mqttClient: any = null

  // Sync metrics per camera
  const syncMetrics = ref<Map<string, SyncMetrics>>(new Map())

  // Connection state
  const isConnected = ref(false)
  const isMonitoring = ref(false)

  // Monitoring intervals
  const monitoringIntervals: Map<string, number> = new Map()

  // Baseline timestamps for latency calculation
  const streamStartTimes: Map<string, number> = new Map()

  /**
   * Connect to MQTT broker for publishing sync feedback
   */
  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isConnected.value) {
        resolve()
        return
      }

      if (typeof Paho === 'undefined') {
        reject(new Error('Paho MQTT library not loaded'))
        return
      }

      try {
        const clientId = 'sync-monitor-' + Math.random().toString(16).substr(2, 8)
        mqttClient = new Paho.MQTT.Client('localhost', 9001, clientId)

        mqttClient.onConnectionLost = (response: any) => {
          console.warn('MQTT sync connection lost:', response.errorMessage)
          isConnected.value = false
        }

        mqttClient.connect({
          onSuccess: () => {
            console.log('Connected to MQTT broker for sync feedback')
            isConnected.value = true
            resolve()
          },
          onFailure: (error: any) => {
            console.error('MQTT sync connection failed:', error)
            reject(error)
          },
          keepAliveInterval: 60,
          cleanSession: true,
          useSSL: false
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Calculate HLS latency for a video element
   */
  const calculateHLSLatency = (
    videoElement: HTMLVideoElement,
    hlsInstance: Hls | null,
    cameraId: string
  ): { latency_ms: number; quality: 'good' | 'fair' | 'poor' } => {
    try {
      // For looped videos, we need a different approach
      // Use HLS.js buffer info to get actual latency
      if (hlsInstance && hlsInstance.latency !== undefined) {
        // HLS.js provides latency directly
        const latency_ms = hlsInstance.latency * 1000

        let quality: 'good' | 'fair' | 'poor'
        if (latency_ms < 2000) {
          quality = 'good'
        } else if (latency_ms < 10000) {
          quality = 'fair'
        } else {
          quality = 'poor'
        }

        return { latency_ms, quality }
      }

      // Fallback: estimate from buffer
      // HLS buffer represents the delay between live edge and current playback
      const buffered = videoElement.buffered
      if (buffered.length > 0) {
        const bufferEnd = buffered.end(buffered.length - 1)
        const currentTime = videoElement.currentTime
        const bufferAhead = bufferEnd - currentTime

        // Typical HLS: buffer ahead = latency
        // For looped videos, this gives us the actual buffer size
        const latency_ms = bufferAhead * 1000

        let quality: 'good' | 'fair' | 'poor'
        if (videoElement.paused || videoElement.ended || latency_ms < 0) {
          quality = 'poor'
        } else if (latency_ms < 2000) {
          quality = 'good'
        } else if (latency_ms < 10000) {
          quality = 'fair'
        } else {
          quality = 'poor'
        }

        return { latency_ms, quality }
      }

      // Last resort: return poor quality with 0 latency
      return { latency_ms: 0, quality: 'poor' }
    } catch (err) {
      console.error('Error calculating HLS latency:', err)
      return { latency_ms: 0, quality: 'poor' }
    }
  }

  /**
   * Publish sync feedback to MQTT
   */
  const publishFeedback = (feedback: SyncFeedback) => {
    if (!mqttClient || !isConnected.value) {
      return
    }

    const topic = `surveillance/sync/${feedback.camera_id}/feedback`

    try {
      const message = new Paho.MQTT.Message(JSON.stringify(feedback))
      message.destinationName = topic
      message.qos = 0 // Best effort
      message.retained = false

      mqttClient.send(message)

      console.debug(`Sync feedback sent for ${feedback.camera_id}:`, {
        latency: `${feedback.hls_latency_ms.toFixed(0)}ms`,
        offset: `${feedback.suggested_offset_ms.toFixed(0)}ms`,
        quality: feedback.measurement_quality
      })
    } catch (err) {
      console.error('Error publishing sync feedback:', err)
    }
  }

  /**
   * Start monitoring video synchronization for a camera
   */
  const startMonitoring = async (
    cameraId: string,
    videoElement: Ref<HTMLVideoElement | null>,
    hlsInstance: Ref<Hls | null>,
    loopCount: Ref<number> = ref(0)
  ) => {
    // Ensure MQTT connection
    if (!isConnected.value) {
      await connect()
    }

    // Stop existing monitoring for this camera
    stopMonitoring(cameraId)

    // Start periodic monitoring (every 2 seconds)
    const intervalId = window.setInterval(() => {
      const video = videoElement.value
      const hls = hlsInstance.value

      if (!video || video.paused) {
        return // Skip if video not playing
      }

      // Calculate current HLS latency
      const { latency_ms, quality } = calculateHLSLatency(video, hls, cameraId)

      // Suggest offset (negative to compensate for latency)
      const suggested_offset_ms = -latency_ms

      // Build feedback message
      const feedback: SyncFeedback = {
        camera_id: cameraId,
        video_playback_time_s: video.currentTime,
        video_pts_ms: video.currentTime * 1000, // Approximate PTS
        wall_clock_time: Date.now() / 1000,
        hls_latency_ms: latency_ms,
        loop_count: loopCount.value,
        suggested_offset_ms: suggested_offset_ms,
        measurement_quality: quality
      }

      // Publish to MQTT
      publishFeedback(feedback)

      // Update local metrics
      const metrics = syncMetrics.value.get(cameraId) || {
        hls_latency_ms: 0,
        suggested_offset_ms: 0,
        measurement_count: 0,
        last_update: 0,
        quality: 'poor' as const
      }

      metrics.hls_latency_ms = latency_ms
      metrics.suggested_offset_ms = suggested_offset_ms
      metrics.measurement_count++
      metrics.last_update = Date.now()
      metrics.quality = quality

      syncMetrics.value.set(cameraId, metrics)

      // Trigger reactivity
      syncMetrics.value = new Map(syncMetrics.value)
    }, 2000) // Every 2 seconds

    monitoringIntervals.set(cameraId, intervalId)
    isMonitoring.value = true

    console.log(`Started sync monitoring for ${cameraId}`)
  }

  /**
   * Stop monitoring for a specific camera
   */
  const stopMonitoring = (cameraId: string) => {
    const intervalId = monitoringIntervals.get(cameraId)
    if (intervalId) {
      window.clearInterval(intervalId)
      monitoringIntervals.delete(cameraId)
      console.log(`Stopped sync monitoring for ${cameraId}`)
    }

    if (monitoringIntervals.size === 0) {
      isMonitoring.value = false
    }
  }

  /**
   * Get sync metrics for a camera
   */
  const getMetrics = (cameraId: string): ComputedRef<SyncMetrics | undefined> => {
    return computed(() => syncMetrics.value.get(cameraId))
  }

  /**
   * Disconnect from MQTT
   */
  const disconnect = () => {
    // Stop all monitoring
    monitoringIntervals.forEach((_, cameraId) => stopMonitoring(cameraId))

    // Disconnect MQTT
    if (mqttClient && isConnected.value) {
      try {
        mqttClient.disconnect()
        console.log('Disconnected from MQTT sync broker')
      } catch (err) {
        console.error('Error disconnecting from MQTT:', err)
      }
    }

    isConnected.value = false
    mqttClient = null
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    isConnected,
    isMonitoring,
    syncMetrics,

    // Methods
    connect,
    disconnect,
    startMonitoring,
    stopMonitoring,
    getMetrics
  }
}

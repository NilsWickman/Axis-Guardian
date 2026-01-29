/**
 * Mediasoup WebRTC composable with detection data channel
 *
 * Uses mediasoup-client for WebRTC video streaming with frame-synchronized
 * detection metadata via DataChannel. Replaces HTTP WHEP signaling with
 * WebSocket-based mediasoup signaling.
 */

import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { Device, type types as mediasoupTypes } from 'mediasoup-client'
import msgpack from 'msgpack-lite'
import type { Detection } from '@/types/detection.types'
import { useToast } from '@/composables/useToast'

export interface DetectionMetadata {
  camera_id: string
  frame_number: number
  timestamp: number
  detection_count: number
  detections: Detection[]
  detection_frame?: number
  dispatch_time?: number  // High-res ms timestamp for timing measurement
  video_time_ms?: number  // Video presentation time in ms (for sync with video element)
}

export interface MediasoupDetectionOptions {
  signalingUrl?: string
  autoReconnect?: boolean
  reconnectDelay?: number
  loopDuration?: number | null
  onLoop?: () => void
  /**
   * Manual sync offset in ms to compensate for video decoder latency.
   * Negative values release detections earlier (use when detections lag behind video).
   * Positive values delay detections (use when detections appear before video).
   * Default: 0
   */
  videoSyncOffsetMs?: number
}

const DEFAULT_OPTIONS: MediasoupDetectionOptions = {
  signalingUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'ws://localhost:9101',
  autoReconnect: true,
  reconnectDelay: 3000,
  loopDuration: null,
  onLoop: undefined,
  // Manual sync offset - with RTP calibration this should normally be 0
  // Negative = release detections earlier, Positive = delay detections
  videoSyncOffsetMs: Number(import.meta.env.VITE_VIDEO_SYNC_OFFSET_MS) || 0
}

// Adaptive sync constants
const RECALIBRATION_INTERVAL_MS = 15000  // Recalibrate every 15 seconds
const EMA_ALPHA = 0.3                     // Weight for new measurements (0.3 = 30% new, 70% old)
const CONFIDENCE_DECAY_RATE = 0.95        // Confidence decay per second
const MAX_OFFSET_HISTORY = 10             // History size for drift calculation

export function useMediasoupDetection(cameraId: string, options: MediasoupDetectionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const toast = useToast()

  let router: ReturnType<typeof useRouter> | null = null
  try {
    router = useRouter()
  } catch {
    // Router not available outside setup context
  }

  const shouldShowToast = () => {
    if (!router) return false
    const cameraRoutes = [
      'LiveDetectionView',
      'WebRTCDetectionView',
      'SnapshotView',
      'Tracking'
    ]
    return router.currentRoute.value.name && cameraRoutes.includes(router.currentRoute.value.name as string)
  }

  // State
  const device = ref<Device | null>(null)
  const transport = ref<mediasoupTypes.Transport | null>(null)
  const consumer = ref<mediasoupTypes.Consumer | null>(null)
  const dataConsumer = ref<mediasoupTypes.DataConsumer | null>(null)
  const websocket = ref<WebSocket | null>(null)
  const videoElement = ref<HTMLVideoElement | null>(null)

  const isConnected = ref(false)
  const isDataChannelOpen = ref(false)
  const connectionState = ref<string>('new')
  const isReconnecting = ref(false)
  const isExternalReconnecting = ref(false)
  const reconnectTimer = ref<number | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10

  // Detection data
  const currentDetections = ref<Detection[]>([])
  const currentMetadata = ref<DetectionMetadata | null>(null)
  const frameNumber = ref(0)
  const detectionCount = ref(0)
  const totalDetections = ref(0)

  // Frame synchronization
  const maxFrameAge = 5
  const detectionBuffer: DetectionMetadata[] = []
  const maxBufferSize = 30  // Increased buffer for video sync

  // Video-sync detection buffer
  // Holds detections until the video element's currentTime catches up
  const videoSyncBuffer: DetectionMetadata[] = []
  const maxVideoSyncBufferSize = 60  // ~2 seconds at 30fps
  let videoSyncInterval: number | null = null
  let lastVideoTime = 0
  let videoSyncOffset = 0  // Fallback offset (ms) derived from first metadata with video_time_ms
  let videoSyncCalibrated = false
  const VIDEO_SYNC_TOLERANCE_MS = 50  // Release detection if within 50ms of video time

  // If the (hidden) video element doesn't advance time (common on some browsers),
  // video-sync buffering would never release detections. Detect this and fall back.
  let videoSyncDisabled = false
  let lastObservedVideoTimeMs = 0
  let lastVideoProgressAt = Date.now()
  let firstMetadataAt: number | null = null

  // Manual sync offset (negative = release detections earlier, positive = delay detections)
  const manualSyncOffsetMs = ref(opts.videoSyncOffsetMs ?? 0)

  // Video frame metadata from requestVideoFrameCallback for accurate sync
  interface VideoFrameMetadataInfo {
    mediaTime: number       // Video presentation time in seconds (from decoder)
    presentationTime: number // When frame was composed (DOMHighResTimeStamp)
    rtpTimestamp?: number   // RTP timestamp (90kHz clock) for frame-perfect sync
  }
  let lastVideoFrameMetadata: VideoFrameMetadataInfo | null = null
  let videoFrameCallbackId: number | null = null
  const videoFrameHistory: { mediaTimeMs: number; wallTimeMs: number; rtpTimestamp?: number }[] = []
  const MAX_FRAME_HISTORY = 60  // ~2 seconds at 30fps

  // RTP timestamp tracking for frame-perfect sync
  let lastVideoRtpTimestamp: number | null = null
  let rtpTimestampAvailable = false
  // RTP calibration offset: difference between FFmpeg's RTP base and our calculated RTP
  // FFmpeg uses arbitrary base (e.g., starts at 3847291234), we use frameNumber * 3000 (starts at 0)
  let rtpCalibrationOffset: number | null = null

  // Fallback animation frame ID for iOS/browsers without requestVideoFrameCallback
  let fallbackAnimationId: number | null = null

  // Adaptive sync calibration - measures actual offset and adjusts automatically
  const syncCalibration = {
    measuredOffsets: [] as number[],
    adaptiveOffset: 0,
    confidenceLevel: 0,
  }
  const MAX_CALIBRATION_SAMPLES = 30

  // Adaptive sync state for drift tracking and periodic recalibration
  let recalibrationTimer: ReturnType<typeof setInterval> | null = null
  let lastCalibrationTime = 0
  let lastMeasurementTime = 0
  let offsetHistory: { time: number; offset: number }[] = []
  let detectedDriftRate = 0  // ms per second

  // Track last detection video_time_ms for loop detection on detection side
  let lastDetectionVideoTimeMs = 0

  // Base offset to align detection time with video time across loops
  // This is updated when a loop is detected to account for the video stream continuing
  // while detection video_time_ms resets
  let detectionTimeBaseOffset = 0

  // Stats
  const stats = ref({
    framesReceived: 0,
    detectionsReceived: 0,
    avgDetectionsPerFrame: 0,
    lastUpdateTime: 0,
    droppedStaleDetections: 0,
    latencyMs: 0,
    videoSyncBufferSize: 0,
    videoSyncDelayMs: 0  // How far ahead detections are from video
  })

  // Connection quality stats
  const connectionQuality = ref({
    packetLoss: 0,
    jitter: 0,
    roundTripTime: 0,
    bitrate: 0,
    framesDropped: 0,
    framesDecoded: 0,
    fps: 0,
    timestamp: 0
  })

  // Latency averaging
  const latencySamples: number[] = []
  const MAX_LATENCY_SAMPLES = 100
  const LATENCY_WINDOW_MS = 1000
  let latencyWindowStart = Date.now()

  // Pending timeouts
  const pendingTimeouts = new Set<number>()

  // Loop control
  const loopDuration = ref<number | null>(opts.loopDuration ?? null)
  let onLoopCallback: (() => void) | undefined = opts.onLoop
  let loopTriggeredThisCycle = false

  // Detection callback
  // Support multiple detection callbacks (connection manager + views)
  const onDetectionUpdateCallbacks = new Set<(metadata: DetectionMetadata) => void>()

  // Pending promise resolvers for WebSocket responses
  const pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (error: Error) => void }>()

  // Stats polling
  let statsInterval: number | null = null
  let lastFramesDecoded = 0
  let lastStatsTime = 0

  /**
   * Send message to WebSocket and wait for response
   */
  function sendRequest<T>(type: string, data: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!websocket.value || websocket.value.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      pendingRequests.set(type, { resolve, reject })
      websocket.value.send(JSON.stringify({ type, ...data }))

      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingRequests.has(type)) {
          pendingRequests.delete(type)
          reject(new Error(`Request ${type} timed out`))
        }
      }, 10000)
    })
  }

  /**
   * Update drift rate using linear regression on offset history
   */
  function updateDriftRate(newOffset: number): void {
    const now = Date.now()
    offsetHistory.push({ time: now, offset: newOffset })

    // Keep only the last MAX_OFFSET_HISTORY entries
    if (offsetHistory.length > MAX_OFFSET_HISTORY) {
      offsetHistory.shift()
    }

    // Need at least 3 samples for meaningful drift calculation
    if (offsetHistory.length >= 3) {
      // Linear regression to find drift rate (slope)
      const n = offsetHistory.length
      const sumX = offsetHistory.reduce((s, p) => s + p.time, 0)
      const sumY = offsetHistory.reduce((s, p) => s + p.offset, 0)
      const sumXY = offsetHistory.reduce((s, p) => s + p.time * p.offset, 0)
      const sumX2 = offsetHistory.reduce((s, p) => s + p.time * p.time, 0)

      const denominator = n * sumX2 - sumX * sumX
      if (Math.abs(denominator) > 0.001) {
        detectedDriftRate = (n * sumXY - sumX * sumY) / denominator
        // Convert to ms per second (slope is ms per ms)
        detectedDriftRate *= 1000
      }
    }
  }

  /**
   * Decay confidence over time if no recent measurements
   */
  function decayConfidence(): void {
    if (lastMeasurementTime === 0) return

    const timeSinceLastMeasurement = Date.now() - lastMeasurementTime
    const decayFactor = Math.pow(CONFIDENCE_DECAY_RATE, timeSinceLastMeasurement / 1000)
    syncCalibration.confidenceLevel *= decayFactor
  }

  /**
   * Get effective offset including adaptive offset, drift compensation, and manual offset
   */
  function getEffectiveOffset(): number {
    const baseOffset = syncCalibration.confidenceLevel > 0.5
      ? syncCalibration.adaptiveOffset
      : (videoSyncCalibrated ? videoSyncOffset : 0)

    // Compensate for drift since last calibration
    let driftCompensation = 0
    if (lastCalibrationTime > 0 && Math.abs(detectedDriftRate) > 0.001) {
      const timeSinceCalibration = (Date.now() - lastCalibrationTime) / 1000
      driftCompensation = detectedDriftRate * timeSinceCalibration
    }

    return baseOffset + driftCompensation + manualSyncOffsetMs.value
  }

  /**
   * Force recalibration by resetting calibration state
   */
  function forceRecalibration(): void {
    videoSyncCalibrated = false
    videoSyncOffset = 0
    syncCalibration.measuredOffsets = []
    // Don't reset adaptiveOffset - let EMA smooth it
    // Don't reset drift history - keep tracking drift
    lastCalibrationTime = Date.now()
  }

  /**
   * Start polling WebRTC stats for connection quality metrics
   */
  function startStatsPolling() {
    if (statsInterval) return

    lastStatsTime = performance.now()
    lastFramesDecoded = 0

    statsInterval = window.setInterval(async () => {
      if (!transport.value) return

      try {
        // Get stats from transport's underlying RTCPeerConnection
        const stats = await transport.value.getStats()

        stats.forEach((report: RTCStats) => {
          // Video inbound RTP stats
          if (report.type === 'inbound-rtp' && (report as RTCInboundRtpStreamStats).kind === 'video') {
            const videoStats = report as RTCInboundRtpStreamStats
            const now = performance.now()
            const timeDiff = (now - lastStatsTime) / 1000

            if (timeDiff > 0) {
              const currentFrames = videoStats.framesDecoded || 0
              // Only calculate FPS if we have a valid previous value and frames increased
              if (lastFramesDecoded > 0 && currentFrames >= lastFramesDecoded) {
                const framesDiff = currentFrames - lastFramesDecoded
                connectionQuality.value.fps = Math.round(framesDiff / timeDiff)
              } else if (currentFrames > 0 && lastFramesDecoded === 0) {
                // First measurement - don't update FPS yet
              } else if (currentFrames < lastFramesDecoded) {
                // Stream reset detected - reset baseline, don't show negative
                // Keep previous FPS value
              }
            }

            lastFramesDecoded = videoStats.framesDecoded || 0
            lastStatsTime = now

            connectionQuality.value.framesDecoded = videoStats.framesDecoded || 0
            connectionQuality.value.framesDropped = videoStats.framesDropped || 0
            connectionQuality.value.packetLoss = videoStats.packetsLost || 0
            connectionQuality.value.jitter = (videoStats.jitter || 0) * 1000
            connectionQuality.value.timestamp = now
          }

          // Candidate pair stats for RTT
          if (report.type === 'candidate-pair' && (report as RTCIceCandidatePairStats).state === 'succeeded') {
            const pairStats = report as RTCIceCandidatePairStats
            connectionQuality.value.roundTripTime = (pairStats.currentRoundTripTime || 0) * 1000
            connectionQuality.value.bitrate = (pairStats.availableOutgoingBitrate || 0) / 1000
          }
        })
      } catch (error) {
        // Stats collection may fail during reconnection
      }
    }, 1000)
  }

  /**
   * Stop stats polling
   */
  function stopStatsPolling() {
    if (statsInterval) {
      clearInterval(statsInterval)
      statsInterval = null
    }
  }

  /**
   * Initialize mediasoup connection via WebSocket signaling
   */
  async function connect(videoEl: HTMLVideoElement): Promise<void> {
    try {
      if (device.value || isReconnecting.value) {
        return
      }

      if (reconnectTimer.value !== null) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
      }

      videoElement.value = videoEl

      // Build WebSocket URL - append /ws/webrtc path if not already present
      let wsUrl = opts.signalingUrl!
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://')
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://')
      }
      // Append WebSocket path if not already present
      if (!wsUrl.includes('/ws/webrtc')) {
        wsUrl = wsUrl + '/ws/webrtc'
      }

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl)
      websocket.value = ws

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          resolve()
        }
        ws.onerror = (error) => {
          console.error(`[Mediasoup] ${cameraId}: WebSocket error:`, error)
          reject(new Error('WebSocket connection failed'))
        }
      })

      // Setup WebSocket message handler
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleSignalingMessage(data)
        } catch (error) {
          console.error(`[Mediasoup] ${cameraId}: Error parsing message:`, error)
        }
      }

      ws.onclose = () => {
        handleDisconnect()
      }

      // Reset reconnect attempts on successful WebSocket connection
      // This matches tracking service behavior and prevents permanent failure after transient issues
      reconnectAttempts.value = 0

      // Step 1: Get router RTP capabilities
      const rtpCapabilities = await sendRequest<mediasoupTypes.RtpCapabilities>('getRouterRtpCapabilities')

      // Step 2: Create mediasoup Device
      const newDevice = new Device()
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities })
      device.value = newDevice

      // Step 3: Create recv transport
      const transportParams = await sendRequest<{
        id: string
        iceParameters: mediasoupTypes.IceParameters
        iceCandidates: mediasoupTypes.IceCandidate[]
        dtlsParameters: mediasoupTypes.DtlsParameters
        sctpParameters: mediasoupTypes.SctpParameters
      }>('createTransport')

      const recvTransport = newDevice.createRecvTransport({
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
        sctpParameters: transportParams.sctpParameters
      })
      transport.value = recvTransport

      // Handle transport connect
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await sendRequest('connectTransport', { dtlsParameters })
          callback()
        } catch (error) {
          errback(error as Error)
        }
      })

      recvTransport.on('connectionstatechange', (state) => {
        connectionState.value = state
        isConnected.value = state === 'connected'

        if (state === 'connected') {
          startStatsPolling()
          if (shouldShowToast()) {
            toast.success(`Camera ${cameraId} connected`, 3000)
          }
          // Start periodic recalibration timer
          if (recalibrationTimer) clearInterval(recalibrationTimer)
          recalibrationTimer = setInterval(() => {
            forceRecalibration()
          }, RECALIBRATION_INTERVAL_MS)
          lastCalibrationTime = Date.now()
        } else if (state === 'failed') {
          if (shouldShowToast()) {
            toast.error(`Camera ${cameraId} connection failed`, 5000)
          }
          handleDisconnect()
        } else if (state === 'closed') {
          if (shouldShowToast()) {
            toast.warning(`Camera ${cameraId} disconnected`, 4000)
          }
          handleDisconnect()
        }
      })

      // Step 4: Request consumer (video + data)
      const consumeParams = await sendRequest<{
        consumerParams: {
          id: string
          producerId: string
          kind: 'audio' | 'video'
          rtpParameters: mediasoupTypes.RtpParameters
        }
        dataConsumerParams: {
          id: string
          dataProducerId: string
          sctpStreamParameters: mediasoupTypes.SctpStreamParameters
          label: string
        }
      }>('consume', { rtpCapabilities: newDevice.rtpCapabilities })

      // Create video consumer
      const videoConsumer = await recvTransport.consume({
        id: consumeParams.consumerParams.id,
        producerId: consumeParams.consumerParams.producerId,
        kind: consumeParams.consumerParams.kind,
        rtpParameters: consumeParams.consumerParams.rtpParameters
      })
      consumer.value = videoConsumer

      // Create data consumer for detections from server's DirectTransport DataProducer
      const detectionConsumer = await recvTransport.consumeData({
        id: consumeParams.dataConsumerParams.id,
        dataProducerId: consumeParams.dataConsumerParams.dataProducerId,
        sctpStreamParameters: consumeParams.dataConsumerParams.sctpStreamParameters,
        label: consumeParams.dataConsumerParams.label || 'detections'
      })
      dataConsumer.value = detectionConsumer

      // Data channel is open once created
      isDataChannelOpen.value = true
      if (shouldShowToast()) {
        toast.success(`Data channel for ${cameraId} ready`, 2000)
      }

      // Setup data consumer message handler
      let messageCount = 0
      detectionConsumer.on('message', (data: ArrayBuffer | string) => {
        try {
          let metadata: DetectionMetadata

          if (data instanceof ArrayBuffer) {
            const buffer = new Uint8Array(data)
            metadata = msgpack.decode(buffer) as DetectionMetadata
          } else {
            metadata = JSON.parse(data as string)
          }

          messageCount++
          processMetadata(metadata)
        } catch (error) {
          console.error(`[Mediasoup] ${cameraId}: Error parsing detection:`, error)
        }
      })

      detectionConsumer.on('close', () => {
        isDataChannelOpen.value = false
      })

      // Attach video track to video element
      const stream = new MediaStream([videoConsumer.track])
      videoEl.srcObject = stream

      videoEl.addEventListener('loadedmetadata', () => {
        if (videoEl.buffered.length > 0) {
          const end = videoEl.buffered.end(videoEl.buffered.length - 1)
          videoEl.currentTime = end
        }
      }, { once: true })

      videoEl.play().catch(e => console.error('Error playing video:', e))

      // Start video frame tracking for accurate sync
      startVideoFrameTracking()

      // Resume consumer
      await sendRequest('resumeConsumer')

      // Reset reconnect state
      reconnectAttempts.value = 0
      isExternalReconnecting.value = false

    } catch (error) {
      console.error(`[Mediasoup] ${cameraId}: Connection error:`, error)
      handleDisconnect()
      throw error
    }
  }

  /**
   * Handle signaling messages from server
   */
  function handleSignalingMessage(data: { type: string; [key: string]: unknown }) {
    const responseTypes: Record<string, string> = {
      'routerRtpCapabilities': 'getRouterRtpCapabilities',
      'transportCreated': 'createTransport',
      'transportConnected': 'connectTransport',
      'consumed': 'consume',
      'consumerResumed': 'resumeConsumer'
    }

    const requestType = responseTypes[data.type]
    if (requestType && pendingRequests.has(requestType)) {
      const { resolve } = pendingRequests.get(requestType)!
      pendingRequests.delete(requestType)

      // Extract relevant data based on response type
      switch (data.type) {
        case 'routerRtpCapabilities':
          resolve(data.rtpCapabilities)
          break
        case 'transportCreated':
          resolve(data.params)
          break
        case 'transportConnected':
          resolve(true)
          break
        case 'consumed':
          resolve({
            consumerParams: data.consumerParams,
            dataConsumerParams: data.dataConsumerParams
          })
          break
        case 'consumerResumed':
          resolve(true)
          break
        default:
          resolve(data)
      }
    } else if (data.type === 'error') {
      console.error(`[Mediasoup] ${cameraId}: Server error:`, data.error)
    }
  }

  /**
   * Fallback video frame tracking for iOS Safari and other browsers
   * without requestVideoFrameCallback support.
   * Uses requestAnimationFrame + currentTime polling.
   */
  function startVideoFrameTrackingFallback(): boolean {
    if (!videoElement.value || fallbackAnimationId !== null) return false

    const video = videoElement.value
    let lastTime = -1

    const pollFrame = () => {
      if (!videoElement.value) {
        fallbackAnimationId = null
        return
      }

      const currentTime = video.currentTime
      // Only update when video time has changed (new frame displayed)
      if (currentTime !== lastTime) {
        lastTime = currentTime
        const now = performance.now()

        // Simulate frame metadata (RTP timestamp not available in fallback)
        lastVideoFrameMetadata = {
          mediaTime: currentTime,
          presentationTime: now,
          rtpTimestamp: undefined
        }

        videoFrameHistory.push({
          mediaTimeMs: currentTime * 1000,
          wallTimeMs: now,
          rtpTimestamp: undefined
        })

        while (videoFrameHistory.length > MAX_FRAME_HISTORY) {
          videoFrameHistory.shift()
        }
      }

      fallbackAnimationId = requestAnimationFrame(pollFrame)
    }

    fallbackAnimationId = requestAnimationFrame(pollFrame)
    return true
  }

  /**
   * Start tracking actual video frame timing using requestVideoFrameCallback
   * This provides the actual mediaTime of displayed frames for accurate sync
   * Falls back to requestAnimationFrame polling on iOS Safari and other unsupported browsers
   */
  function startVideoFrameTracking(): boolean {
    if (!videoElement.value || videoFrameCallbackId !== null || fallbackAnimationId !== null) return false

    const video = videoElement.value

    // Check if requestVideoFrameCallback is supported
    if (!('requestVideoFrameCallback' in video)) {
      return startVideoFrameTrackingFallback()
    }

    const frameCallback = (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => {
      // Extract RTP timestamp if available (from VideoFrameCallbackMetadata)
      const rtpTs = (metadata as VideoFrameCallbackMetadata & { rtpTimestamp?: number }).rtpTimestamp

      lastVideoFrameMetadata = {
        mediaTime: metadata.mediaTime,
        presentationTime: now,
        rtpTimestamp: rtpTs
      }

      // Track RTP timestamp availability
      if (rtpTs !== undefined) {
        lastVideoRtpTimestamp = rtpTs
        if (!rtpTimestampAvailable) {
          rtpTimestampAvailable = true
          console.log(`[VideoSync] Browser provides RTP timestamps: ${rtpTs}`)
        }
      } else if (!rtpTimestampAvailable && videoFrameHistory.length === 10) {
        // After 10 frames without RTP, warn that we're using time-based sync
        console.log('[VideoSync] Browser does NOT provide RTP timestamps, using time-based sync')
      }

      // Record correlation: actual video mediaTime -> wall clock time (with RTP timestamp)
      videoFrameHistory.push({
        mediaTimeMs: metadata.mediaTime * 1000,
        wallTimeMs: now,
        rtpTimestamp: rtpTs
      })

      // Trim history
      while (videoFrameHistory.length > MAX_FRAME_HISTORY) {
        videoFrameHistory.shift()
      }

      // Continue tracking
      videoFrameCallbackId = (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: VideoFrameRequestCallback) => number }).requestVideoFrameCallback(frameCallback)
    }

    videoFrameCallbackId = (video as HTMLVideoElement & { requestVideoFrameCallback: (cb: VideoFrameRequestCallback) => number }).requestVideoFrameCallback(frameCallback)
    return true
  }

  /**
   * Stop video frame tracking (both native and fallback methods)
   */
  function stopVideoFrameTracking(): void {
    // Cancel native requestVideoFrameCallback
    if (videoFrameCallbackId !== null && videoElement.value) {
      const video = videoElement.value as HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void }
      video.cancelVideoFrameCallback?.(videoFrameCallbackId)
      videoFrameCallbackId = null
    }

    // Cancel fallback requestAnimationFrame
    if (fallbackAnimationId !== null) {
      cancelAnimationFrame(fallbackAnimationId)
      fallbackAnimationId = null
    }

    videoFrameHistory.length = 0
    lastVideoFrameMetadata = null
  }

  /**
   * Start video sync polling loop
   * This releases buffered detections when the video catches up
   */
  function startVideoSyncLoop() {
    if (videoSyncInterval) return

    videoSyncInterval = window.setInterval(() => {
      if (!videoElement.value || videoSyncBuffer.length === 0) return

      const videoTimeMs = videoElement.value.currentTime * 1000

      // Calibrate offset on first detection with video_time_ms
      if (!videoSyncCalibrated && videoSyncBuffer.length > 0) {
        const firstDetection = videoSyncBuffer[0]
        if (firstDetection.video_time_ms !== undefined) {
          // Calculate how far ahead detections are from video
          let rawOffset = firstDetection.video_time_ms - videoTimeMs

          // Handle join-time desync: when browser joins mid-stream, video starts at 0
          // but detection metadata is for the current stream position.
          // If offset is too large (> 10s), assume join-time desync and release immediately.
          const MAX_REASONABLE_OFFSET_MS = 10000  // 10 seconds
          if (Math.abs(rawOffset) > MAX_REASONABLE_OFFSET_MS) {
            rawOffset = 0  // Release detections immediately - they match the displayed frame
          }

          videoSyncOffset = rawOffset
          videoSyncCalibrated = true
        }
      }

      // Detect video loop/seek (large backward OR forward jump)
      if (videoTimeMs < lastVideoTime - 500 || videoTimeMs > lastVideoTime + 2000) {
        videoSyncBuffer.length = 0
        videoSyncCalibrated = false
        syncCalibration.measuredOffsets = []
        syncCalibration.adaptiveOffset = 0  // Reset the computed offset too
        syncCalibration.confidenceLevel = 0
        videoFrameHistory.length = 0
        lastVideoFrameMetadata = null  // Reset frame metadata to force recalibration
        // Reset drift tracking on video loop
        offsetHistory = []
        detectedDriftRate = 0
        lastCalibrationTime = Date.now()
        // Reset RTP calibration on video loop - FFmpeg RTP timestamps may change
        rtpCalibrationOffset = null
      }
      lastVideoTime = videoTimeMs

      // Apply confidence decay and use adaptive offset with drift compensation
      decayConfidence()
      const effectiveOffset = getEffectiveOffset()

      // Use actual mediaTime from frame callback if available (more accurate than currentTime)
      const actualVideoTimeMs = lastVideoFrameMetadata
        ? lastVideoFrameMetadata.mediaTime * 1000
        : videoTimeMs

      // Prune stale detections that are too far behind current video frame
      const staleThresholdMs = 1000  // Detections more than 1 second old
      const RTP_STALE_THRESHOLD = 90000  // 1 second at 90kHz clock
      while (videoSyncBuffer.length > 0) {
        const oldest = videoSyncBuffer[0]
        const oldestRtp = (oldest as DetectionMetadata & { rtp_timestamp?: number }).rtp_timestamp

        let isStale = false

        // Use RTP-based staleness check only if calibrated (otherwise comparison is meaningless)
        if (rtpTimestampAvailable && lastVideoRtpTimestamp !== null && oldestRtp !== undefined && rtpCalibrationOffset !== null) {
          // Apply calibration to align coordinate systems
          const calibratedOldestRtp = oldestRtp + rtpCalibrationOffset
          const rtpAge = lastVideoRtpTimestamp - calibratedOldestRtp
          isStale = rtpAge > RTP_STALE_THRESHOLD
        } else {
          // Fallback to time-based staleness
          const adjustedOldestTime = (oldest.video_time_ms ?? 0) + detectionTimeBaseOffset
          const age = actualVideoTimeMs - adjustedOldestTime
          isStale = age > staleThresholdMs
        }

        if (isStale) {
          videoSyncBuffer.shift()
          stats.value.droppedStaleDetections++
        } else {
          break
        }
      }

      // Release detections that match current video frame
      let releasedCount = 0
      while (videoSyncBuffer.length > 0) {
        const detection = videoSyncBuffer[0]
        const detectionRtp = (detection as DetectionMetadata & { rtp_timestamp?: number }).rtp_timestamp

        // Calibrate RTP offset once we have both timestamps
        // FFmpeg RTP timestamps use an arbitrary base (e.g., 3847291234)
        // Our calculated RTP = frameNumber * 3000 (starts at 0)
        // This calibration aligns them to the same coordinate system
        if (rtpCalibrationOffset === null && lastVideoRtpTimestamp !== null && detectionRtp !== undefined) {
          rtpCalibrationOffset = lastVideoRtpTimestamp - detectionRtp
          console.log(`[VideoSync] RTP calibrated: offset=${rtpCalibrationOffset}`)
        }

        // Use RTP timestamp correlation if available (frame-perfect sync)
        if (rtpTimestampAvailable && lastVideoRtpTimestamp !== null && detectionRtp !== undefined) {
          // RTP timestamps use 90kHz clock, tolerance of 1 frame = ~3000 ticks at 30fps
          const RTP_TOLERANCE = 4500  // ~1.5 frames tolerance
          // Apply calibration: adjust detection RTP to FFmpeg's coordinate system
          const calibratedDetectionRtp = detectionRtp + (rtpCalibrationOffset ?? 0)
          const rtpDiff = lastVideoRtpTimestamp - calibratedDetectionRtp

          if (rtpDiff >= -RTP_TOLERANCE) {
            // Video frame matches or is ahead of detection frame
            videoSyncBuffer.shift()
            releaseDetection(detection)
            releasedCount++
          } else {
            // Detection is ahead of video, wait
            break
          }
        } else {
          // Fallback to time-based sync
          // Apply base offset to align detection time with continuous video time
          const adjustedDetectionTime = (detection.video_time_ms ?? 0) + detectionTimeBaseOffset

          // Check if video has caught up to this detection (with adaptive offset applied)
          const releaseThreshold = adjustedDetectionTime - VIDEO_SYNC_TOLERANCE_MS + effectiveOffset
          if (actualVideoTimeMs >= releaseThreshold) {
            videoSyncBuffer.shift()
            releaseDetection(detection)
            releasedCount++
          } else {
            // Buffer is sorted by video_time_ms, so we can stop
            break
          }
        }
      }

      // Update stats
      stats.value.videoSyncBufferSize = videoSyncBuffer.length
      if (videoSyncBuffer.length > 0) {
        stats.value.videoSyncDelayMs = (videoSyncBuffer[0].video_time_ms ?? 0) - videoTimeMs
      } else {
        stats.value.videoSyncDelayMs = 0
      }
    }, 16)  // ~60fps polling for smooth sync
  }

  /**
   * Stop video sync loop
   */
  function stopVideoSyncLoop() {
    if (videoSyncInterval) {
      clearInterval(videoSyncInterval)
      videoSyncInterval = null
    }
    stopVideoFrameTracking()
    videoSyncBuffer.length = 0
    videoSyncCalibrated = false
    syncCalibration.measuredOffsets = []
    syncCalibration.adaptiveOffset = 0
    syncCalibration.confidenceLevel = 0
    lastDetectionVideoTimeMs = 0
    lastVideoTime = 0
    detectionTimeBaseOffset = 0
  }

  /**
   * Release a detection for processing (called when video catches up)
   */
  function releaseDetection(metadata: DetectionMetadata) {

    // Process buffered detection (update local state)
    processBufferedDetection(metadata)
  }

  /**
   * Process detection metadata
   * Buffers detections and releases them in sync with video playback
   */
  function processMetadata(metadata: DetectionMetadata) {
    const now = Date.now()

    // Calculate latency for stats
    const latency = now - (metadata.timestamp * 1000)
    latencySamples.push(latency)
    if (latencySamples.length > MAX_LATENCY_SAMPLES) {
      latencySamples.shift()
    }

    // Update average latency
    if (now - latencyWindowStart >= LATENCY_WINDOW_MS) {
      if (latencySamples.length > 0) {
        stats.value.latencyMs = latencySamples.reduce((sum, val) => sum + val, 0) / latencySamples.length
      }
      latencySamples.length = 0
      latencyWindowStart = now
    }

    // Update stats
    stats.value.framesReceived++
    stats.value.detectionsReceived += metadata.detection_count
    stats.value.avgDetectionsPerFrame = stats.value.detectionsReceived / stats.value.framesReceived
    stats.value.lastUpdateTime = metadata.timestamp

    // Measure actual offset for adaptive calibration
    // Compare detection's video_time_ms (adjusted for loops) with current video element time
    // This gives us the instantaneous offset which should be consistent within a loop
    if (metadata.video_time_ms !== undefined && videoElement.value) {
      // Apply base offset to align detection time with continuous video time
      const adjustedDetectionTimeMs = metadata.video_time_ms + detectionTimeBaseOffset
      const currentVideoTimeMs = videoElement.value.currentTime * 1000

      // Only calibrate if both times are reasonable (> 100ms to avoid startup noise)
      if (metadata.video_time_ms > 100 && currentVideoTimeMs > 100) {
        // Offset = how far ahead detections are compared to video playback
        // Positive offset means detections arrive before video shows that frame
        // Negative offset means detections arrive after video shows that frame
        const measuredOffset = adjustedDetectionTimeMs - currentVideoTimeMs

        // Filter out outliers (offsets > 2 seconds are likely from timing issues)
        if (Math.abs(measuredOffset) < 2000) {
          syncCalibration.measuredOffsets.push(measuredOffset)
          if (syncCalibration.measuredOffsets.length > MAX_CALIBRATION_SAMPLES) {
            syncCalibration.measuredOffsets.shift()
          }

          // Update adaptive offset using EMA (Exponential Moving Average)
          // EMA responds faster to changes than median while still smoothing noise
          if (syncCalibration.adaptiveOffset === 0) {
            // First measurement - use directly
            syncCalibration.adaptiveOffset = measuredOffset
          } else {
            // EMA: new = old * (1 - alpha) + sample * alpha
            syncCalibration.adaptiveOffset =
              syncCalibration.adaptiveOffset * (1 - EMA_ALPHA) + measuredOffset * EMA_ALPHA
          }

          // Update drift tracking
          updateDriftRate(measuredOffset)
          lastMeasurementTime = Date.now()

          // Calculate confidence from recent variance
          if (syncCalibration.measuredOffsets.length >= 5) {
            const recentOffsets = syncCalibration.measuredOffsets.slice(-10)
            const mean = recentOffsets.reduce((s, v) => s + v, 0) / recentOffsets.length
            const variance = recentOffsets.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentOffsets.length
            syncCalibration.confidenceLevel = Math.min(1, 1000 / (variance + 100))
          }

        }
      }
    }

    // If video_time_ms is available, use video-sync buffer (unless disabled)
    if (metadata.video_time_ms !== undefined && videoElement.value && !videoSyncDisabled) {
      // Track whether the video element time is progressing.
      const currentVideoTimeMs = videoElement.value.currentTime * 1000
      if (firstMetadataAt === null) firstMetadataAt = now
      if (currentVideoTimeMs > lastObservedVideoTimeMs + 50) {
        lastObservedVideoTimeMs = currentVideoTimeMs
        lastVideoProgressAt = now
      }
      // If we have been receiving detections for a while but video time is still ~0,
      // disable video sync so detections are released immediately.
      if (
        now - lastVideoProgressAt > 2000 &&
        currentVideoTimeMs < 200 &&
        metadata.video_time_ms > 500
      ) {
        videoSyncDisabled = true
        // Stop the sync loop to avoid buffering/CPU churn
        stopVideoSyncLoop()
      }

      // If disabled, drop into fallback path below on next metadata.
      if (videoSyncDisabled) {
        // continue to fallback
      } else {
      // Detect loop on detection side: video_time_ms drops significantly
      // This happens when the camera emulator loops the video
      if (lastDetectionVideoTimeMs > 0 && metadata.video_time_ms < lastDetectionVideoTimeMs - 1000) {
        // Calculate the new base offset: video continues but detection resets
        // The detection time needs to be shifted by how much the video has progressed
        const currentVideoTimeMs = videoElement.value.currentTime * 1000
        detectionTimeBaseOffset = currentVideoTimeMs - metadata.video_time_ms

        // Clear buffers but keep calibration since the relationship should be consistent
        videoSyncBuffer.length = 0
        videoSyncCalibrated = false
        // Reset drift tracking on detection loop - drift characteristics may change
        offsetHistory = []
        detectedDriftRate = 0
        lastCalibrationTime = Date.now()
        // Reset RTP calibration - calculated RTP resets with detection frame numbers
        rtpCalibrationOffset = null
      }
      lastDetectionVideoTimeMs = metadata.video_time_ms

      // Start sync loop if not running
      startVideoSyncLoop()

      // Add to video sync buffer (sorted by video_time_ms)
      videoSyncBuffer.push(metadata)

      // Trim buffer if too large (drop oldest)
      while (videoSyncBuffer.length > maxVideoSyncBufferSize) {
        const dropped = videoSyncBuffer.shift()
        if (dropped) {
          stats.value.droppedStaleDetections++
        }
      }

      // Call detection callbacks immediately for metadata panel updates.
      // This ensures components like DetectionMetadataPanel receive data
      // even when video sync buffering is active (canvas rendering still
      // uses the buffered release for frame-perfect sync).
      if (onDetectionUpdateCallbacks.size > 0) {
        for (const callback of onDetectionUpdateCallbacks) {
          callback(metadata)
        }
      }
      return
      }
    }

    // Fallback: no usable video time (or video-sync disabled), use old RTT-based delay
    {
      // Fallback: no video_time_ms, use old RTT-based delay
      // Buffer management
      detectionBuffer.push(metadata)
      if (detectionBuffer.length > maxBufferSize) {
        detectionBuffer.shift()
      }

      // Sync delay based on RTT
      const syncDelay = Math.min(connectionQuality.value.roundTripTime / 2, 50)
      const timeoutId = window.setTimeout(() => {
        pendingTimeouts.delete(timeoutId)
        processBufferedDetection(metadata)
      }, syncDelay)
      pendingTimeouts.add(timeoutId)
    }
  }

  /**
   * Process buffered detection
   */
  function processBufferedDetection(metadata: DetectionMetadata) {
    const currentFrame = frameNumber.value
    const frameDiff = metadata.frame_number - currentFrame

    if (frameDiff < -maxFrameAge) {
      stats.value.droppedStaleDetections++
      return
    }

    currentMetadata.value = metadata
    currentDetections.value = metadata.detections
    frameNumber.value = metadata.frame_number
    detectionCount.value = metadata.detection_count
    totalDetections.value += metadata.detection_count

    // Loop detection
    if (loopDuration.value !== null) {
      const loopFrameThreshold = loopDuration.value * 30
      if (metadata.frame_number >= loopFrameThreshold && !loopTriggeredThisCycle) {
        loopTriggeredThisCycle = true
        onLoopCallback?.()
      } else if (metadata.frame_number < loopFrameThreshold / 2 && loopTriggeredThisCycle) {
        loopTriggeredThisCycle = false
      }
    }

    if (onDetectionUpdateCallbacks.size > 0) {
      for (const callback of onDetectionUpdateCallbacks) {
        callback(metadata)
      }
    }
  }

  /**
   * Handle disconnection
   */
  function handleDisconnect(skipAutoReconnect = false) {
    isConnected.value = false
    isDataChannelOpen.value = false

    // Clear stale detection data to prevent showing old frame info after restart
    currentMetadata.value = null
    currentDetections.value = []

    stopStatsPolling()
    stopVideoSyncLoop()

    // Clear recalibration timer and reset drift tracking
    if (recalibrationTimer) {
      clearInterval(recalibrationTimer)
      recalibrationTimer = null
    }
    offsetHistory = []
    detectedDriftRate = 0

    pendingTimeouts.forEach(id => clearTimeout(id))
    pendingTimeouts.clear()

    // Cleanup mediasoup
    if (dataConsumer.value) {
      dataConsumer.value.close()
      dataConsumer.value = null
    }
    if (consumer.value) {
      consumer.value.close()
      consumer.value = null
    }
    if (transport.value) {
      transport.value.close()
      transport.value = null
    }
    device.value = null

    // Cleanup WebSocket
    if (websocket.value) {
      websocket.value.close()
      websocket.value = null
    }

    // Auto-reconnect
    if (opts.autoReconnect && videoElement.value && !isReconnecting.value && !skipAutoReconnect && !isExternalReconnecting.value) {
      if (reconnectAttempts.value >= maxReconnectAttempts) {
        console.error(`[Mediasoup] ${cameraId}: Max reconnect attempts reached`)
        return
      }

      isReconnecting.value = true
      reconnectAttempts.value++

      const baseDelay = opts.reconnectDelay || 3000
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.value - 1), 30000)

      if (shouldShowToast()) {
        toast.info(`Reconnecting ${cameraId} (${reconnectAttempts.value}/${maxReconnectAttempts})...`, Math.min(exponentialDelay, 5000))
      }

      reconnectTimer.value = window.setTimeout(() => {
        if (videoElement.value) {
          isReconnecting.value = false
          connect(videoElement.value).catch(err => {
            console.error(`[Mediasoup] ${cameraId}: Reconnect failed:`, err)
            isReconnecting.value = false
          })
        }
      }, exponentialDelay)
    }
  }

  /**
   * Disconnect
   */
  function disconnect(externalReconnecting = false) {
    if (reconnectTimer.value !== null) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    stopStatsPolling()
    stopVideoSyncLoop()

    pendingTimeouts.forEach(id => clearTimeout(id))
    pendingTimeouts.clear()

    isReconnecting.value = false
    isExternalReconnecting.value = externalReconnecting
    reconnectAttempts.value = 0

    if (dataConsumer.value) {
      dataConsumer.value.close()
      dataConsumer.value = null
    }
    if (consumer.value) {
      consumer.value.close()
      consumer.value = null
    }
    if (transport.value) {
      transport.value.close()
      transport.value = null
    }
    device.value = null

    if (websocket.value) {
      websocket.value.close()
      websocket.value = null
    }

    isConnected.value = false
    isDataChannelOpen.value = false
    currentDetections.value = []
    currentMetadata.value = null
    detectionBuffer.length = 0
    videoSyncBuffer.length = 0
    latencySamples.length = 0
    videoSyncDisabled = false
    lastObservedVideoTimeMs = 0
    lastVideoProgressAt = Date.now()
    firstMetadataAt = null
  }

  /**
   * Get detections by class
   */
  function getDetectionsByClass(className: string): Detection[] {
    return currentDetections.value.filter(d => d.class_name === className)
  }

  const classCounts = computed(() => {
    const counts: Record<string, number> = {}
    currentDetections.value.forEach(detection => {
      counts[detection.class_name] = (counts[detection.class_name] || 0) + 1
    })
    return counts
  })

  // Cleanup on unmount
  if (getCurrentInstance()) {
    onUnmounted(() => {
      disconnect()
    })
  }

  /**
   * Add a detection callback. Multiple callbacks can be registered.
   * Returns a function to remove the callback.
   */
  function setDetectionCallback(callback: (metadata: DetectionMetadata) => void): () => void {
    onDetectionUpdateCallbacks.add(callback)
    // Return cleanup function
    return () => {
      onDetectionUpdateCallbacks.delete(callback)
    }
  }

  function pauseVideo() {
    if (videoElement.value && !videoElement.value.paused) {
      videoElement.value.pause()
    }
  }

  function resumeVideo() {
    if (videoElement.value && videoElement.value.paused) {
      videoElement.value.play().catch(e => console.error('Error resuming video:', e))
    }
  }

  async function retryConnection() {
    if (!videoElement.value) {
      console.error('[Mediasoup] Cannot retry: no video element')
      return
    }

    reconnectAttempts.value = 0
    if (device.value) {
      disconnect()
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      if (shouldShowToast()) {
        toast.info(`Manually reconnecting ${cameraId}...`, 2000)
      }
      await connect(videoElement.value)
    } catch (error) {
      console.error('[Mediasoup] Manual retry failed:', error)
      if (shouldShowToast()) {
        toast.error(`Failed to reconnect ${cameraId}`, 5000)
      }
    }
  }

  function setLoopDuration(seconds: number | null, callback?: () => void) {
    loopDuration.value = seconds
    onLoopCallback = callback
  }

  function getVideoTime(): number {
    return videoElement.value?.currentTime ?? 0
  }

  /**
   * Set the manual video sync offset in milliseconds.
   * Negative values release detections earlier (use when detections lag behind video).
   * Positive values delay detections (use when detections appear before video).
   */
  function setVideoSyncOffset(offsetMs: number) {
    manualSyncOffsetMs.value = offsetMs
  }

  /**
   * Reset the external reconnecting flag
   * Called by ConnectionManager after a failed reconnection attempt
   * to allow future auto-reconnects
   */
  function resetExternalReconnecting() {
    isExternalReconnecting.value = false
  }

  return {
    // State
    isConnected,
    isDataChannelOpen,
    connectionState,
    loopDuration,
    videoSyncOffset: manualSyncOffsetMs,

    // Detection data
    currentDetections,
    currentMetadata,
    frameNumber,
    detectionCount,
    totalDetections,
    classCounts,

    // Stats
    stats,
    connectionQuality,

    // Methods
    connect,
    disconnect,
    getDetectionsByClass,
    setDetectionCallback,
    pauseVideo,
    resumeVideo,
    retryConnection,
    setLoopDuration,
    getVideoTime,
    setVideoSyncOffset,
    resetExternalReconnecting
  }
}

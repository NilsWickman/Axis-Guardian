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
import { emitWebRTCDetection } from './usePersonPositionTracking'

export interface DetectionMetadata {
  camera_id: string
  frame_number: number
  timestamp: number
  detection_count: number
  detections: Detection[]
  detection_frame?: number
}

export interface MediasoupDetectionOptions {
  signalingUrl?: string
  autoReconnect?: boolean
  reconnectDelay?: number
  loopDuration?: number | null
  onLoop?: () => void
}

const DEFAULT_OPTIONS: MediasoupDetectionOptions = {
  signalingUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'ws://localhost:9101',
  autoReconnect: true,
  reconnectDelay: 3000,
  loopDuration: null,
  onLoop: undefined
}

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
      'FocusView',
      'TimelineView',
      'CameraManagement'
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
  const maxBufferSize = 10

  // Stats
  const stats = ref({
    framesReceived: 0,
    detectionsReceived: 0,
    avgDetectionsPerFrame: 0,
    lastUpdateTime: 0,
    droppedStaleDetections: 0,
    latencyMs: 0
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
  let onDetectionUpdate: ((metadata: DetectionMetadata) => void) | null = null

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

            if (timeDiff > 0 && lastFramesDecoded > 0) {
              const framesDiff = (videoStats.framesDecoded || 0) - lastFramesDecoded
              connectionQuality.value.fps = Math.round(framesDiff / timeDiff)
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

      // Convert HTTP URL to WebSocket URL if needed
      let wsUrl = opts.signalingUrl!
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://') + '/ws/webrtc'
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://') + '/ws/webrtc'
      } else if (!wsUrl.includes('/ws/')) {
        wsUrl = wsUrl + '/ws/webrtc'
      }

      console.log(`[Mediasoup] ${cameraId}: Connecting to ${wsUrl}`)

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl)
      websocket.value = ws

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          console.log(`[Mediasoup] ${cameraId}: WebSocket connected`)
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
        console.log(`[Mediasoup] ${cameraId}: WebSocket closed`)
        handleDisconnect()
      }

      // Step 1: Get router RTP capabilities
      const rtpCapabilities = await sendRequest<mediasoupTypes.RtpCapabilities>('getRouterRtpCapabilities')
      console.log(`[Mediasoup] ${cameraId}: Got router RTP capabilities`)

      // Step 2: Create mediasoup Device
      const newDevice = new Device()
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities })
      device.value = newDevice
      console.log(`[Mediasoup] ${cameraId}: Device loaded`)

      // Step 3: Create recv transport
      const transportParams = await sendRequest<{
        id: string
        iceParameters: mediasoupTypes.IceParameters
        iceCandidates: mediasoupTypes.IceCandidate[]
        dtlsParameters: mediasoupTypes.DtlsParameters
        sctpParameters: mediasoupTypes.SctpParameters
      }>('createTransport')
      console.log(`[Mediasoup] ${cameraId}: Transport created (id: ${transportParams.id})`)

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
        console.log(`[Mediasoup] ${cameraId}: Transport state: ${state}`)
        connectionState.value = state
        isConnected.value = state === 'connected'

        if (state === 'connected') {
          startStatsPolling()
          if (shouldShowToast()) {
            toast.success(`Camera ${cameraId} connected`, 3000)
          }
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
      console.log(`[Mediasoup] ${cameraId}: Consumer params received`)

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
      console.log(`[Mediasoup] ${cameraId}: Data consumer created`)
      if (shouldShowToast()) {
        toast.success(`Data channel for ${cameraId} ready`, 2000)
      }

      // Setup data consumer message handler
      detectionConsumer.on('message', (data: ArrayBuffer | string) => {
        try {
          let metadata: DetectionMetadata

          if (data instanceof ArrayBuffer) {
            const buffer = new Uint8Array(data)
            metadata = msgpack.decode(buffer) as DetectionMetadata
          } else {
            metadata = JSON.parse(data as string)
          }

          processMetadata(metadata)
        } catch (error) {
          console.error(`[Mediasoup] ${cameraId}: Error parsing detection:`, error)
        }
      })

      detectionConsumer.on('close', () => {
        console.log(`[Mediasoup] ${cameraId}: Data consumer closed`)
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

      // Resume consumer
      await sendRequest('resumeConsumer')
      console.log(`[Mediasoup] ${cameraId}: Consumer resumed`)

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
   * Process detection metadata
   */
  function processMetadata(metadata: DetectionMetadata) {
    const now = Date.now()

    // Emit for person position tracking
    emitWebRTCDetection(metadata)

    // Calculate latency
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

    // Update stats
    stats.value.framesReceived++
    stats.value.detectionsReceived += metadata.detection_count
    stats.value.avgDetectionsPerFrame = stats.value.detectionsReceived / stats.value.framesReceived
    stats.value.lastUpdateTime = metadata.timestamp
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
        console.log(`[Mediasoup] ${cameraId}: Loop triggered at frame ${metadata.frame_number}`)
        loopTriggeredThisCycle = true
        onLoopCallback?.()
      } else if (metadata.frame_number < loopFrameThreshold / 2 && loopTriggeredThisCycle) {
        loopTriggeredThisCycle = false
      }
    }

    if (onDetectionUpdate) {
      onDetectionUpdate(metadata)
    }
  }

  /**
   * Handle disconnection
   */
  function handleDisconnect(skipAutoReconnect = false) {
    console.log(`[Mediasoup] ${cameraId}: handleDisconnect`)

    isConnected.value = false
    isDataChannelOpen.value = false

    stopStatsPolling()

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

      console.log(`[Mediasoup] ${cameraId}: Reconnecting in ${exponentialDelay}ms (attempt ${reconnectAttempts.value})`)

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
    latencySamples.length = 0
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

  function setDetectionCallback(callback: (metadata: DetectionMetadata) => void) {
    onDetectionUpdate = callback
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

  return {
    // State
    isConnected,
    isDataChannelOpen,
    connectionState,
    loopDuration,

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
    getVideoTime
  }
}

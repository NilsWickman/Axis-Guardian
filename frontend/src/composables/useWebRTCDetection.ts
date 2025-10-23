/**
 * WebRTC composable with detection data channel
 *
 * Provides real-time video streaming with frame-synchronized detection metadata
 * via WebRTC data channels. Metadata arrives with each frame for perfect alignment.
 */

import { ref, computed, onUnmounted, type Ref } from 'vue'
import type { Detection } from '@/types/detection.types'

export interface DetectionMetadata {
  camera_id: string
  frame_number: number
  timestamp: number
  detection_count: number
  detections: Detection[]
  detection_frame?: number // Original frame where detection ran
}

export interface WebRTCDetectionOptions {
  signalingUrl?: string
  iceServers?: RTCIceServer[]
  autoReconnect?: boolean
  reconnectDelay?: number
}

const DEFAULT_OPTIONS: WebRTCDetectionOptions = {
  signalingUrl: 'http://localhost:8080',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  autoReconnect: true,
  reconnectDelay: 3000
}

export function useWebRTCDetection(cameraId: string, options: WebRTCDetectionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // State
  const peerConnection = ref<RTCPeerConnection | null>(null)
  const dataChannel = ref<RTCDataChannel | null>(null)
  const videoElement = ref<HTMLVideoElement | null>(null)
  const isConnected = ref(false)
  const isDataChannelOpen = ref(false)
  const connectionState = ref<RTCPeerConnectionState>('new')
  const isReconnecting = ref(false)
  const reconnectTimer = ref<number | null>(null)

  // Detection data
  const currentDetections = ref<Detection[]>([])
  const currentMetadata = ref<DetectionMetadata | null>(null)
  const frameNumber = ref(0)
  const detectionCount = ref(0)
  const totalDetections = ref(0)

  // Frame synchronization
  const maxFrameAge = 5 // Maximum frames old before discarding
  const detectionQueue = ref<Map<number, DetectionMetadata>>(new Map())

  // Stats
  const stats = ref({
    framesReceived: 0,
    detectionsReceived: 0,
    avgDetectionsPerFrame: 0,
    lastUpdateTime: 0,
    droppedStaleDetections: 0,
    latencyMs: 0
  })

  // Callback for detection updates
  let onDetectionUpdate: ((metadata: DetectionMetadata) => void) | null = null

  /**
   * Initialize WebRTC peer connection
   */
  async function connect(videoEl: HTMLVideoElement): Promise<void> {
    try {
      // Prevent multiple simultaneous connections
      if (peerConnection.value || isReconnecting.value) {
        console.log('[WebRTC] Already connecting or connected, aborting')
        return
      }

      // Clear any pending reconnect timer
      if (reconnectTimer.value !== null) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
      }

      videoElement.value = videoEl

      // Create peer connection with bandwidth constraints
      peerConnection.value = new RTCPeerConnection({
        iceServers: opts.iceServers,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all'
      })

      const pc = peerConnection.value

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        connectionState.value = pc.connectionState
        isConnected.value = pc.connectionState === 'connected'

        console.log(`[WebRTC] Connection state: ${pc.connectionState}`)

        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          handleDisconnect()
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate:', event.candidate.candidate)
        }
      }

      // Handle incoming tracks (video)
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received track:', event.track.kind)
        if (event.track.kind === 'video' && videoEl) {
          videoEl.srcObject = event.streams[0]
          videoEl.play().catch(e => console.error('Error playing video:', e))
        }
      }

      // Create data channel (client-initiated)
      const channel = pc.createDataChannel('detections')
      setupDataChannel(channel)

      // Handle data channel from server (fallback)
      pc.ondatachannel = (event) => {
        console.log('[WebRTC] Data channel received from server:', event.channel.label)
        setupDataChannel(event.channel)
      }

      // Add a recvonly transceiver for video with codec preferences
      const transceiver = pc.addTransceiver('video', {
        direction: 'recvonly'
      })

      // Set codec preferences - prioritize H.264 for low latency
      if ('setCodecPreferences' in transceiver) {
        const codecs = RTCRtpReceiver.getCapabilities('video')?.codecs || []

        // Prioritize H.264 baseline profile
        const preferredCodecs = codecs.filter(codec => {
          const mimeType = codec.mimeType.toLowerCase()
          // Prefer H.264 baseline
          if (mimeType === 'video/h264') {
            const sdpFmtpLine = codec.sdpFmtpLine || ''
            return sdpFmtpLine.includes('42e01f') || sdpFmtpLine.includes('baseline')
          }
          return false
        })

        // Add other H.264 profiles as fallback
        const h264Codecs = codecs.filter(c => c.mimeType.toLowerCase() === 'video/h264')
        const otherCodecs = codecs.filter(c => c.mimeType.toLowerCase() !== 'video/h264')

        const orderedCodecs = [...preferredCodecs, ...h264Codecs, ...otherCodecs]

        if (orderedCodecs.length > 0) {
          transceiver.setCodecPreferences(orderedCodecs)
        }
      }

      // Create offer
      const offer = await pc.createOffer()

      // Modify SDP to add bandwidth constraints
      const sdpLines = offer.sdp.split('\r\n')
      const modifiedSdp: string[] = []

      for (let i = 0; i < sdpLines.length; i++) {
        const line = sdpLines[i]
        modifiedSdp.push(line)

        // Add bandwidth limit after video media line
        if (line.startsWith('m=video')) {
          // Add TIAS bandwidth (3 Mbps = 3000 kbps)
          modifiedSdp.push('b=TIAS:3000000')
          modifiedSdp.push('b=AS:3000')

          // Add frame rate constraint (30 fps max)
          modifiedSdp.push('a=framerate:30')
        }

        // Enable low-latency extensions
        if (line.startsWith('a=rtpmap:') && line.includes('H264')) {
          const payloadType = line.split(':')[1].split(' ')[0]

          // Add NACK (negative acknowledgment for packet loss)
          modifiedSdp.push(`a=rtcp-fb:${payloadType} nack`)
          modifiedSdp.push(`a=rtcp-fb:${payloadType} nack pli`)

          // Add FEC (forward error correction)
          modifiedSdp.push(`a=rtcp-fb:${payloadType} goog-remb`)

          // Transport-wide congestion control
          modifiedSdp.push(`a=rtcp-fb:${payloadType} transport-cc`)
        }
      }

      offer.sdp = modifiedSdp.join('\r\n')

      await pc.setLocalDescription(offer)

      // Send offer to signaling server
      const response = await fetch(`${opts.signalingUrl}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          camera_id: cameraId
        })
      })

      if (!response.ok) {
        throw new Error(`Signaling failed: ${response.statusText}`)
      }

      const answer = await response.json()

      // Set remote description (answer)
      await pc.setRemoteDescription(new RTCSessionDescription(answer))

      console.log('[WebRTC] Connection established')

    } catch (error) {
      console.error('[WebRTC] Connection error:', error)
      handleDisconnect()
      throw error
    }
  }

  /**
   * Setup data channel for receiving detection metadata
   */
  function setupDataChannel(channel: RTCDataChannel): void {
    dataChannel.value = channel

    channel.onopen = () => {
      console.log('[WebRTC] Data channel opened')
      isDataChannelOpen.value = true
    }

    channel.onclose = () => {
      console.log('[WebRTC] Data channel closed')
      isDataChannelOpen.value = false
    }

    channel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error)
    }

    // Receive detection metadata
    channel.onmessage = (event) => {
      try {
        const metadata: DetectionMetadata = JSON.parse(event.data)
        const now = performance.now()

        // Filter out stale detections (too old)
        const currentFrame = frameNumber.value
        const frameDiff = metadata.frame_number - currentFrame

        if (frameDiff < -maxFrameAge) {
          stats.value.droppedStaleDetections++
          console.warn(
            `[WebRTC] Dropped stale detection: frame ${metadata.frame_number} (current: ${currentFrame})`
          )
          return
        }

        // Calculate latency
        const latency = now - (metadata.timestamp * 1000)
        stats.value.latencyMs = latency

        // Update state immediately (reactive)
        currentMetadata.value = metadata
        currentDetections.value = metadata.detections
        frameNumber.value = metadata.frame_number
        detectionCount.value = metadata.detection_count
        totalDetections.value += metadata.detection_count

        // Update stats
        stats.value.framesReceived++
        stats.value.detectionsReceived += metadata.detection_count
        stats.value.avgDetectionsPerFrame =
          stats.value.detectionsReceived / stats.value.framesReceived
        stats.value.lastUpdateTime = metadata.timestamp

        // Trigger callback for immediate UI updates
        if (onDetectionUpdate) {
          onDetectionUpdate(metadata)
        }

        if (metadata.detection_count > 0) {
          console.log(
            `[WebRTC] Frame ${metadata.frame_number}: ${metadata.detection_count} detections (latency: ${latency.toFixed(1)}ms)`
          )
        }
      } catch (error) {
        console.error('[WebRTC] Error parsing metadata:', error)
      }
    }
  }

  /**
   * Handle disconnection and cleanup
   */
  function handleDisconnect(): void {
    isConnected.value = false
    isDataChannelOpen.value = false

    // Clean up peer connection
    if (dataChannel.value) {
      dataChannel.value.close()
      dataChannel.value = null
    }

    if (peerConnection.value) {
      peerConnection.value.close()
      peerConnection.value = null
    }

    // Auto-reconnect logic
    if (opts.autoReconnect && videoElement.value && !isReconnecting.value) {
      isReconnecting.value = true
      console.log(`[WebRTC] Reconnecting in ${opts.reconnectDelay}ms...`)

      reconnectTimer.value = window.setTimeout(() => {
        if (videoElement.value) {
          isReconnecting.value = false
          connect(videoElement.value).catch(err => {
            console.error('[WebRTC] Reconnect failed:', err)
            isReconnecting.value = false
          })
        }
      }, opts.reconnectDelay)
    }
  }

  /**
   * Disconnect and cleanup
   */
  function disconnect(): void {
    console.log('[WebRTC] Disconnecting...')

    // Clear reconnect timer
    if (reconnectTimer.value !== null) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    isReconnecting.value = false

    if (dataChannel.value) {
      dataChannel.value.close()
      dataChannel.value = null
    }

    if (peerConnection.value) {
      peerConnection.value.close()
      peerConnection.value = null
    }

    isConnected.value = false
    isDataChannelOpen.value = false
    currentDetections.value = []
    currentMetadata.value = null
  }

  /**
   * Get detections by class name
   */
  function getDetectionsByClass(className: string): Detection[] {
    return currentDetections.value.filter(d => d.class_name === className)
  }

  /**
   * Get class counts
   */
  const classCounts = computed(() => {
    const counts: Record<string, number> = {}
    currentDetections.value.forEach(detection => {
      counts[detection.class_name] = (counts[detection.class_name] || 0) + 1
    })
    return counts
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  /**
   * Set callback for detection updates
   */
  function setDetectionCallback(callback: (metadata: DetectionMetadata) => void): void {
    onDetectionUpdate = callback
  }

  return {
    // State
    isConnected,
    isDataChannelOpen,
    connectionState,

    // Detection data
    currentDetections,
    currentMetadata,
    frameNumber,
    detectionCount,
    totalDetections,
    classCounts,

    // Stats
    stats,

    // Methods
    connect,
    disconnect,
    getDetectionsByClass,
    setDetectionCallback
  }
}

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

  // Detection data
  const currentDetections = ref<Detection[]>([])
  const currentMetadata = ref<DetectionMetadata | null>(null)
  const frameNumber = ref(0)
  const detectionCount = ref(0)
  const totalDetections = ref(0)

  // Stats
  const stats = ref({
    framesReceived: 0,
    detectionsReceived: 0,
    avgDetectionsPerFrame: 0,
    lastUpdateTime: 0
  })

  /**
   * Initialize WebRTC peer connection
   */
  async function connect(videoEl: HTMLVideoElement): Promise<void> {
    try {
      videoElement.value = videoEl

      // Create peer connection
      peerConnection.value = new RTCPeerConnection({
        iceServers: opts.iceServers
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

      // Handle data channel from server
      pc.ondatachannel = (event) => {
        console.log('[WebRTC] Data channel received:', event.channel.label)
        setupDataChannel(event.channel)
      }

      // Create offer
      const offer = await pc.createOffer()
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

        // Update state
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

        if (metadata.detection_count > 0) {
          console.log(
            `[WebRTC] Frame ${metadata.frame_number}: ${metadata.detection_count} detections`
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

    if (opts.autoReconnect && videoElement.value) {
      console.log(`[WebRTC] Reconnecting in ${opts.reconnectDelay}ms...`)
      setTimeout(() => {
        if (videoElement.value) {
          connect(videoElement.value)
        }
      }, opts.reconnectDelay)
    }
  }

  /**
   * Disconnect and cleanup
   */
  function disconnect(): void {
    console.log('[WebRTC] Disconnecting...')

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
    getDetectionsByClass
  }
}

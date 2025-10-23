/**
 * Composable for WebRTC video streaming via MediaMTX
 * Provides ultra-low latency video (~500ms vs ~24s for HLS)
 */

import { ref, onUnmounted, type Ref } from 'vue'

interface OfferData {
  iceUfrag: string
  icePwd: string
  medias: string[]
}

interface WebRTCConnectionInfo {
  cameraId: string
  stream: MediaStream | null
  pc: RTCPeerConnection | null
  connected: boolean
  sessionUrl?: string | null
  queuedCandidates: RTCIceCandidate[]
  offerData?: OfferData
}

export function useWebRTC() {
  const connections = ref<Map<string, WebRTCConnectionInfo>>(new Map())
  const isSupported = ref(true)

  // Check WebRTC support
  if (!window.RTCPeerConnection) {
    console.error('WebRTC is not supported in this browser')
    isSupported.value = false
  }

  /**
   * Extract offer data from SDP for ICE trickle
   */
  const extractOfferData = (sdp: string): OfferData => {
    const iceUfragMatch = sdp.match(/a=ice-ufrag:(.+)/)
    const icePwdMatch = sdp.match(/a=ice-pwd:(.+)/)

    // Extract media lines
    const medias: string[] = []
    const mediaRegex = /m=(\w+\s+\d+\s+[\w/]+(?:\s+\d+)*)/g
    let match
    while ((match = mediaRegex.exec(sdp)) !== null) {
      medias.push(match[1])
    }

    return {
      iceUfrag: iceUfragMatch?.[1] || '',
      icePwd: icePwdMatch?.[1] || '',
      medias
    }
  }

  /**
   * Generate SDP fragment for ICE candidates (MediaMTX format)
   */
  const generateSdpFragment = (
    offerData: OfferData,
    candidates: RTCIceCandidate[]
  ): string => {
    // Group candidates by media line index
    const candidatesByMedia: Record<number, RTCIceCandidate[]> = {}
    for (const candidate of candidates) {
      const mid = candidate.sdpMLineIndex ?? 0
      if (!candidatesByMedia[mid]) {
        candidatesByMedia[mid] = []
      }
      candidatesByMedia[mid].push(candidate)
    }

    // Build SDP fragment
    let frag = `a=ice-ufrag:${offerData.iceUfrag}\r\n`
    frag += `a=ice-pwd:${offerData.icePwd}\r\n`

    let mid = 0
    for (const media of offerData.medias) {
      if (candidatesByMedia[mid]) {
        frag += `m=${media}\r\n`
        frag += `a=mid:${mid}\r\n`

        for (const candidate of candidatesByMedia[mid]) {
          if (candidate.candidate) {
            frag += `a=${candidate.candidate}\r\n`
          }
        }
      }
      mid++
    }

    return frag
  }

  /**
   * Send ICE candidates to MediaMTX via PATCH
   */
  const sendCandidates = async (
    connectionInfo: WebRTCConnectionInfo,
    baseUrl: string
  ) => {
    if (!connectionInfo.sessionUrl ||
        !connectionInfo.offerData ||
        connectionInfo.queuedCandidates.length === 0) {
      console.log(`[WebRTC] Skipping candidate send for ${connectionInfo.cameraId}:`, {
        hasSessionUrl: !!connectionInfo.sessionUrl,
        hasOfferData: !!connectionInfo.offerData,
        candidateCount: connectionInfo.queuedCandidates.length
      })
      return
    }

    try {
      // Build full session URL
      const sessionUrl = new URL(connectionInfo.sessionUrl, baseUrl).toString()

      // Generate SDP fragment
      const sdpFragment = generateSdpFragment(
        connectionInfo.offerData,
        connectionInfo.queuedCandidates
      )

      // Sending ICE candidates to MediaMTX

      const response = await fetch(sessionUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/trickle-ice-sdpfrag',
          'If-Match': '*',
        },
        body: sdpFragment
      })

      // Response received

      if (response.status !== 204) {
        const responseText = await response.text()
        console.warn(`[WebRTC] PATCH candidates returned ${response.status}:`, responseText)
      } else {
        // Candidates sent successfully
      }

      // Clear queued candidates after sending
      connectionInfo.queuedCandidates = []
    } catch (error) {
      console.error(`[WebRTC] Failed to send ICE candidates for ${connectionInfo.cameraId}:`, error)
    }
  }

  /**
   * Connect to a camera stream via WebRTC
   */
  const connect = async (
    cameraId: string,
    streamUrl: string
  ): Promise<MediaStream | null> => {
    if (!isSupported.value) {
      throw new Error('WebRTC not supported')
    }

    // Check if already connected
    if (connections.value.has(cameraId)) {
      console.warn(`Already connected to ${cameraId}`)
      return connections.value.get(cameraId)!.stream
    }

    try {
      // MediaMTX WebRTC endpoint
      // Convert HLS URL to WebRTC URL
      // Example: http://localhost:8888/camera1/index.m3u8 -> http://localhost:8889/camera1/whep
      const webrtcUrl = streamUrl
        .replace(':8888', ':8889') // Change HLS port to WebRTC port
        .replace('/index.m3u8', '/whep') // WHEP endpoint for playback

      // Connecting to WebRTC

      // WHEP protocol: MediaMTX implementation
      // Step 1: Get ICE servers via OPTIONS request
      const optionsResponse = await fetch(webrtcUrl, {
        method: 'OPTIONS'
      })

      // Parse ICE servers from Link header
      const linkHeader = optionsResponse.headers.get('Link')
      let iceServers: RTCIceServer[] = []

      if (linkHeader) {
        // Parse Link header for ICE servers
        // Format: <stun:server>; rel="ice-server", <turn:server>; rel="ice-server"
        const links = linkHeader.split(',')
        for (const link of links) {
          const match = link.match(/<([^>]+)>;\s*rel="ice-server"/)
          if (match) {
            iceServers.push({ urls: match[1] })
          }
        }
        // Parsed ICE servers from MediaMTX
      }

      // For localhost connections, don't use STUN servers
      // This prevents generating public IP candidates that can't be reached
      if (iceServers.length === 0) {
        // Empty array means only use host candidates (localhost)
        iceServers = []
        // Using host-only ICE for localhost
      }

      // Create RTCPeerConnection with MediaMTX's ICE servers
      const pc = new RTCPeerConnection({
        iceServers,
        sdpSemantics: 'unified-plan' as any // MediaMTX uses unified-plan
      })

      // Track connection for cleanup
      const connectionInfo: WebRTCConnectionInfo = {
        cameraId,
        stream: null,
        pc,
        connected: false,
        sessionUrl: null,
        queuedCandidates: []
      }

      // Handle incoming tracks
      const stream = new MediaStream()
      pc.ontrack = (event) => {
        stream.addTrack(event.track)
        connectionInfo.stream = stream

        // Monitor critical track issues
        event.track.onended = () => {
          console.warn(`[WebRTC] ${cameraId}: ${event.track.kind} track ended`)
        }
      }

      // Handle ICE candidates - queue until session URL is available
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          connectionInfo.queuedCandidates.push(event.candidate)

          // If session URL is available, send immediately
          if (connectionInfo.sessionUrl) {
            sendCandidates(connectionInfo, webrtcUrl)
          }
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        connectionInfo.connected = pc.connectionState === 'connected'

        if (pc.connectionState === 'connected') {
          console.log(`[WebRTC] ✓ ${cameraId} connected`)
        } else if (pc.connectionState === 'failed') {
          console.error(`[WebRTC] ✗ ${cameraId} connection failed`)
        }
      }

      // Step 2: Add transceiver for receiving video
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      // Step 3: Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Extract offer data for ICE trickle
      if (offer.sdp) {
        connectionInfo.offerData = extractOfferData(offer.sdp)
        // Extracted offer data
      }

      // Step 4: Send offer to MediaMTX via HTTP POST
      // Send just the SDP string, not the whole object
      const response = await fetch(webrtcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp || ''
      })

      // MediaMTX returns 201 for success, not 200
      if (response.status !== 201) {
        if (response.status === 404) {
          throw new Error('Stream not found - camera may not be publishing')
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({ error: 'Bad Request' }))
          throw new Error(`Bad request: ${errorData.error || 'Unknown error'}`)
        }
        throw new Error(`WHEP request failed: ${response.status} ${response.statusText}`)
      }

      // Step 5: Get answer from MediaMTX
      const answerSdp = await response.text()
      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: answerSdp
      }

      await pc.setRemoteDescription(answer)

      // Get session URL from Location header for ICE trickle
      connectionInfo.sessionUrl = response.headers.get('location')
      // WebRTC session established

      // Store connection
      connections.value.set(cameraId, connectionInfo)

      // Send any queued candidates now that we have the session URL
      if (connectionInfo.queuedCandidates.length > 0) {
        // Sending queued candidates
        await sendCandidates(connectionInfo, webrtcUrl)
      }

      // Connection setup complete

      // Wait for stream to have tracks
      await new Promise<void>((resolve) => {
        const checkTracks = setInterval(() => {
          if (stream.getTracks().length > 0) {
            console.log(`[WebRTC] ✓ ${cameraId} stream ready`)
            clearInterval(checkTracks)
            resolve()
          }
        }, 100)

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkTracks)
          if (stream.getTracks().length === 0) {
            console.warn(`[WebRTC] ✗ No tracks received for ${cameraId} after 10s timeout`)
          } else {
            // Stream has tracks, continuing
          }
          resolve()
        }, 10000)
      })

      return stream
    } catch (error) {
      console.error(`Failed to connect WebRTC for ${cameraId}:`, error)
      return null
    }
  }

  /**
   * Disconnect from a camera stream
   */
  const disconnect = (cameraId: string) => {
    const connection = connections.value.get(cameraId)
    if (!connection) {
      return
    }

    // Close peer connection
    if (connection.pc) {
      connection.pc.close()
    }

    // Stop all tracks
    if (connection.stream) {
      connection.stream.getTracks().forEach(track => track.stop())
    }

    connections.value.delete(cameraId)
    // Disconnected WebRTC
  }

  /**
   * Disconnect all connections
   */
  const disconnectAll = () => {
    connections.value.forEach((_, cameraId) => disconnect(cameraId))
  }

  /**
   * Get connection info for a camera
   */
  const getConnection = (cameraId: string): Ref<WebRTCConnectionInfo | undefined> => {
    return ref(connections.value.get(cameraId))
  }

  /**
   * Get stream for a camera
   */
  const getStream = (cameraId: string): MediaStream | null => {
    return connections.value.get(cameraId)?.stream || null
  }

  /**
   * Check if a camera is connected
   */
  const isConnected = (cameraId: string): boolean => {
    return connections.value.get(cameraId)?.connected || false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnectAll()
  })

  return {
    // State
    isSupported,
    connections,

    // Methods
    connect,
    disconnect,
    disconnectAll,
    getConnection,
    getStream,
    isConnected
  }
}

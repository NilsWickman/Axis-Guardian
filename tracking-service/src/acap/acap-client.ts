/**
 * ACAP Client
 *
 * MQTT client for receiving analytics scene metadata from Axis cameras.
 * Transforms ACAP messages and feeds them into the DetectionProcessor.
 */

import mqtt from 'mqtt'
import type { MqttClient, IClientOptions } from 'mqtt'
import type { IDetectionProcessor } from '../detection/detection-processor.js'
import type { CameraRegistry } from '../detection/camera-registry.js'
import type { AcapClientConfig, AcapConnectionStatus, CameraFrameState } from './types.js'
import {
  parseAcapMessage,
  transformAcapToDetection,
  extractDeviceIdFromTopic,
} from './message-transformer.js'

const DEFAULT_RECONNECT_DELAY = 1000
const DEFAULT_MAX_RECONNECT_DELAY = 60000

/** Config with optional auth fields resolved */
type ResolvedAcapClientConfig = Omit<AcapClientConfig, 'username' | 'password'> & {
  reconnectDelay: number
  maxReconnectDelay: number
  username?: string
  password?: string
}

export class AcapClient {
  private client: MqttClient | null = null
  private config: ResolvedAcapClientConfig
  private frameState: Map<string, CameraFrameState> = new Map()
  private messagesReceived = 0
  private detectionsProcessed = 0
  private lastMessageTime: number | null = null
  private lastError: string | null = null
  private activeCameras: Set<string> = new Set()
  private reconnectAttempts = 0
  private isConnecting = false

  constructor(
    private detectionProcessor: IDetectionProcessor,
    private cameraRegistry: CameraRegistry,
    config: AcapClientConfig
  ) {
    this.config = {
      ...config,
      reconnectDelay: config.reconnectDelay ?? DEFAULT_RECONNECT_DELAY,
      maxReconnectDelay: config.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY,
    }
  }

  /**
   * Connect to the MQTT broker and subscribe to analytics topics
   */
  async connect(): Promise<void> {
    if (this.client?.connected || this.isConnecting) {
      console.log('[ACAP] Already connected or connecting')
      return
    }

    this.isConnecting = true

    const brokerUrl = `mqtt://${this.config.brokerHost}:${this.config.brokerPort}`
    console.log(`[ACAP] Connecting to MQTT broker: ${brokerUrl}`)

    const options: IClientOptions = {
      clientId: `axis-guardian-${Date.now()}`,
      clean: true,
      reconnectPeriod: 0, // We handle reconnection manually with exponential backoff
    }

    if (this.config.username) {
      options.username = this.config.username
      options.password = this.config.password
    }

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(brokerUrl, options)

      this.client.on('connect', () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.lastError = null
        console.log('[ACAP] Connected to MQTT broker')

        // Subscribe to analytics scene topics
        const topic = `${this.config.topicPrefix}/#`
        this.client!.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            console.error('[ACAP] Failed to subscribe:', err.message)
            this.lastError = `Subscribe failed: ${err.message}`
            reject(err)
          } else {
            console.log(`[ACAP] Subscribed to: ${topic}`)
            resolve()
          }
        })
      })

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload)
      })

      this.client.on('error', (err) => {
        this.lastError = err.message
        console.error('[ACAP] MQTT error:', err.message)
      })

      this.client.on('close', () => {
        this.isConnecting = false
        console.log('[ACAP] Connection closed')
        this.scheduleReconnect()
      })

      this.client.on('offline', () => {
        console.log('[ACAP] Client offline')
      })

      // Timeout for initial connection
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false
          const err = new Error('Connection timeout')
          this.lastError = err.message
          reject(err)
        }
      }, 10000)
    })
  }

  /**
   * Disconnect from the MQTT broker
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return
    }

    console.log('[ACAP] Disconnecting from MQTT broker')

    return new Promise((resolve) => {
      this.client!.end(false, {}, () => {
        this.client = null
        this.frameState.clear()
        this.activeCameras.clear()
        console.log('[ACAP] Disconnected')
        resolve()
      })
    })
  }

  /**
   * Check if connected to the MQTT broker
   */
  isConnected(): boolean {
    return this.client?.connected ?? false
  }

  /**
   * Get connection status and statistics
   */
  getStatus(): AcapConnectionStatus {
    return {
      connected: this.isConnected(),
      brokerUrl: `mqtt://${this.config.brokerHost}:${this.config.brokerPort}`,
      topics: [`${this.config.topicPrefix}/#`],
      messagesReceived: this.messagesReceived,
      detectionsProcessed: this.detectionsProcessed,
      lastMessageTime: this.lastMessageTime,
      lastError: this.lastError,
      activeCameras: Array.from(this.activeCameras),
    }
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, payload: Buffer): void {
    this.messagesReceived++
    this.lastMessageTime = Date.now()

    // Extract device ID from topic
    const deviceId = extractDeviceIdFromTopic(topic, this.config.topicPrefix)
    if (!deviceId) {
      console.warn(`[ACAP] Could not extract device ID from topic: ${topic}`)
      return
    }

    // Map ACAP device ID to internal camera ID
    const cameraId = this.cameraRegistry.getCameraByAcapDeviceId(deviceId)
    if (!cameraId) {
      // Log only occasionally to avoid spam
      if (this.messagesReceived % 100 === 1) {
        console.warn(`[ACAP] Unknown ACAP device ID: ${deviceId} (not mapped in sitemap)`)
      }
      return
    }

    // Track active cameras
    this.activeCameras.add(deviceId)

    // Parse ACAP message
    const acapMessage = parseAcapMessage(payload)
    if (!acapMessage) {
      return
    }

    // Transform to DetectionMessage
    const detectionMessage = transformAcapToDetection(cameraId, acapMessage, this.frameState)

    // Skip empty frames
    if (detectionMessage.detections.length === 0) {
      return
    }

    this.detectionsProcessed += detectionMessage.detections.length

    // Process through the detection pipeline
    try {
      this.detectionProcessor.processMessage(detectionMessage)
    } catch (error) {
      console.error('[ACAP] Error processing detection:', error)
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (!this.client) {
      return // Already disconnected intentionally
    }

    this.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    )

    console.log(`[ACAP] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.client && !this.client.connected && !this.isConnecting) {
        console.log('[ACAP] Attempting reconnect...')
        this.client.reconnect()
      }
    }, delay)
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.messagesReceived = 0
    this.detectionsProcessed = 0
    this.lastMessageTime = null
    this.lastError = null
    this.activeCameras.clear()
    this.frameState.clear()
  }
}

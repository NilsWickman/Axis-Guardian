/**
 * Composable for managing MQTT detection subscriptions and state
 */

import { ref, computed, onUnmounted, type Ref } from 'vue'
import type { DetectionMessage, CameraDetectionState, DetectionStats } from '@/types/detection.types'

// Use Paho MQTT from CDN (loaded in index.html or via script tag)
declare const Paho: any

interface MQTTClient {
  connect: (options: any) => void
  subscribe: (topic: string, options?: any) => void
  disconnect: () => void
  onConnectionLost: (callback: (response: any) => void) => void
  onMessageArrived: (callback: (message: any) => void) => void
}

export function useDetections() {
  // MQTT client instance
  let mqttClient: MQTTClient | null = null

  // Connection state
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string | null>(null)

  // Detection state per camera
  const cameraDetections = ref<Map<string, CameraDetectionState>>(new Map())

  // Subscribed camera IDs
  const subscribedCameras = ref<Set<string>>(new Set())

  /**
   * Get detections for a specific camera
   */
  const getDetections = (cameraId: string) => {
    return computed(() => cameraDetections.value.get(cameraId)?.detections || [])
  }

  /**
   * Get detection stats for a specific camera
   */
  const getDetectionStats = (cameraId: string): Ref<DetectionStats> => {
    return computed(() => {
      const state = cameraDetections.value.get(cameraId)
      if (!state) return {}

      const stats: DetectionStats = {}
      state.detections.forEach(detection => {
        stats[detection.class_name] = (stats[detection.class_name] || 0) + 1
      })
      return stats
    })
  }

  /**
   * Get total detection count for a camera
   */
  const getTotalCount = (cameraId: string) => {
    return computed(() => cameraDetections.value.get(cameraId)?.total_count || 0)
  }

  /**
   * Connect to MQTT broker
   */
  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isConnected.value || isConnecting.value) {
        resolve()
        return
      }

      // Check if Paho is available
      if (typeof Paho === 'undefined') {
        const error = 'Paho MQTT library not loaded'
        connectionError.value = error
        reject(new Error(error))
        return
      }

      try {
        isConnecting.value = true
        connectionError.value = null

        const clientId = 'surveillance-frontend-' + Math.random().toString(16).substr(2, 8)
        mqttClient = new Paho.MQTT.Client('localhost', 9001, clientId)

        mqttClient.onConnectionLost = (response: any) => {
          console.warn('MQTT connection lost:', response.errorMessage)
          isConnected.value = false

          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            console.log('Attempting to reconnect to MQTT...')
            connect().catch(err => console.error('Reconnection failed:', err))
          }, 5000)
        }

        mqttClient.onMessageArrived = (message: any) => {
          try {
            const payload: DetectionMessage = JSON.parse(message.payloadString)
            handleDetectionMessage(payload)
          } catch (err) {
            console.error('Failed to parse detection message:', err)
          }
        }

        mqttClient.connect({
          onSuccess: () => {
            console.log('Connected to MQTT broker')
            isConnected.value = true
            isConnecting.value = false

            // Resubscribe to all previously subscribed cameras
            subscribedCameras.value.forEach(cameraId => {
              subscribeToCamera(cameraId)
            })

            resolve()
          },
          onFailure: (error: any) => {
            console.error('MQTT connection failed:', error)
            isConnecting.value = false
            connectionError.value = error.errorMessage || 'Connection failed'
            reject(error)
          },
          keepAliveInterval: 60,
          cleanSession: true,
          useSSL: false
        })
      } catch (err) {
        isConnecting.value = false
        connectionError.value = err instanceof Error ? err.message : 'Unknown error'
        reject(err)
      }
    })
  }

  /**
   * Subscribe to detections for a specific camera
   */
  const subscribe = async (cameraId: string) => {
    subscribedCameras.value.add(cameraId)

    // Initialize camera state if it doesn't exist
    if (!cameraDetections.value.has(cameraId)) {
      cameraDetections.value.set(cameraId, {
        camera_id: cameraId,
        last_update: 0,
        detections: [],
        total_count: 0
      })
    }

    // Connect to MQTT if not already connected
    if (!isConnected.value) {
      await connect()
    }

    // Subscribe to camera-specific topic
    subscribeToCamera(cameraId)
  }

  /**
   * Subscribe to MQTT topic for a camera
   */
  const subscribeToCamera = (cameraId: string) => {
    if (!mqttClient || !isConnected.value) return

    const topic = `surveillance/detections/${cameraId}`

    try {
      mqttClient.subscribe(topic, {
        onSuccess: () => {
          console.log(`Subscribed to detection topic: ${topic}`)
        },
        onFailure: (error: any) => {
          console.error(`Failed to subscribe to ${topic}:`, error)
        }
      })
    } catch (err) {
      console.error(`Error subscribing to ${topic}:`, err)
    }
  }

  /**
   * Unsubscribe from a camera's detections
   */
  const unsubscribe = (cameraId: string) => {
    subscribedCameras.value.delete(cameraId)

    if (mqttClient && isConnected.value) {
      const topic = `surveillance/detections/${cameraId}`
      try {
        mqttClient.unsubscribe(topic)
        console.log(`Unsubscribed from ${topic}`)
      } catch (err) {
        console.error(`Error unsubscribing from ${topic}:`, err)
      }
    }

    // Clear detection state for this camera
    cameraDetections.value.delete(cameraId)
  }

  /**
   * Handle incoming detection message
   */
  const handleDetectionMessage = (message: DetectionMessage) => {
    const { camera_id, timestamp, detection_count, detections, timing } = message

    // Update camera state
    const state = cameraDetections.value.get(camera_id)
    if (state) {
      state.last_update = timestamp
      state.detections = detections
      state.total_count += detection_count
      state.timing = timing

      // Trigger reactivity by creating a new Map
      cameraDetections.value = new Map(cameraDetections.value)
    }
  }

  /**
   * Get timing information for a camera
   */
  const getTiming = (cameraId: string) => {
    return computed(() => cameraDetections.value.get(cameraId)?.timing)
  }

  /**
   * Clear detections for a specific camera
   */
  const clearDetections = (cameraId: string) => {
    const state = cameraDetections.value.get(cameraId)
    if (state) {
      state.detections = []
      state.total_count = 0
      cameraDetections.value = new Map(cameraDetections.value)
    }
  }

  /**
   * Clear all detections
   */
  const clearAllDetections = () => {
    cameraDetections.value.forEach(state => {
      state.detections = []
      state.total_count = 0
    })
    cameraDetections.value = new Map(cameraDetections.value)
  }

  /**
   * Disconnect from MQTT broker
   */
  const disconnect = () => {
    if (mqttClient && isConnected.value) {
      try {
        mqttClient.disconnect()
        console.log('Disconnected from MQTT broker')
      } catch (err) {
        console.error('Error disconnecting from MQTT:', err)
      }
    }

    isConnected.value = false
    mqttClient = null
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    connectionError: computed(() => connectionError.value),

    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,

    // Data access
    getDetections,
    getDetectionStats,
    getTotalCount,
    getTiming,

    // Actions
    clearDetections,
    clearAllDetections
  }
}
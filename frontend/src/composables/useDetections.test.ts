import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDetections } from './useDetections'

class MockMqttClient {
  public onConnectionLost: ((response: any) => void) | null = null
  public onMessageArrived: ((message: any) => void) | null = null

  constructor(
    _host: string,
    _port: number,
    _clientId: string,
    private readonly record: {
      subscribedTopics: string[]
      clients: MockMqttClient[]
    }
  ) {
    this.record.clients.push(this)
  }

  connect(options: any) {
    setTimeout(() => options.onSuccess?.(), 10)
  }

  subscribe(topic: string, options?: any) {
    this.record.subscribedTopics.push(topic)
    setTimeout(() => options?.onSuccess?.(), 0)
  }

  unsubscribe(_topic: string) {}

  disconnect() {}
}

describe('useDetections', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    delete (globalThis as any).Paho
  })

  it('waits for the in-flight connection when subscribing multiple cameras', async () => {
    const record = { subscribedTopics: [] as string[], clients: [] as MockMqttClient[] }
    ;(globalThis as any).Paho = {
      MQTT: {
        Client: function (host: string, port: number, clientId: string) {
          return new MockMqttClient(host, port, clientId, record)
        }
      }
    }

    const { subscribe } = useDetections()

    const sub1 = subscribe('camera1')
    const sub2 = subscribe('camera2')

    await vi.runAllTimersAsync()
    await Promise.all([sub1, sub2])

    expect(record.clients).toHaveLength(1)
    expect(record.subscribedTopics).toEqual(
      expect.arrayContaining(['surveillance/detections/camera1', 'surveillance/detections/camera2'])
    )
  })

  it('resubscribes after connection loss', async () => {
    const record = { subscribedTopics: [] as string[], clients: [] as MockMqttClient[] }
    ;(globalThis as any).Paho = {
      MQTT: {
        Client: function (host: string, port: number, clientId: string) {
          return new MockMqttClient(host, port, clientId, record)
        }
      }
    }

    const { subscribe } = useDetections()

    const sub1 = subscribe('camera1')
    const sub2 = subscribe('camera2')
    await vi.runAllTimersAsync()
    await Promise.all([sub1, sub2])

    expect(record.clients).toHaveLength(1)

    const firstClient = record.clients[0]
    firstClient.onConnectionLost?.({})

    await vi.runAllTimersAsync()

    expect(record.clients).toHaveLength(2)

    const cam1Subscriptions = record.subscribedTopics.filter(t => t === 'surveillance/detections/camera1')
    const cam2Subscriptions = record.subscribedTopics.filter(t => t === 'surveillance/detections/camera2')
    expect(cam1Subscriptions.length).toBeGreaterThanOrEqual(2)
    expect(cam2Subscriptions.length).toBeGreaterThanOrEqual(2)
  })
})

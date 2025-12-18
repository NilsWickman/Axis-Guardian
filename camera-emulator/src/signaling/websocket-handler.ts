/**
 * WebSocket signaling handler for mediasoup
 */

import type { FastifyInstance } from 'fastify'
import type * as mediasoup from 'mediasoup'
import type { WebSocket } from 'ws'
import type { ClientSession } from '../types.js'
import { createWebRtcTransport, createConsumerAndDataConsumer } from '../mediasoup/transports.js'
import type { DetectionSync } from '../detections/sync.js'
import {
  WS_ALLOWED_ORIGINS,
  WS_ALLOW_NO_ORIGIN,
  WS_MAX_CONNECTIONS_PER_IP,
  WS_PING_INTERVAL_MS,
} from '../config.js'

interface SignalingMessage {
  type: string
  [key: string]: unknown
}

/**
 * Register WebSocket signaling routes
 */
export function registerWebSocketSignaling(
  app: FastifyInstance,
  router: mediasoup.types.Router,
  videoProducer: mediasoup.types.Producer,
  dataProducer: mediasoup.types.DataProducer,
  detectionSync: DetectionSync
): void {
  const sessions = new Map<WebSocket, ClientSession>()
  const connectionsPerIp = new Map<string, number>()

  app.get('/ws/webrtc', { websocket: true }, (socket, req) => {
    const ws = socket as unknown as WebSocket
    const origin = req.headers.origin
    if (!isAllowedOrigin(origin, WS_ALLOWED_ORIGINS, WS_ALLOW_NO_ORIGIN)) {
      ws.close(1008, 'Origin not allowed')
      return
    }

    const ip = req.ip
    const current = connectionsPerIp.get(ip) ?? 0
    if (current >= WS_MAX_CONNECTIONS_PER_IP) {
      ws.close(1013, 'Too many connections')
      return
    }
    connectionsPerIp.set(ip, current + 1)

    const sessionId = Math.random().toString(36).substring(7)
    console.log(`WebSocket client connected: ${sessionId}`)

    const keepAlive = setupKeepAlive(ws, WS_PING_INTERVAL_MS)

    ws.on('message', async (message: Buffer) => {
      try {
        const data: SignalingMessage = JSON.parse(message.toString())
        await handleMessage(ws, data, sessionId, router, videoProducer, dataProducer, sessions)
      } catch (error) {
        console.error('Error handling message:', error)
        ws.send(JSON.stringify({ type: 'error', error: String(error) }))
      }
    })

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${sessionId}`)
      keepAlive()
      const next = (connectionsPerIp.get(ip) ?? 1) - 1
      if (next <= 0) connectionsPerIp.delete(ip)
      else connectionsPerIp.set(ip, next)

      const session = sessions.get(ws)
      if (session) {
        session.transport.close()
        sessions.delete(ws)
      }
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${sessionId}:`, error)
    })
  })
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
  allowNoOrigin: boolean
): boolean {
  if (!origin) return allowNoOrigin
  return allowedOrigins.includes(origin)
}

function setupKeepAlive(ws: WebSocket, pingIntervalMs: number): () => void {
  let lastPong = Date.now()

  const onPong = () => {
    lastPong = Date.now()
  }

  ws.on('pong', onPong)

  const timer = setInterval(() => {
    if (ws.readyState !== 1) return

    if (Date.now() - lastPong > pingIntervalMs * 2) {
      ws.terminate()
      return
    }

    try {
      ws.ping()
    } catch {
      ws.terminate()
    }
  }, pingIntervalMs)

  return () => {
    clearInterval(timer)
    ws.off('pong', onPong)
  }
}

async function handleMessage(
  ws: WebSocket,
  data: SignalingMessage,
  sessionId: string,
  router: mediasoup.types.Router,
  videoProducer: mediasoup.types.Producer,
  dataProducer: mediasoup.types.DataProducer,
  sessions: Map<WebSocket, ClientSession>
): Promise<void> {
  switch (data.type) {
    case 'getRouterRtpCapabilities': {
      ws.send(JSON.stringify({
        type: 'routerRtpCapabilities',
        rtpCapabilities: router.rtpCapabilities,
      }))
      break
    }

    case 'createTransport': {
      const transport = await createWebRtcTransport(router)
      sessions.set(ws, { id: sessionId, transport })

      ws.send(JSON.stringify({
        type: 'transportCreated',
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          sctpParameters: transport.sctpParameters,
        },
      }))
      break
    }

    case 'connectTransport': {
      const session = sessions.get(ws)
      if (!session) {
        throw new Error('No session found')
      }

      await session.transport.connect({
        dtlsParameters: data.dtlsParameters as mediasoup.types.DtlsParameters,
      })

      ws.send(JSON.stringify({ type: 'transportConnected' }))
      break
    }

    case 'consume': {
      const session = sessions.get(ws)
      if (!session) {
        throw new Error('No session found')
      }

      const { consumer, dataConsumer } = await createConsumerAndDataConsumer(
        session.transport,
        videoProducer,
        dataProducer,
        data.rtpCapabilities as mediasoup.types.RtpCapabilities,
        router
      )

      session.consumer = consumer
      session.dataConsumer = dataConsumer

      ws.send(JSON.stringify({
        type: 'consumed',
        consumerParams: {
          id: consumer.id,
          producerId: videoProducer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        },
        dataConsumerParams: {
          id: dataConsumer.id,
          dataProducerId: dataProducer.id,
          sctpStreamParameters: dataConsumer.sctpStreamParameters,
          label: dataConsumer.label,
        },
      }))
      break
    }

    case 'resumeConsumer': {
      const session = sessions.get(ws)
      if (session?.consumer) {
        console.log(`Resuming consumer ${session.consumer.id}, was paused: ${session.consumer.paused}`)
        await session.consumer.resume()
        console.log(`Consumer resumed, now paused: ${session.consumer.paused}`)

        // Request a keyframe from the producer so the browser can decode
        await session.consumer.requestKeyFrame()
        console.log(`Keyframe requested for consumer ${session.consumer.id}`)

        ws.send(JSON.stringify({ type: 'consumerResumed' }))
      } else {
        console.warn(`resumeConsumer: no session or consumer found`)
      }
      break
    }

    default:
      console.warn(`Unknown message type: ${data.type}`)
  }
}

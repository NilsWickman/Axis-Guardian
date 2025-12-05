/**
 * mediasoup Transport management
 */

import * as mediasoup from 'mediasoup'
import { mediasoupConfig, ffmpegConfig } from '../config.js'

/**
 * Create PlainTransport to receive RTP from FFmpeg
 * Returns the actual port FFmpeg should send to and a function to create the producer
 * The producer should be created AFTER FFmpeg starts sending (for comedia mode)
 */
export async function createPlainTransport(
  router: mediasoup.types.Router,
  _rtpPort: number  // Unused - we use mediasoup's auto-assigned port
): Promise<{
  transport: mediasoup.types.PlainTransport
  rtpPort: number  // The actual port FFmpeg should send RTP to
  createProducer: () => Promise<mediasoup.types.Producer>
}> {
  const transport = await router.createPlainTransport({
    listenIp: { ip: '127.0.0.1' },
    rtcpMux: true,  // Use single port for RTP and RTCP
    comedia: true,  // Auto-detect source from incoming RTP
  })

  // Get the actual listening port
  const rtpPort = transport.tuple.localPort

  console.log(`PlainTransport created, listening on port ${rtpPort}`)

  // Log when transport tuple is updated (comedia detected source)
  transport.on('tuple', (tuple) => {
    console.log(`PlainTransport tuple updated: ${tuple.localIp}:${tuple.localPort} <- ${tuple.remoteIp}:${tuple.remotePort}`)
  })

  // Function to create producer - call after FFmpeg starts sending
  const createProducer = async (): Promise<mediasoup.types.Producer> => {
    const producer = await transport.produce({
      kind: 'video',
      rtpParameters: {
        codecs: [{
          mimeType: 'video/H264',
          clockRate: 90000,
          payloadType: ffmpegConfig.payloadType,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
          },
        }],
        encodings: [{ ssrc: 12345678 }],  // Fixed SSRC - must match FFmpeg
      },
    })

    console.log(`Video Producer created (id: ${producer.id})`)

    // Log producer score changes
    producer.on('score', (score) => {
      console.log(`Video Producer score: ${JSON.stringify(score)}`)
    })

    return producer
  }

  return { transport, rtpPort, createProducer }
}

/**
 * Create DirectTransport for server-side data production (server→client)
 * This allows the server to send data via DataChannels to connected clients
 */
export async function createDirectTransport(
  router: mediasoup.types.Router
): Promise<mediasoup.types.DirectTransport> {
  const transport = await router.createDirectTransport()
  console.log(`DirectTransport created (id: ${transport.id})`)
  return transport
}

/**
 * Create DataProducer on DirectTransport for sending detections to clients
 */
export async function createDataProducerOnDirect(
  transport: mediasoup.types.DirectTransport
): Promise<mediasoup.types.DataProducer> {
  const dataProducer = await transport.produceData({
    label: 'detections',
    protocol: '',
  })
  console.log(`DataProducer on DirectTransport created (id: ${dataProducer.id})`)
  return dataProducer
}

/**
 * Create WebRtcTransport for browser clients
 */
export async function createWebRtcTransport(
  router: mediasoup.types.Router
): Promise<mediasoup.types.WebRtcTransport> {
  const transport = await router.createWebRtcTransport(mediasoupConfig.webRtcTransport)

  transport.on('dtlsstatechange', (dtlsState) => {
    console.log(`WebRtcTransport ${transport.id} DTLS state: ${dtlsState}`)
    if (dtlsState === 'closed') {
      transport.close()
    }
  })

  transport.on('icestatechange', (iceState) => {
    console.log(`WebRtcTransport ${transport.id} ICE state: ${iceState}`)
  })

  console.log(`WebRtcTransport created (id: ${transport.id})`)
  return transport
}

/**
 * Create video Consumer and DataConsumer for a client
 *
 * @param transport - Client's WebRtcTransport
 * @param videoProducer - Video producer from FFmpeg PlainTransport
 * @param dataProducer - DataProducer from DirectTransport (server→client)
 * @param rtpCapabilities - Client's RTP capabilities
 * @param router - mediasoup Router
 */
export async function createConsumerAndDataConsumer(
  transport: mediasoup.types.WebRtcTransport,
  videoProducer: mediasoup.types.Producer,
  dataProducer: mediasoup.types.DataProducer,
  rtpCapabilities: mediasoup.types.RtpCapabilities,
  router: mediasoup.types.Router
): Promise<{
  consumer: mediasoup.types.Consumer
  dataConsumer: mediasoup.types.DataConsumer
}> {
  // Check if we can consume the producer
  if (!router.canConsume({ producerId: videoProducer.id, rtpCapabilities })) {
    throw new Error('Cannot consume video producer')
  }

  // Create video consumer - start paused, client will resume after setup
  const consumer = await transport.consume({
    producerId: videoProducer.id,
    rtpCapabilities,
    paused: true,  // Start paused, client will resume
  })

  console.log(`Video Consumer created (id: ${consumer.id}, paused: ${consumer.paused})`)
  console.log(`Consumer RTP parameters:`, JSON.stringify(consumer.rtpParameters, null, 2))

  // Log consumer score changes
  consumer.on('score', (score) => {
    console.log(`Video Consumer ${consumer.id} score: ${JSON.stringify(score)}`)
  })

  // Log producer and consumer score periodically
  consumer.on('producerresume', () => {
    console.log(`Consumer ${consumer.id}: producer resumed`)
  })

  consumer.on('producerpause', () => {
    console.log(`Consumer ${consumer.id}: producer paused`)
  })

  // Create DataConsumer to receive from server's DirectTransport DataProducer
  const dataConsumer = await transport.consumeData({
    dataProducerId: dataProducer.id,
  })

  console.log(`DataConsumer created (id: ${dataConsumer.id}, label: ${dataConsumer.label})`)

  return { consumer, dataConsumer }
}

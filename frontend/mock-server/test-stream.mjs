import { createTRPCClient, createWSClient, wsLink, httpBatchLink, splitLink } from '@trpc/client'

// Create WebSocket client
const wsClient = createWSClient({
  url: 'ws://localhost:3002',
})

// Create tRPC client
const trpc = createTRPCClient({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink({ client: wsClient }),
      false: httpBatchLink({ url: 'http://localhost:3001' }),
    }),
  ],
})

console.log('🧪 Testing tRPC camera stream...\n')

// Test query first
console.log('📋 Fetching available cameras...')
const result = await trpc.getCameras.query()
console.log('✅ Available cameras:', result)
console.log('')

// Test subscription
console.log('📹 Starting camera stream subscription...')
let frameCount = 0
const MAX_FRAMES = 5

const subscription = trpc.streamCamera.subscribe(
  { cameraId: 'camera-1', fps: 5 },
  {
    onData: (data) => {
      frameCount++
      console.log(`📸 Frame ${frameCount}:`)
      console.log(`   Camera: ${data.cameraId}`)
      console.log(`   Timestamp: ${data.timestamp}`)
      console.log(`   Frame data length: ${data.frame.length} chars`)
      console.log(`   Metadata:`, data.metadata)
      console.log('')

      if (frameCount >= MAX_FRAMES) {
        console.log('✅ Test successful! Received 5 frames.')
        console.log('🛑 Stopping subscription...')
        subscription.unsubscribe()
        wsClient.close()
        process.exit(0)
      }
    },
    onError: (err) => {
      console.error('❌ Subscription error:', err)
      wsClient.close()
      process.exit(1)
    },
  }
)

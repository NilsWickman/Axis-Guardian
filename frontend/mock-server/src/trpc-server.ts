import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { WebSocketServer } from 'ws'
import { appRouter } from './trpc.js'

const PORT = 3001

// Create HTTP server for queries/mutations
const server = createHTTPServer({
  router: appRouter,
})

// Create WebSocket server for subscriptions
const wss = new WebSocketServer({
  port: 3002,
})

const handler = applyWSSHandler({
  wss,
  router: appRouter,
})

wss.on('connection', (ws) => {
  console.log(`✅ WebSocket connection established (${wss.clients.size} total clients)`)
  ws.once('close', () => {
    console.log(`❌ WebSocket connection closed (${wss.clients.size} remaining clients)`)
  })
})

// Start HTTP server
server.listen(PORT)
console.log(`🚀 tRPC HTTP Server listening on http://localhost:${PORT}`)
console.log(`🔌 tRPC WebSocket Server listening on ws://localhost:3002`)

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing servers')
  handler.broadcastReconnectNotification()
  wss.close()
  server.server.close()
})

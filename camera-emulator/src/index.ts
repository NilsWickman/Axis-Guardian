/**
 * Camera Emulator Entry Point
 * Node.js mediasoup-based camera emulator
 */

import { cameras } from './config.js'
import { createCameraEmulator } from './server.js'

async function main() {
  console.log('Starting camera emulator(s)...')

  const emulators = []

  for (const config of cameras) {
    try {
      const emulator = await createCameraEmulator(config)
      await emulator.start()
      emulators.push(emulator)
    } catch (error) {
      console.error(`Failed to start camera ${config.cameraId}:`, error)
      process.exit(1)
    }
  }

  console.log(`\nAll ${emulators.length} camera emulator(s) started successfully`)
  console.log('Press Ctrl+C to stop\n')

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    for (const emulator of emulators) {
      await emulator.stop()
    }
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...')
    for (const emulator of emulators) {
      await emulator.stop()
    }
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

/**
 * Camera Emulator Entry Point
 * Node.js mediasoup-based camera emulator
 */

import { cameras } from './config.js'
import { createCameraEmulator, type CameraEmulatorServer } from './server.js'
import type { SyncCoordinator } from './types.js'

async function main() {
  console.log('Starting camera emulator(s)...')

  if (cameras.length === 0) {
    console.error('No cameras available to start - check VIDEO_PATH and video files')
    process.exit(1)
  }

  const emulators: CameraEmulatorServer[] = []

  // Create sync coordinator for multi-camera time synchronization
  // All cameras will share this start time and coordinate loop resets
  // Calculate start time AFTER all cameras are created (will be set before FFmpeg starts)
  let sharedStartTime = 0

  const syncCoordinator: SyncCoordinator = {
    get sharedStartTime() { return sharedStartTime },
    onSyncReset: () => {
      // When any camera loops, reset all cameras to the same start time
      const newStartTime = Date.now()
      console.log(`[Sync] Coordinated loop reset at ${newStartTime}`)
      for (const emulator of emulators) {
        emulator.getFFmpegStreamer().resetStartTime(newStartTime)
      }
    },
  }

  // Create cameras SEQUENTIALLY to avoid mediasoup race conditions
  // But they'll all use the same shared start time for synchronization
  console.log(`[Sync] Creating ${cameras.length} cameras...`)
  for (const config of cameras) {
    try {
      const emulator = await createCameraEmulator(config, syncCoordinator)
      emulators.push(emulator)
    } catch (error) {
      console.error(`Failed to create camera ${config.cameraId}:`, error)
      console.warn(`Continuing without ${config.cameraId}...`)
    }
  }

  if (emulators.length === 0) {
    console.error('No cameras could be created successfully')
    process.exit(1)
  }

  // Set the shared start time NOW - all FFmpeg processes are running but using Date.now()
  // This syncs them to the same reference point
  sharedStartTime = Date.now()
  for (const emulator of emulators) {
    emulator.getFFmpegStreamer().resetStartTime(sharedStartTime)
  }

  // Start HTTP servers (FFmpeg already running from createCameraEmulator)
  console.log(`[Sync] Starting ${emulators.length} camera servers...`)
  for (const emulator of emulators) {
    await emulator.start()
  }

  console.log(`\n${emulators.length}/${cameras.length} camera emulator(s) started successfully`)
  console.log(`[Sync] All cameras synchronized to start time: ${sharedStartTime}`)
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
